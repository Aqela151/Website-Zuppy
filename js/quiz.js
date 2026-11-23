/* ==========================================================
   ZUPPY — Gameplay (pages/quiz.html)
   Petualangan 5 soal: Zuppy berjalan di jalur sambil siswa menjawab.
   Hasil disimpan sekali di akhir permainan, lalu menuju result.html.
   Musik & efek suara: js/audio.js (ZuppyAudio), dengan tombol mute.
   Bergantung pada: components.js, storage.js, game.js, audio.js,
   data/subjects.js, data/questions.js
   ========================================================== */
(() => {
  "use strict";

  const Storage = window.ZuppyStorage;
  const Data = window.ZuppyData || {};
  const Game = window.ZuppyGame;
  const Sound = window.ZuppyAudio || {
    unlock() {}, play() {}, stopMusic() {}, setMusic() {}, setSfx() {},
    isMusicOn: () => false, isSfxOn: () => false,
  };

  const user = Storage.requireAuth("login.html");
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("subject") || "";
  const levelNo = parseInt(String(params.get("id") || "").replace("level-", ""), 10);

  const subject = (Data.subjects || []).find((s) => s.id === subjectId) || null;
  const allLevels = (Data.levels || {})[subjectId] || [];
  const level = allLevels.find((l) => l.id === levelNo) || null;
  const CONFIG = Data.game || { xpPerCorrect: 10, xpPerStar: 10, scorePerCorrect: 100 };

  const levelsUrl = subject ? `subjects.html?subject=${encodeURIComponent(subjectId)}` : "subjects.html";

  // Level tidak valid atau masih terkunci: kembali ke peta level
  if (!subject || !level || !level.questions.length) {
    window.location.replace(levelsUrl);
    return;
  }
  const status = Storage.getLevelStatus(user.id, subjectId, allLevels.length)[levelNo - 1];
  if (!status || !status.unlocked) {
    window.location.replace(levelsUrl);
    return;
  }

  /* ---------- Soal (acak urutan pilihan untuk pilihan ganda) ---------- */
  const prepared = level.questions.map((q) => {
    const items = q.options.map((text, i) => ({ text, correct: i === q.answer }));
    return { ...q, items: q.type === "mc" ? Game.shuffle(items) : items };
  });
  const total = prepared.length;

  const state = { idx: 0, correct: 0, answered: false, busy: false, finished: false, results: [] };

  /* ---------- Elemen ---------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    game: $("game"), segs: $("segs"), progressText: $("progressText"),
    hudSubject: $("hudSubject"), hudLevel: $("hudLevel"), hudScore: $("hudScore"), hudXp: $("hudXp"),
    quest: $("quest"), narration: $("narration"), qType: $("qType"), qCount: $("qCount"), qText: $("qText"),
    qOptions: $("qOptions"), feedback: $("feedback"), fbTitle: $("fbTitle"), fbText: $("fbText"), nextBtn: $("nextBtn"),
    trailNodes: $("trailNodes"), walker: $("walker"), bubble: $("bubble"), mascot: $("mascot"),
    exitBtn: $("exitBtn"), musicBtn: $("musicBtn"), sfxBtn: $("sfxBtn"),
  };

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const ICON_CHECK = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5"/></svg>';
  const ICON_X = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const SAY = {
    idle: ["Kamu pasti bisa! Pilih jawabanmu.", "Baca soalnya pelan-pelan, ya.", "Zuppy siap menemanimu!"],
    excited: ["Sedikit lagi sampai! Semangat!", "Garis finis sudah dekat!"],
    correct: ["Yeay! Jawabanmu benar!", "Keren banget!", "Mantap! Terus lanjut!"],
    wrong: ["Hmm, belum tepat. Baca penjelasannya, ya.", "Tidak apa-apa, kita belajar dari sini!"],
  };

  /** Ekspresi dasar: makin dekat akhir, makin semangat. */
  const baseMood = () => (state.idx >= total - 2 ? "excited" : "idle");

  function narration(idx) {
    const place = level.place;
    if (idx === total - 1) return `Gerbang harta karun ${place}! Jawab soal terakhir untuk membuka petinya!`;
    return [
      `Zuppy memasuki ${place}. Gerbang pertama menghadang!`,
      `Jalan setapak menuju jantung ${place}. Rintangan kedua muncul!`,
      `Setengah perjalanan! Kabut tebal menyelimuti ${place}.`,
      "Tujuan mulai terlihat. Tinggal beberapa rintangan lagi!",
    ][Math.min(idx, 3)];
  }

  /* ---------- Tombol suara ---------- */
  function syncAudioButtons() {
    [
      [el.musicBtn, Sound.isMusicOn(), "musik"],
      [el.sfxBtn, Sound.isSfxOn(), "efek suara"],
    ].forEach(([btn, on, label]) => {
      if (!btn) return;
      btn.classList.toggle("is-off", !on);
      btn.setAttribute("aria-pressed", String(on));
      const text = `${on ? "Matikan" : "Nyalakan"} ${label}`;
      btn.setAttribute("aria-label", text);
      btn.title = text;
    });
  }

  /* ---------- Setup tampilan ---------- */
  function buildTrail() {
    el.segs.innerHTML = prepared.map(() => '<span class="seg"></span>').join("");
    el.trailNodes.innerHTML = prepared.map((_, i) => {
      const x = total > 1 ? (i / (total - 1)) * 100 : 50;
      return `<span class="trail__node" data-x="${x}">${i + 1}</span>`;
    }).join("");
    el.trailNodes.querySelectorAll(".trail__node").forEach((node) => node.style.setProperty("--x", `${node.dataset.x}%`));
  }

  function updateTrail() {
    el.trailNodes.querySelectorAll(".trail__node").forEach((node, i) => {
      node.classList.toggle("is-current", i === state.idx && !state.finished);
      const result = state.results[i];
      node.classList.toggle("is-correct", result === true);
      node.classList.toggle("is-wrong", result === false);
      if (result === true) node.innerHTML = ICON_CHECK;
      else if (result === false) node.innerHTML = ICON_X;
      else node.textContent = String(i + 1);
    });
    el.segs.querySelectorAll(".seg").forEach((seg, i) => {
      const result = state.results[i];
      seg.classList.toggle("is-current", i === state.idx && result === undefined);
      seg.classList.toggle("is-correct", result === true);
      seg.classList.toggle("is-wrong", result === false);
    });
  }

  function moveMascot(animate = true) {
    const x = total > 1 ? (state.idx / (total - 1)) * 100 : 50;
    const edge = state.idx === 0 ? "start" : state.idx === total - 1 ? "end" : "mid";
    el.walker.dataset.edge = edge;
    el.walker.style.setProperty("--x", `${x}%`);
    if (animate) {
      el.walker.classList.add("is-walking");
      window.setTimeout(() => el.walker.classList.remove("is-walking"), 900);
    }
  }

  function say(list) { el.bubble.textContent = pick(list); }

  function updateHud(bump) {
    el.hudScore.textContent = `Skor ${state.correct * CONFIG.scorePerCorrect}`;
    el.hudXp.textContent = `${state.correct * CONFIG.xpPerCorrect} XP`;
    el.progressText.textContent = `Soal ${Math.min(state.idx + 1, total)} dari ${total}`;
    if (bump) {
      Game.restartAnim(el.hudScore, "is-bump");
      Game.restartAnim(el.hudXp, "is-bump");
    }
  }

  /* ---------- Soal ---------- */
  function renderQuestion() {
    const q = prepared[state.idx];
    const isTf = q.type === "tf";

    el.narration.textContent = narration(state.idx);
    el.qType.textContent = isTf ? "Benar atau Salah" : "Pilihan Ganda";
    el.qCount.textContent = `${state.idx + 1}/${total}`;
    el.qText.textContent = q.q;

    el.qOptions.className = `opts${isTf ? " opts--tf" : ""}`;
    el.qOptions.innerHTML = q.items.map((item, i) => `
      <button class="opt" type="button" data-i="${i}">
        <span class="opt__key">${isTf ? (i === 0 ? "B" : "S") : String.fromCharCode(65 + i)}</span>
        <span class="opt__text">${esc(item.text)}</span>
        <span class="opt__mark" aria-hidden="true"></span>
      </button>`).join("");

    el.feedback.hidden = true;
    el.feedback.className = "feedback";
    el.nextBtn.hidden = true;

    updateTrail();
    updateHud(false);

    const mood = baseMood();
    Game.setMood(el.mascot, mood);
    say(mood === "excited" ? SAY.excited : SAY.idle);
  }

  function answer(choice) {
    if (state.answered || state.finished || state.busy) return;
    const q = prepared[state.idx];
    const picked = q.items[choice];
    if (!picked) return;

    state.answered = true;
    Sound.play("select");

    const isCorrect = picked.correct;
    state.results[state.idx] = isCorrect;
    if (isCorrect) state.correct += 1;

    // Tandai pilihan
    el.qOptions.querySelectorAll(".opt").forEach((btn, i) => {
      btn.disabled = true;
      const mark = btn.querySelector(".opt__mark");
      if (q.items[i].correct) {
        btn.classList.add("is-correct");
        mark.innerHTML = ICON_CHECK;
      } else if (i === choice) {
        btn.classList.add("is-wrong");
        mark.innerHTML = ICON_X;
      } else {
        btn.classList.add("is-dim");
      }
    });

    // Umpan balik + penjelasan
    const correctText = q.items.find((item) => item.correct).text;
    el.feedback.hidden = false;
    el.feedback.className = `feedback ${isCorrect ? "feedback--ok" : "feedback--no"} is-in`;
    el.fbTitle.textContent = isCorrect ? `Benar! +${CONFIG.xpPerCorrect} XP` : "Belum tepat";
    el.fbText.textContent = isCorrect
      ? q.explain
      : `Jawaban yang benar: ${correctText}. ${q.explain}`;

    // Efek, suara & maskot
    if (isCorrect) {
      const gain = document.createElement("span");
      gain.className = "float-xp";
      gain.textContent = `+${CONFIG.xpPerCorrect} XP`;
      el.quest.appendChild(gain);
      window.setTimeout(() => gain.remove(), 1200);
      window.setTimeout(() => Sound.play("correct"), 130);
      Game.setMood(el.mascot, "happy", { revertMs: 1500, revertTo: baseMood() });
      say(SAY.correct);
    } else {
      Game.restartAnim(el.quest, "is-shake");
      window.setTimeout(() => Sound.play("wrong"), 130);
      Game.setMood(el.mascot, "confused", { revertMs: 1700, revertTo: baseMood() });
      say(SAY.wrong);
    }

    updateTrail();
    updateHud(isCorrect);

    el.nextBtn.textContent = state.idx >= total - 1 ? "Lihat Hasil" : "Lanjut";
    el.nextBtn.hidden = false;
    el.nextBtn.focus();
  }

  function next() {
    if (!state.answered || state.finished || state.busy) return;
    if (state.idx >= total - 1) { finish(); return; }

    state.busy = true;
    Sound.play("next");
    el.quest.classList.add("is-leaving");
    window.setTimeout(() => {
      state.idx += 1;
      state.answered = false;
      moveMascot(true);
      renderQuestion();
      el.quest.classList.remove("is-leaving");
      Game.restartAnim(el.quest, "is-entering");
      state.busy = false;
    }, 260);
  }

  /** Simpan hasil sekali saja, lalu buka halaman hasil. */
  function finish() {
    if (state.finished) return;
    state.finished = true;
    el.nextBtn.disabled = true;
    el.nextBtn.textContent = "Menyimpan...";

    const correct = state.correct;
    const stars = Storage.calcStars(correct, total);
    const score = correct * CONFIG.scorePerCorrect;
    const xpEarned = correct * CONFIG.xpPerCorrect + stars * CONFIG.xpPerStar;

    Storage.recordLevelResult(user.id, {
      subjectId, levelNo, title: level.title, correct, total, stars, score, xpEarned,
    });

    Sound.stopMusic(0.6);
    Sound.play(stars > 0 ? "finish" : "lose");
    Game.setMood(el.mascot, stars > 0 ? "victory" : "confused");
    window.setTimeout(() => {
      window.location.assign(`result.html?subject=${encodeURIComponent(subjectId)}&id=level-${levelNo}`);
    }, 900);
  }

  /* ---------- Modal keluar ---------- */
  function openExitModal() {
    if (document.getElementById("exitModal")) return;
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "exitModal";
    modal.innerHTML = `
      <div class="modal__backdrop" data-exit-cancel></div>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="exitTitle" aria-describedby="exitDesc">
        <div class="modal__icon modal__icon--purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>
        </div>
        <h2 id="exitTitle">Keluar dari misi?</h2>
        <p id="exitDesc">Progres soal di level ini belum tersimpan, dan kamu harus mengulang dari awal.</p>
        <div class="modal__actions">
          <button class="btn btn--secondary" type="button" data-exit-cancel>Lanjut Main</button>
          <button class="btn btn--primary" type="button" data-exit-confirm>Ya, Keluar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      modal.querySelector(".btn--secondary").focus();
    });
  }

  function closeExitModal() {
    const modal = document.getElementById("exitModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    window.setTimeout(() => modal.remove(), 220);
    el.exitBtn.focus();
  }

  /* ---------- Event ---------- */
  // Browser baru mengizinkan suara setelah ada interaksi pengguna
  ["pointerdown", "click", "touchend", "keydown"].forEach((type) => {
    window.addEventListener(type, () => Sound.unlock(), { capture: true, passive: true });
  });

  el.musicBtn.addEventListener("click", () => {
    Sound.setMusic(!Sound.isMusicOn());
    syncAudioButtons();
    Sound.play("toggle");
  });

  el.sfxBtn.addEventListener("click", () => {
    Sound.setSfx(!Sound.isSfxOn());
    syncAudioButtons();
    Sound.play("toggle");
  });

  el.qOptions.addEventListener("click", (event) => {
    const btn = event.target.closest(".opt");
    if (btn) answer(Number(btn.dataset.i));
  });

  el.nextBtn.addEventListener("click", next);
  el.exitBtn.addEventListener("click", openExitModal);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-exit-cancel]")) closeExitModal();
    else if (event.target.closest("[data-exit-confirm]")) window.location.assign(levelsUrl);
  });

  document.addEventListener("keydown", (event) => {
    const modal = document.getElementById("exitModal");
    if (modal) {
      if (event.key === "Escape") closeExitModal();
      if (event.key === "Tab") {
        const buttons = Array.from(modal.querySelectorAll("button"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }

    // Pintasan keyboard: 1-4 atau A-D memilih jawaban, Enter melanjutkan
    if (!state.answered) {
      const key = event.key.toLowerCase();
      if (key.length !== 1) return;
      const index = "1234".includes(key) ? Number(key) - 1 : "abcd".indexOf(key);
      if (index >= 0 && index < prepared[state.idx].items.length) answer(index);
    } else if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
      next();
    }
  });

  // Dari tombol Back browser (cache): tetap pada sesi yang valid
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && !Storage.isLoggedIn()) window.location.replace("login.html");
  });

  /* ---------- Mulai ---------- */
  el.game.dataset.theme = subject.accent;
  el.hudSubject.textContent = subject.name;
  el.hudLevel.textContent = `Level ${level.id}: ${level.title}`;
  document.title = `${level.title} — Zuppy`;

  Game.mount(document);
  syncAudioButtons();
  buildTrail();
  moveMascot(false);
  renderQuestion();
})();