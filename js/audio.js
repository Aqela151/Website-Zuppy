/* ==========================================================
   ZUPPY — Audio (musik latar + efek suara)
   Semua suara dibuat dengan Web Audio API (tanpa file audio).
   - Musik "game": loop ceria untuk gameplay (tanpa batas)
   - Musik "victory": loop kemenangan untuk halaman hasil (3 putaran lalu memudar)
   - Efek: select, correct, wrong, next, finish, lose, toggle
   - Preferensi mute disimpan di LocalStorage ("zuppy_audio")

   Browser memblokir suara sebelum ada interaksi pengguna, jadi
   panggil ZuppyAudio.unlock() dari klik / tombol pertama.

   Halaman hasil: <body data-music="victory"> menyalakan fanfare + musik
   kemenangan otomatis (bila bintang > 0). Tombol [data-audio-toggle="music"]
   dan elemen #audioHint dikelola otomatis.
   ========================================================== */
(() => {
  "use strict";

  const STORE_KEY = "zuppy_audio";
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
  let loopCount = 0;
  let musicRunning = false;
  let ready = false;

  let desiredTrack = "game";
  let currentTrack = "game";
  let readyHook = null;

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
  // Setiap track: 8 birama x 8 not (1/8). roots = nada bass per birama,
  // melody = melodi per birama (null = jeda). loops 0 = tanpa batas.
  const TRACKS = {
    // Gameplay: C - Am - F - G
    game: {
      bpm: 120,
      loops: 0,
      roots: [48, 45, 41, 43, 48, 45, 41, 43],
      melody: [
        [76, 79, 84, 79, 76, 79, 74, 72],
        [81, 79, 76, 72, 76, 79, 81, null],
        [77, 81, 84, 81, 77, 81, 79, 77],
        [79, 83, 86, 83, 79, 74, 71, null],
        [72, 76, 79, 76, 72, 76, 79, 84],
        [81, 84, 81, 79, 76, 79, 76, 72],
        [77, 79, 81, 84, 81, 79, 77, 74],
        [79, 79, 83, 74, 79, 83, 86, null],
      ],
      leadVol: 0.3,
      bassVol: 0.55,
    },
    // Kemenangan: G - D - Em - C - G - D - C - D
    victory: {
      bpm: 132,
      loops: 3,
      roots: [55, 50, 52, 48, 55, 50, 48, 50],
      melody: [
        [79, 83, 86, 83, 79, 83, 86, 83],
        [78, 81, 86, 81, 78, 81, 86, 81],
        [76, 79, 83, 79, 76, 79, 83, 79],
        [84, 79, 76, 79, 84, 79, 76, 72],
        [74, 76, 79, 83, 86, 83, 79, 76],
        [74, 78, 81, 78, 74, 78, 81, 86],
        [72, 76, 79, 84, 79, 76, 72, null],
        [74, 78, 81, 86, 81, 78, 74, null],
      ],
      leadVol: 0.28,
      bassVol: 0.5,
    },
  };

  function playStep(track, index, time) {
    const bar = Math.floor(index / 8) % track.roots.length;
    const pos = index % 8;
    const root = track.roots[bar];
    const stepTime = 60 / track.bpm / 2;

    if (pos % 2 === 0) {
      const bassNote = pos % 4 === 0 ? root : root + 7;
      voice(musicGain, midiToHz(bassNote), time, stepTime * 1.8, "triangle", track.bassVol);
    }

    const note = track.melody[bar][pos];
    if (note) voice(leadBus, midiToHz(note), time, stepTime * 0.9, "square", track.leadVol);

    hat(time, pos % 2 ? 0.12 : 0.06);
  }

  function schedule() {
    if (!ctx || !musicRunning) return;
    const track = TRACKS[currentTrack];
    const stepTime = 60 / track.bpm / 2;
    const total = track.roots.length * 8;

    while (nextTime < ctx.currentTime + 0.3) {
      playStep(track, step, nextTime);
      nextTime += stepTime;
      step += 1;
      if (step >= total) {
        step = 0;
        loopCount += 1;
        if (track.loops && loopCount >= track.loops) {
          stopMusic(1.6); // selesai: memudar pelan
          return;
        }
      }
    }
  }

  function startMusic(name = desiredTrack) {
    const c = ensureCtx();
    if (!c || !ready || !TRACKS[name]) return;
    if (musicRunning && currentTrack === name) return;
    window.clearInterval(timer);

    currentTrack = name;
    step = 0;
    loopCount = 0;
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
  const hintEl = () => document.getElementById("audioHint");

  function hideHint() {
    const el = hintEl();
    if (el) el.hidden = true;
  }

  function becomeReady() {
    if (ready) return;
    ready = true;
    hideHint();
    if (readyHook) readyHook();
    else if (prefs.music) startMusic();
  }

  /** Panggil dari interaksi pengguna agar browser mengizinkan suara. */
  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === "suspended") {
      c.resume().then(becomeReady).catch(() => { /* abaikan */ });
    } else {
      becomeReady();
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

  /* ---------- Tombol toggle otomatis ([data-audio-toggle]) ---------- */
  function bindToggles() {
    document.querySelectorAll("[data-audio-toggle]").forEach((btn) => {
      const kind = btn.dataset.audioToggle;

      const sync = () => {
        const on = kind === "music" ? prefs.music : prefs.sfx;
        const label = `${on ? "Matikan" : "Nyalakan"} ${kind === "music" ? "musik" : "efek suara"}`;
        btn.classList.toggle("is-off", !on);
        btn.setAttribute("aria-pressed", String(on));
        btn.setAttribute("aria-label", label);
        btn.title = label;
      };

      btn.addEventListener("click", () => {
        if (kind === "music") setMusic(!prefs.music);
        else setSfx(!prefs.sfx);
        sync();
        play("toggle");
      });
      sync();
    });
  }

  /* ---------- Halaman hasil: <body data-music="victory"> ---------- */
  function initResultPage() {
    // Bintang dihitung dari tampilan hasil (learning.js dimuat lebih dulu)
    const earned = document.querySelectorAll(".stars--lg .star.is-on").length;
    desiredTrack = "victory";

    readyHook = () => {
      if (earned > 0) {
        play("finish");
        window.setTimeout(() => {
          if (prefs.music && ready) startMusic("victory");
        }, 900);
      } else {
        play("lose");
      }
    };

    ["pointerdown", "click", "touchend", "keydown"].forEach((type) => {
      window.addEventListener(type, unlock, { capture: true, passive: true });
    });

    // Coba otomatis; bila diblokir browser, tampilkan petunjuk
    unlock();
    window.setTimeout(() => {
      const hint = hintEl();
      if (!ready && prefs.music && hint) hint.hidden = false;
    }, 800);
  }

  bindToggles();
  if (document.body.dataset.music === "victory") initResultPage();

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