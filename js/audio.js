/* ==========================================================
   ZUPPY — Audio (musik latar + efek suara)
   Semua suara dibuat dengan Web Audio API (tanpa file audio).
   - Musik: loop 8 birama bernuansa ceria
   - Efek: select, correct, wrong, next, finish, lose, toggle
   - Preferensi mute disimpan di LocalStorage ("zuppy_audio")

   Browser memblokir suara sebelum ada interaksi pengguna, jadi
   panggil ZuppyAudio.unlock() dari klik / tombol pertama.
   ========================================================== */
(() => {
  "use strict";

  const STORE_KEY = "zuppy_audio";
  const BPM = 120;
  const STEP = 60 / BPM / 2;     // satu langkah = not 1/8 (0,25 detik)
  const MUSIC_VOL = 0.2;
  const SFX_VOL = 0.55;

  /* ---------- Preferensi ---------- */
  function loadPrefs() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(STORE_KEY)) || {};
      return { music: raw.music !== false, sfx: raw.sfx !== false };
    } catch (error) {
      return { music: true, sfx: true };
    }
  }

  function savePrefs() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
    } catch (error) {
      /* abaikan jika penyimpanan diblokir */
    }
  }

  const prefs = loadPrefs();

  /* ---------- Audio context ---------- */
  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let leadBus = null;
  let hatBus = null;
  let noiseBuffer = null;

  let timer = null;
  let nextTime = 0;
  let step = 0;
  let musicRunning = false;
  let ready = false;

  function ensureCtx() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    ctx = new AudioCtx();

    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = SFX_VOL;
    sfxGain.connect(master);

    leadBus = ctx.createBiquadFilter();
    leadBus.type = "lowpass";
    leadBus.frequency.value = 2400;
    leadBus.connect(musicGain);

    hatBus = ctx.createBiquadFilter();
    hatBus.type = "highpass";
    hatBus.frequency.value = 7000;
    hatBus.connect(musicGain);

    const length = Math.floor(ctx.sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;

    return ctx;
  }

  const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  /** Satu nada dengan envelope singkat. */
  function voice(dest, freq, start, duration, type, peak, slideTo) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /** Ketukan hi-hat dari noise. */
  function hat(start, peak) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = noiseBuffer;
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
    source.connect(gain);
    gain.connect(hatBus);
    source.start(start);
    source.stop(start + 0.06);
  }

  /* ---------- Musik ---------- */
  // Akor per birama: C - Am - F - G (diulang dua kali)
  const ROOTS = [48, 45, 41, 43, 48, 45, 41, 43];

  // Melodi: 8 not per birama (null = jeda)
  const MELODY = [
    [76, 79, 84, 79, 76, 79, 74, 72],
    [81, 79, 76, 72, 76, 79, 81, null],
    [77, 81, 84, 81, 77, 81, 79, 77],
    [79, 83, 86, 83, 79, 74, 71, null],
    [72, 76, 79, 76, 72, 76, 79, 84],
    [81, 84, 81, 79, 76, 79, 76, 72],
    [77, 79, 81, 84, 81, 79, 77, 74],
    [79, 79, 83, 74, 79, 83, 86, null],
  ];

  function playStep(index, time) {
    const bar = Math.floor(index / 8) % 8;
    const pos = index % 8;
    const root = ROOTS[bar];

    if (pos % 2 === 0) {
      const bassNote = pos % 4 === 0 ? root : root + 7;
      voice(musicGain, midiToHz(bassNote), time, STEP * 1.8, "triangle", 0.55);
    }

    const note = MELODY[bar][pos];
    if (note) voice(leadBus, midiToHz(note), time, STEP * 0.9, "square", 0.3);

    hat(time, pos % 2 ? 0.12 : 0.06);
  }

  function schedule() {
    if (!ctx || !musicRunning) return;
    while (nextTime < ctx.currentTime + 0.3) {
      playStep(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % 64;
    }
  }

  function startMusic() {
    const c = ensureCtx();
    if (!c || musicRunning || !ready) return;
    musicRunning = true;
    nextTime = c.currentTime + 0.08;
    musicGain.gain.cancelScheduledValues(c.currentTime);
    musicGain.gain.setTargetAtTime(MUSIC_VOL, c.currentTime, 0.25);
    timer = window.setInterval(schedule, 90);
    schedule();
  }

  function stopMusic(fade = 0.2) {
    if (!ctx) return;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, Math.max(0.03, fade / 3));
    musicRunning = false;
    window.clearInterval(timer);
    timer = null;
  }

  /* ---------- Efek suara ---------- */
  const SFX = {
    select(t) {
      voice(sfxGain, 520, t, 0.09, "sine", 0.5, 820);
    },
    correct(t) {
      [72, 76, 79, 84].forEach((midi, i) => voice(sfxGain, midiToHz(midi), t + i * 0.075, 0.22, "triangle", 0.5));
      voice(sfxGain, midiToHz(96), t + 0.3, 0.25, "sine", 0.18);
    },
    wrong(t) {
      voice(sfxGain, 196, t, 0.2, "square", 0.22, 150);
      voice(sfxGain, 147, t + 0.18, 0.32, "square", 0.22, 100);
    },
    next(t) {
      voice(sfxGain, 300, t, 0.14, "triangle", 0.35, 700);
    },
    finish(t) {
      [72, 76, 79, 84].forEach((midi, i) => voice(sfxGain, midiToHz(midi), t + i * 0.11, 0.25, "square", 0.25));
      [72, 76, 79, 84].forEach((midi) => voice(sfxGain, midiToHz(midi), t + 0.5, 0.9, "triangle", 0.3));
    },
    lose(t) {
      [67, 64, 60].forEach((midi, i) => voice(sfxGain, midiToHz(midi), t + i * 0.2, 0.3, "triangle", 0.4));
    },
    toggle(t) {
      voice(sfxGain, 660, t, 0.07, "sine", 0.4, 880);
    },
  };

  function play(name) {
    if (!prefs.sfx || !SFX[name]) return;
    const c = ensureCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    SFX[name](c.currentTime + 0.01);
  }

  /* ---------- Kontrol ---------- */
  /** Panggil dari interaksi pengguna agar browser mengizinkan suara. */
  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === "suspended") {
      c.resume().then(() => {
        ready = true;
        if (prefs.music) startMusic();
      }).catch(() => { /* abaikan */ });
    } else if (!ready) {
      ready = true;
      if (prefs.music) startMusic();
    }
  }

  function setMusic(on) {
    prefs.music = !!on;
    savePrefs();
    if (prefs.music) startMusic();
    else stopMusic();
  }

  function setSfx(on) {
    prefs.sfx = !!on;
    savePrefs();
  }

  // Jeda saat tab disembunyikan
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (ready) ctx.resume();
  });

  window.ZuppyAudio = {
    unlock,
    play,
    setMusic,
    setSfx,
    stopMusic,
    isMusicOn: () => prefs.music,
    isSfxOn: () => prefs.sfx,
  };
})();