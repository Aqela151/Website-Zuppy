/* ==========================================================
   ZUPPY — Halaman belajar: peta level, introduction, hasil
   Dipakai oleh:
   - pages/subjects.html (data-view="subjects")
   - pages/material.html (data-view="intro")
   - pages/result.html   (data-view="result")
   Bergantung pada: components.js, storage.js, game.js,
   data/subjects.js, data/questions.js
   ========================================================== */
(() => {
  "use strict";

  const Storage = window.ZuppyStorage;
  const Data = window.ZuppyData || {};
  const Game = window.ZuppyGame;
  const Components = window.ZuppyComponents;

  const user = Storage.requireAuth("login.html");
  if (!user) return;

  const SUBJECTS = Array.isArray(Data.subjects) ? Data.subjects : [];
  const LEVELS = Data.levels || {};
  const CONFIG = Data.game || { xpPerCorrect: 10, xpPerStar: 10, scorePerCorrect: 100, maxStars: 3 };
  const LEVEL_TAGS = ["Pemanasan", "Petualangan", "Tantangan Akhir"];
  const params = new URLSearchParams(window.location.search);

  /* ---------- Helper ---------- */
  const $ = (selector) => document.querySelector(selector);

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const svg = (inner) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const ICON = {
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    check: svg('<path d="M4 12.5 9.5 18 20 6.5"/>'),
    lock: svg('<rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    replay: svg('<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>'),
    flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const firstName = (fullName) => String(fullName || "").trim().split(/\s+/)[0] || "Siswa";

  function initials(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    return ((parts[0] || "S")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }

  const subjectById = (id) => SUBJECTS.find((s) => s.id === id) || null;
  const levelsOf = (subjectId) => LEVELS[subjectId] || [];
  const levelNoFromParam = () => parseInt(String(params.get("id") || "").replace("level-", ""), 10);
  const tagFor = (no) => LEVEL_TAGS[no - 1] || `Level ${no}`;
  const maxXp = (questionCount) => questionCount * CONFIG.xpPerCorrect + CONFIG.maxStars * CONFIG.xpPerStar;

  const levelsUrl = (subjectId) => `subjects.html?subject=${encodeURIComponent(subjectId)}`;
  const introUrl = (subjectId, no) => `material.html?subject=${encodeURIComponent(subjectId)}&id=level-${no}`;
  const playUrl = (subjectId, no) => `quiz.html?subject=${encodeURIComponent(subjectId)}&id=level-${no}`;

  /** Terapkan lebar bar progres dari atribut data-fill. */
  function applyFills(root) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.querySelectorAll("[data-fill]").forEach((el) => { el.style.width = `${el.dataset.fill}%`; });
      });
    });
  }

  /** Header profil (sapaan, nama, avatar) */
  function renderProfile() {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set("topGreeting", `${greeting()}!`);
    set("topName", user.fullName);
    set("topAvatar", initials(user.fullName));
    set("topUserName", firstName(user.fullName));
    set("topUserHandle", `@${user.username}`);
  }

  /* ==========================================================
     HALAMAN: MATA PELAJARAN / PETA LEVEL
     ========================================================== */
  function viewSubjects() {
    const subject = subjectById(params.get("subject"));
    if (subject) renderLevelMap(subject);
    else renderSubjectPicker();
  }

  function renderSubjectPicker() {
    const root = $("#view");

    const cards = SUBJECTS.map((s) => {
      const levels = levelsOf(s.id);
      const status = Storage.getLevelStatus(user.id, s.id, levels.length);
      const cleared = status.filter((l) => l.completed).length;
      const stars = status.reduce((sum, l) => sum + l.stars, 0);
      const percent = levels.length ? Math.round((cleared / levels.length) * 100) : 0;

      return `
        <a class="dash-subject dash-subject--${s.accent}" href="${levelsUrl(s.id)}">
          <div class="dash-subject__top">
            <span class="dash-subject__icon"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${s.icon}</svg></span>
            <span class="dash-subject__go">${ICON.arrow}</span>
          </div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.description)}</p>
          <span class="dash-subject__meta">${cleared}/${levels.length} level selesai · ${stars}/${levels.length * 3} bintang</span>
          <div class="dash-progress"><span class="dash-progress__fill" data-fill="${percent}"></span></div>
        </a>`;
    }).join("");

    root.innerHTML = `
      <header class="lv-pagehead">
        <h1>Mata Pelajaran</h1>
        <p>Pilih petualanganmu, selesaikan level, dan kumpulkan bintang bersama Zuppy.</p>
      </header>
      <div class="dash-subjects">${cards}</div>`;
    applyFills(root);
  }

  function renderLevelMap(subject) {
    const root = $("#view");
    const levels = levelsOf(subject.id);
    const status = Storage.getLevelStatus(user.id, subject.id, levels.length);
    const cleared = status.filter((l) => l.completed).length;
    const totalStars = status.reduce((sum, l) => sum + l.stars, 0);
    const percent = levels.length ? Math.round((cleared / levels.length) * 100) : 0;
    const current = status.find((l) => l.unlocked && !l.completed);

    const stops = levels.map((level, i) => {
      const st = status[i];
      const state = st.completed ? "completed" : st.unlocked ? "current" : "locked";
      const side = i % 2 === 0 ? "left" : "right";
      const isHere = current && current.no === level.id;

      const nodeInner = state === "locked" ? ICON.lock : state === "completed" ? ICON.check : level.id;
      const curve = i < levels.length - 1
        ? `<svg class="lv-link" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${side === "left" ? "M18 0 C 18 55, 82 45, 82 100" : "M82 0 C 82 55, 18 45, 18 100"}"/></svg>`
        : "";

      const action = state === "locked"
        ? `<span class="lv-lock">${ICON.lock} Selesaikan Level ${level.id - 1} untuk membuka</span>`
        : `<a class="btn btn--primary btn--sm" href="${introUrl(subject.id, level.id)}">${st.plays ? "Main Lagi" : "Mulai"} ${st.plays ? ICON.replay : ICON.arrow}</a>`;

      const best = st.plays ? `<span class="lv-best">Skor terbaik ${st.bestScore}</span>` : "";

      return `
        <li class="lv-stop lv-stop--${side} is-${state}">
          ${curve}
          <div class="lv-node" aria-hidden="true">
            ${isHere ? '<div class="lv-pin"><div data-zuppy></div></div>' : ""}
            <span class="lv-node__inner">${nodeInner}</span>
          </div>
          <article class="lv-card">
            <span class="lv-card__tag">Level ${level.id} · ${esc(tagFor(level.id))}</span>
            <h3>${esc(level.title)}</h3>
            <p>${esc(level.description)}</p>
            <div class="lv-card__meta">
              <span class="lv-chip">${esc(level.topic)}</span>
              ${Game.starsMarkup(st.stars, 3)}
            </div>
            <div class="lv-card__foot">${action}${best}</div>
          </article>
        </li>`;
    }).join("");

    root.innerHTML = `
      <a class="lv-back" href="${Components.withRoot("index.html#mapel")}">${ICON.back} Kembali ke Home</a>

      <section class="lv-hero scene-box" data-theme="${esc(subject.accent)}">
        <div class="scene" data-scene></div>
        <div class="lv-hero__copy">
          <span class="badge badge--yellow">${esc(subject.tag)}</span>
          <h1>${esc(subject.name)}</h1>
          <p>${esc(subject.description)}</p>
          <div class="lv-hero__progress">
            <div class="lv-meter"><span class="lv-meter__fill" data-fill="${percent}"></span></div>
            <span>${cleared}/${levels.length} level · ${totalStars}/${levels.length * 3} bintang</span>
          </div>
        </div>
        <div class="lv-hero__zuppy"><div data-zuppy data-mood="excited"></div></div>
      </section>

      <section aria-label="Peta level ${esc(subject.name)}">
        <ol class="lv-path" data-theme="${esc(subject.accent)}">${stops}</ol>
      </section>`;

    Game.mount(root);
    applyFills(root);
  }

  /* ==========================================================
     HALAMAN: INTRODUCTION MISI
     ========================================================== */
  function viewIntro() {
    const subject = subjectById(params.get("subject"));
    const no = levelNoFromParam();
    const levels = levelsOf(subject && subject.id);
    const level = levels.find((l) => l.id === no);

    if (!subject || !level) {
      window.location.replace(subject ? levelsUrl(subject.id) : "subjects.html");
      return;
    }

    const status = Storage.getLevelStatus(user.id, subject.id, levels.length)[no - 1];
    if (!status.unlocked) {
      window.location.replace(levelsUrl(subject.id));
      return;
    }

    // Simpan sebagai level terakhir yang dibuka (untuk "Lanjutkan Belajar")
    Storage.setLastMaterial(user.id, { subjectId: subject.id, materialId: `level-${no}`, title: level.title, progress: 0 });

    const questionCount = level.questions.length;
    const root = $("#view");

    root.innerHTML = `
      <a class="lv-back" href="${levelsUrl(subject.id)}">${ICON.back} Kembali ke Level</a>

      <div class="intro">
        <section class="intro__stage scene-box" data-theme="${esc(subject.accent)}">
          <div class="scene" data-scene></div>
          <div class="intro__cast">
            <div class="bubble">Halo, aku Zuppy! Siap berpetualang di ${esc(level.place)} bersamaku?</div>
            <div class="intro__zuppy"><div data-zuppy></div></div>
          </div>
        </section>

        <section class="intro__panel">
          <span class="badge badge--purple">Misi Level ${level.id} · ${esc(tagFor(level.id))}</span>
          <h1>${esc(level.title)}</h1>
          <p class="intro__story">${esc(level.story)}</p>

          <div class="intro__goal">
            <strong>Tujuan misi</strong>
            <p>${esc(level.goal)}</p>
          </div>

          <div class="intro__facts">
            <div class="fact"><strong>${questionCount}</strong><span>Soal</span></div>
            <div class="fact"><strong>${esc(subject.name)}</strong><span>${esc(level.topic)}</span></div>
            <div class="fact"><strong>${maxXp(questionCount)} XP</strong><span>Reward maksimal + 3 bintang</span></div>
          </div>

          <p class="intro__recap"><strong>Ingat ya:</strong> ${esc(level.recap)}</p>

          <div class="intro__actions">
            <a class="btn btn--primary btn--lg" href="${playUrl(subject.id, no)}">Mulai Petualangan ${ICON.flag}</a>
            <a class="btn btn--secondary btn--lg" href="${levelsUrl(subject.id)}">Kembali ke Level</a>
          </div>
        </section>
      </div>`;

    Game.mount(root);
  }

  /* ==========================================================
     HALAMAN: HASIL PERMAINAN
     ========================================================== */
  const RESULT_COPY = {
    3: { title: "Level Selesai! Sempurna!", text: "Luar biasa! Kamu menjawab semuanya dengan benar." },
    2: { title: "Level Selesai! Keren!", text: "Hebat! Sedikit lagi untuk meraih bintang penuh." },
    1: { title: "Level Selesai!", text: "Lumayan! Coba lagi untuk mendapatkan bintang lebih banyak." },
    0: { title: "Belum Berhasil", text: "Tidak apa-apa. Pelajari lagi materinya lalu coba ulang, ya!" },
  };

  function viewResult() {
    const subject = subjectById(params.get("subject"));
    const no = levelNoFromParam();
    const progress = Storage.getProgress(user.id);
    const result = progress.lastResult;

    if (!subject || !result || result.subjectId !== subject.id || result.levelNo !== no) {
      window.location.replace(subject ? levelsUrl(subject.id) : "subjects.html");
      return;
    }

    const levels = levelsOf(subject.id);
    const nextLevel = levels.find((l) => l.id === no + 1) || null;
    const status = Storage.getLevelStatus(user.id, subject.id, levels.length);
    const nextOpen = !!(nextLevel && status[no] && status[no].unlocked);

    const wrong = result.total - result.correct;
    const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
    const copy = RESULT_COPY[result.stars] || RESULT_COPY[0];
    const info = Storage.getLevelInfo(progress.points);

    const badges = [];
    if (result.isFirstClear && nextLevel) badges.push(`<span class="badge badge--turquoise">Level ${nextLevel.id} terbuka!</span>`);
    if (result.isNewBest && result.stars > 0) badges.push('<span class="badge badge--yellow">Skor terbaik baru!</span>');
    if (result.leveledUp) badges.push(`<span class="badge badge--pink">Naik ke Level ${result.newLevel}!</span>`);

    const xpNote = result.xpGain > 0
      ? `Kamu mendapat <strong>+${result.xpGain} XP</strong>. Total XP: ${progress.points} (Level ${info.level}).`
      : `XP level ini sudah pernah kamu dapatkan, jadi tidak ada XP baru. Raih skor lebih tinggi untuk XP tambahan! Total XP: ${progress.points} (Level ${info.level}).`;

    let nextAction;
    if (nextLevel && nextOpen) {
      nextAction = `<a class="btn btn--primary btn--lg" href="${introUrl(subject.id, nextLevel.id)}">Lanjut ke Level ${nextLevel.id} ${ICON.arrow}</a>`;
    } else if (nextLevel) {
      nextAction = `<span class="res-locked">${ICON.lock} Raih minimal 1 bintang untuk membuka Level ${nextLevel.id}</span>`;
    } else {
      nextAction = `<a class="btn btn--primary btn--lg" href="subjects.html">Pilih Mata Pelajaran Lain ${ICON.arrow}</a>`;
    }

    const root = $("#view");
    root.innerHTML = `
      <section class="res-hero scene-box" data-theme="${esc(subject.accent)}">
        <div class="scene" data-scene></div>
        <div class="res-hero__body">
          <p class="res-hero__label">${esc(subject.name)} · Level ${no}: ${esc(result.title)}</p>
          <h1>${esc(copy.title)}</h1>
          <p class="res-hero__text">${esc(copy.text)}</p>
          <div class="res-hero__zuppy"><div data-zuppy data-mood="${result.stars > 0 ? "victory" : "confused"}"></div></div>
          ${Game.starsMarkup(result.stars, 3, "lg")}
        </div>
      </section>

      <section class="res-card">
        ${badges.length ? `<div class="res-badges">${badges.join("")}</div>` : ""}
        <div class="res-stats">
          <div class="res-stat"><strong>${result.score}</strong><span>Skor</span></div>
          <div class="res-stat res-stat--ok"><strong>${result.correct}</strong><span>Benar</span></div>
          <div class="res-stat res-stat--no"><strong>${wrong}</strong><span>Salah</span></div>
          <div class="res-stat"><strong>${accuracy}%</strong><span>Akurasi</span></div>
          <div class="res-stat res-stat--xp"><strong>+${result.xpGain}</strong><span>XP masuk</span></div>
        </div>
        <p class="res-note">${xpNote}</p>
        <div class="res-actions">
          <a class="btn btn--secondary btn--lg" href="${playUrl(subject.id, no)}">Main Lagi ${ICON.replay}</a>
          <a class="btn btn--secondary btn--lg" href="${levelsUrl(subject.id)}">Kembali ke Level</a>
          ${nextAction}
        </div>
      </section>`;

    Game.mount(root);
    if (result.stars > 0) window.setTimeout(() => Game.confetti(80), 250);
  }

  /* ---------- Init ---------- */
  renderProfile();

  const view = document.body.dataset.view;
  if (view === "subjects") viewSubjects();
  else if (view === "intro") viewIntro();
  else if (view === "result") viewResult();
})();