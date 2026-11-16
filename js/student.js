/* ==========================================================
   ZUPPY — Dashboard Siswa
   Bergantung pada: js/components.js, js/storage.js, data/subjects.js
   (data/materials.js opsional, dipakai jika sudah tersedia).
   ========================================================== */
(() => {
  "use strict";

  const Storage = window.ZuppyStorage;
  const Data = window.ZuppyData || {};

  // Dashboard tidak bisa diakses tanpa login
  const user = Storage.requireAuth("login.html");
  if (!user) return;

  const SUBJECTS = Array.isArray(Data.subjects) ? Data.subjects : [];
  const MATERIALS = Array.isArray(Data.materials) ? Data.materials : [];

  /* ---------- Data tantangan harian (mudah diubah) ---------- */
  // metric: quizzes = kuis selesai hari ini, materials = materi selesai hari ini,
  //         correct = total jawaban benar hari ini
  const CHALLENGES = [
    { id: "quiz-1", title: "Selesaikan 1 kuis hari ini", desc: "Kerjakan satu kuis dari materi mana pun.", metric: "quizzes", goal: 1, xp: 20 },
    { id: "material-1", title: "Pelajari 1 materi baru", desc: "Selesaikan satu materi yang belum pernah kamu pelajari.", metric: "materials", goal: 1, xp: 20 },
    { id: "correct-5", title: "Jawab 5 pertanyaan dengan benar", desc: "Kumpulkan 5 jawaban benar dari kuis hari ini.", metric: "correct", goal: 5, xp: 30 },
  ];

  /* ---------- Data demo leaderboard ---------- */
  const DEMO_LEADERBOARD = [
    { name: "Aulia R.", xp: 1240 },
    { name: "Raka P.", xp: 980 },
    { name: "Salsa M.", xp: 860 },
    { name: "Dimas A.", xp: 640 },
    { name: "Nayla S.", xp: 520 },
    { name: "Fajar H.", xp: 310 },
  ];

  /* ---------- Ikon ---------- */
  const svg = (inner, cls = "icon") =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;

  const ICON = {
    star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
    flame: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    book: svg('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    bolt: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    play: svg('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>'),
  };

  /* ---------- Helper ---------- */
  const $ = (selector) => document.querySelector(selector);

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const formatNumber = (n) => Number(n || 0).toLocaleString("id-ID");

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }

  const firstName = (fullName) => String(fullName || "").trim().split(/\s+/)[0] || "Siswa";

  function initials(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    return ((parts[0] || "S")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }

  function formatWhen(iso) {
    const date = new Date(iso);
    const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
    const today = Storage.dateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (Storage.dateKey(date) === today) return `Hari ini, ${time}`;
    if (Storage.dateKey(date) === Storage.dateKey(yesterday)) return `Kemarin, ${time}`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  const subjectById = (id) => SUBJECTS.find((s) => s.id === id) || null;
  const materialsOf = (subjectId) => MATERIALS.filter((m) => m.subjectId === subjectId);
  const completedIn = (progress, subjectId) =>
    progress.completedMaterials.filter((key) => key.startsWith(`${subjectId}/`)).length;

  /** Terapkan lebar/tinggi dari atribut data (tanpa inline style di HTML). */
  function applyDynamicStyles(root) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.querySelectorAll("[data-fill]").forEach((el) => { el.style.width = `${el.dataset.fill}%`; });
        root.querySelectorAll("[data-h]").forEach((el) => { el.style.setProperty("--h", `${el.dataset.h}%`); });
      });
    });
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* ---------- Statistik dari data tersimpan ---------- */
  function quizAccuracy(progress) {
    let correct = 0;
    let total = 0;
    progress.quizHistory.forEach((q) => {
      correct += Number(q.correct) || 0;
      total += Number(q.total) || 0;
    });
    return { correct, total, percent: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }

  function todayStats(progress) {
    const today = Storage.dateKey();
    const stats = { quizzes: 0, materials: 0, correct: 0 };
    progress.activityLog.forEach((entry) => {
      if (Storage.dateKey(entry.at) !== today) return;
      if (entry.type === "quiz") {
        stats.quizzes += 1;
        stats.correct += Number(entry.correct) || 0;
      }
      if (entry.type === "material") stats.materials += 1;
    });
    return stats;
  }

  /* ---------- Render ---------- */
  function renderTopbar() {
    $("#topGreeting").textContent = `${greeting()}!`;
    $("#topName").textContent = user.fullName;
    $("#topAvatar").textContent = initials(user.fullName);
    $("#topUserName").textContent = firstName(user.fullName);
    $("#topUserHandle").textContent = `@${user.username}`;
  }

  function renderHero(progress) {
    const info = Storage.getLevelInfo(progress.points);
    $("#heroTitle").textContent = `Halo, ${firstName(user.fullName)}! 👋`;
    $("#heroLevel").textContent = `Level ${info.level}`;
    $("#heroXpText").textContent = `${info.current} / ${info.needed} XP menuju Level ${info.level + 1}`;
    $("#heroXpFill").dataset.fill = info.percent;
  }

  function renderStats(progress) {
    const info = Storage.getLevelInfo(progress.points);
    const streak = Storage.getStreak(progress.activityLog);
    const done = progress.completedMaterials.length;
    const accuracy = quizAccuracy(progress);

    const streakSub = streak > 0 ? "hari berturut-turut" : "Belajar hari ini untuk mulai streak";
    const doneSub = done === 0
      ? "Mulai pelajari materi pertamamu"
      : MATERIALS.length > 0 ? `dari ${MATERIALS.length} materi` : "materi dipelajari";
    const accSub = accuracy.total > 0
      ? `${accuracy.correct} dari ${accuracy.total} jawaban benar`
      : "Belum ada kuis dikerjakan";

    const cards = [
      { tone: "yellow", icon: ICON.star, label: "Total XP", value: formatNumber(progress.points), sub: `Level ${info.level}` },
      { tone: "pink", icon: ICON.flame, label: "Learning Streak", value: `${streak} hari`, sub: streakSub },
      { tone: "turquoise", icon: ICON.book, label: "Materi Selesai", value: formatNumber(done), sub: doneSub },
      { tone: "purple", icon: ICON.target, label: "Akurasi Kuis", value: `${accuracy.percent}%`, sub: accSub },
    ];

    $("#statGrid").innerHTML = cards.map((c) => `
      <article class="dash-stat dash-stat--${c.tone}">
        <span class="dash-stat__icon">${c.icon}</span>
        <div class="dash-stat__body">
          <p class="dash-stat__label">${esc(c.label)}</p>
          <p class="dash-stat__value">${esc(c.value)}</p>
          <p class="dash-stat__sub">${esc(c.sub)}</p>
        </div>
      </article>`).join("");
  }

  function renderContinue(progress) {
    const body = $("#continueBody");
    const last = progress.lastMaterial;

    if (!last || !last.title) {
      body.innerHTML = `
        <div class="dash-empty">
          <span class="dash-empty__icon">${ICON.book}</span>
          <p>Belum ada materi yang dipelajari. Pilih mata pelajaran dan mulai petualangan belajarmu!</p>
          <a class="btn btn--primary btn--sm" href="subjects.html">Mulai Belajar ${ICON.arrow}</a>
        </div>`;
      return;
    }

    const subject = subjectById(last.subjectId);
    const percent = Math.min(100, Math.max(0, Number(last.progress) || 0));
    const href = `material.html?subject=${encodeURIComponent(last.subjectId)}&id=${encodeURIComponent(last.materialId)}`;

    body.innerHTML = `
      <div class="dash-continue">
        <div class="dash-continue__top">
          <span class="dash-continue__icon">${subject ? svg(subject.icon) : ICON.book}</span>
          <span class="badge badge--purple">${esc(subject ? subject.name : "Materi")}</span>
        </div>
        <h3>${esc(last.title)}</h3>
        <div class="dash-progress-row">
          <div class="dash-progress"><span class="dash-progress__fill" data-fill="${percent}"></span></div>
          <span class="dash-progress-row__value">${percent}%</span>
        </div>
        <a class="btn btn--primary btn--sm" href="${href}">Lanjutkan Belajar ${ICON.arrow}</a>
      </div>`;
    applyDynamicStyles(body);
  }

  function renderChallenges(progress) {
    const stats = todayStats(progress);
    const claimed = progress.challengeClaims[Storage.dateKey()] || [];
    let reached = 0;

    const items = CHALLENGES.map((c) => {
      const value = Math.min(stats[c.metric], c.goal);
      const isDone = stats[c.metric] >= c.goal;
      const isClaimed = claimed.includes(c.id);
      if (isDone) reached += 1;

      let action = `<span class="dash-task__count">${value}/${c.goal}</span>`;
      if (isDone && !isClaimed) {
        action = `<button class="btn btn--primary btn--sm" type="button" data-claim="${c.id}">Klaim +${c.xp} XP</button>`;
      } else if (isClaimed) {
        action = `<span class="badge badge--turquoise">Diklaim</span>`;
      }

      return `
        <article class="dash-task${isDone ? " is-done" : ""}">
          <div class="dash-task__head">
            <h3>${esc(c.title)}</h3>
            <span class="dash-xp">+${c.xp} XP</span>
          </div>
          <p>${esc(c.desc)}</p>
          <div class="dash-task__foot">
            <div class="dash-progress"><span class="dash-progress__fill" data-fill="${Math.round((value / c.goal) * 100)}"></span></div>
            ${action}
          </div>
        </article>`;
    });

    $("#challengeCount").textContent = `${reached}/${CHALLENGES.length} tercapai`;
    $("#challengeBody").innerHTML = items.join("");
    applyDynamicStyles($("#challengeBody"));
  }

  function renderSubjects(progress) {
    const grid = $("#subjectGrid");
    if (SUBJECTS.length === 0) {
      grid.innerHTML = `<div class="dash-empty"><p>Data mata pelajaran belum tersedia.</p></div>`;
      return;
    }

    grid.innerHTML = SUBJECTS.map((s) => {
      const total = materialsOf(s.id).length;
      const done = completedIn(progress, s.id);
      const meta = total > 0
        ? `<span class="dash-subject__meta">${done}/${total} materi selesai</span>
           <div class="dash-progress"><span class="dash-progress__fill" data-fill="${Math.round((done / total) * 100)}"></span></div>`
        : `<span class="dash-subject__meta">Materi segera hadir</span>`;

      return `
        <a class="dash-subject dash-subject--${s.accent}" href="subjects.html?subject=${encodeURIComponent(s.id)}">
          <div class="dash-subject__top">
            <span class="dash-subject__icon">${svg(s.icon)}</span>
            <span class="dash-subject__go">${ICON.arrow}</span>
          </div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.description)}</p>
          ${meta}
        </a>`;
    }).join("");
    applyDynamicStyles(grid);
  }

  function renderWeek(progress) {
    const learning = progress.activityLog.filter((e) => e.type === "material" || e.type === "quiz");
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = Storage.dateKey(d);
      days.push({
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        count: learning.filter((e) => Storage.dateKey(e.at) === key).length,
        isToday: i === 0,
      });
    }

    const max = Math.max(1, ...days.map((d) => d.count));
    const total = days.reduce((sum, d) => sum + d.count, 0);

    $("#weekTotal").textContent = total > 0 ? `${total} aktivitas belajar dalam 7 hari terakhir` : "Belum ada aktivitas dalam 7 hari terakhir";

    const chart = $("#weekChart");
    chart.innerHTML = days.map((d) => `
      <div class="dash-bar${d.isToday ? " is-today" : ""}" title="${esc(d.label)}: ${d.count} aktivitas">
        <div class="dash-bar__track"><span class="dash-bar__fill" data-h="${d.count ? Math.max(14, Math.round((d.count / max) * 100)) : 0}"></span></div>
        <span class="dash-bar__label">${esc(d.label)}</span>
      </div>`).join("");
    applyDynamicStyles(chart);
  }

  function describeActivity(entry) {
    if (entry.type === "material") {
      return { tone: "turquoise", icon: ICON.book, text: `Menyelesaikan materi: ${entry.title || "Materi"}` };
    }
    if (entry.type === "quiz") {
      return { tone: "purple", icon: ICON.bolt, text: `Kuis ${entry.title || ""}: ${entry.correct}/${entry.total} benar` };
    }
    return { tone: "yellow", icon: ICON.star, text: `Klaim tantangan: ${entry.title || ""}` };
  }

  function renderActivity(progress) {
    const list = $("#activityList");
    const recent = progress.activityLog.slice(-5).reverse();

    if (recent.length === 0) {
      list.innerHTML = `
        <div class="dash-empty dash-empty--compact">
          <p>Belum ada aktivitas. Mulai belajar untuk melihat riwayatmu di sini.</p>
        </div>`;
      return;
    }

    list.innerHTML = recent.map((entry) => {
      const info = describeActivity(entry);
      return `
        <li class="dash-activity__item">
          <span class="dash-activity__icon dash-activity__icon--${info.tone}">${info.icon}</span>
          <div class="dash-activity__text">
            <p>${esc(info.text)}</p>
            <span>${esc(formatWhen(entry.at))}</span>
          </div>
          <span class="dash-activity__xp">+${Number(entry.xp) || 0} XP</span>
        </li>`;
    }).join("");
  }

  function renderBoard(progress) {
    const entries = DEMO_LEADERBOARD.map((e) => ({ name: e.name, xp: e.xp, me: false }));
    entries.push({ name: user.fullName, xp: progress.points, me: true });
    entries.sort((a, b) => b.xp - a.xp || Number(b.me) - Number(a.me));

    const row = (entry, rank) => `
      <li class="dash-rank${entry.me ? " is-me" : ""}">
        <span class="dash-rank__pos dash-rank__pos--${rank <= 3 ? rank : "n"}">${rank}</span>
        <span class="dash-rank__name">${esc(entry.name)}${entry.me ? " (Kamu)" : ""}</span>
        <span class="dash-rank__xp">${formatNumber(entry.xp)} XP</span>
      </li>`;

    const top = entries.slice(0, 5).map((e, i) => row(e, i + 1));
    const myIndex = entries.findIndex((e) => e.me);
    if (myIndex >= 5) {
      top.push(`<li class="dash-board__gap" aria-hidden="true">···</li>`);
      top.push(row(entries[myIndex], myIndex + 1));
    }
    $("#boardList").innerHTML = top.join("");
  }

  function render() {
    const progress = Storage.getProgress(user.id);
    renderTopbar();
    renderHero(progress);
    renderStats(progress);
    renderContinue(progress);
    renderChallenges(progress);
    renderSubjects(progress);
    renderWeek(progress);
    renderActivity(progress);
    renderBoard(progress);
    applyDynamicStyles(document);
  }

  /* ---------- Interaksi ---------- */
  function initClaim() {
    $("#challengeBody").addEventListener("click", (event) => {
      const button = event.target.closest("[data-claim]");
      if (!button) return;
      const challenge = CHALLENGES.find((c) => c.id === button.dataset.claim);
      if (!challenge) return;

      if (Storage.claimChallenge(user.id, challenge.id, challenge.xp, challenge.title)) {
        showToast(`+${challenge.xp} XP! Tantangan berhasil diklaim.`);
        render();
      }
    });
  }

  /** Sorot menu sidebar sesuai bagian dashboard yang sedang dilihat. */
  function initSidebarSpy() {
    const links = document.querySelectorAll(".sidebar__link[data-nav]");
    const sections = document.querySelectorAll("[data-spy]");
    if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

    const setActive = (key) => {
      links.forEach((link) => {
        const on = link.dataset.nav === key;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.dataset.spy); }),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* ---------- Init ---------- */
  render();
  initClaim();
  window.ZuppyComponents.ready.then(initSidebarSpy);

  // Sinkronkan jika data berubah dari tab lain
  window.addEventListener("storage", (event) => {
    if (event.key && event.key.startsWith("zuppy_")) {
      if (!Storage.isLoggedIn()) window.location.replace("login.html");
      else render();
    }
  });
})();