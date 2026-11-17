/* ==========================================================
   ZUPPY — Helper game bersama
   Maskot beranimasi (idle, happy, confused, excited, victory),
   latar dunia petualangan, bintang, dan konfeti.
   Dimuat setelah js/components.js.
   ========================================================== */
(() => {
  "use strict";

  const Components = window.ZuppyComponents;
  const ROOT = Components ? Components.root : "../";
  const MASCOT_SRC = `${ROOT}assets/images/mascot/maskot.png`;

  const REDUCED =
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- Ikon efek ---------- */
  const FX_ICONS = {
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5 16.5 2 12.5 2 8.8A5 5 0 0 1 12 7a5 5 0 0 1 10 1.8c0 3.7-3 7.7-10 12.2z"/></svg>',
    question: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 17.5h.01"/></svg>',
  };

  // mood -> [jenis efek, jumlah]
  const MOOD_FX = {
    happy: ["star", 6],
    confused: ["question", 3],
    excited: ["star", 3],
    victory: ["star", 10],
  };

  /* ---------- Maskot ---------- */
  /** Isi semua elemen [data-zuppy] dengan maskot asli + efek. */
  function mountMascots(root = document) {
    root.querySelectorAll("[data-zuppy]").forEach((slot) => {
      if (slot.dataset.mounted) return;
      slot.classList.add("zuppy");
      slot.dataset.mood = slot.dataset.mood || "idle";
      slot.setAttribute("role", "img");
      slot.setAttribute("aria-label", "Zuppy, maskot belajar");
      slot.innerHTML =
        `<div class="zuppy__body"><div class="zuppy__img"><img src="${MASCOT_SRC}" alt=""></div></div>` +
        '<div class="zuppy__shadow"></div><div class="zuppy__fx"></div>';
      slot.dataset.mounted = "1";
    });
  }

  function emitFx(slot, kind, count) {
    const box = slot && slot.querySelector(".zuppy__fx");
    if (!box || REDUCED) return;
    for (let i = 0; i < count; i += 1) {
      const el = document.createElement("span");
      el.className = `fx fx--${kind}`;
      el.innerHTML = FX_ICONS[kind];
      el.style.setProperty("--dx", `${Math.round((Math.random() - 0.5) * 150)}px`);
      el.style.setProperty("--dy", `${-70 - Math.round(Math.random() * 80)}px`);
      el.style.setProperty("--rot", `${Math.round((Math.random() - 0.5) * 120)}deg`);
      el.style.setProperty("--d", `${(i * 0.06).toFixed(2)}s`);
      box.appendChild(el);
      window.setTimeout(() => el.remove(), 1700);
    }
  }

  /**
   * Ubah ekspresi maskot.
   * opts.revertMs: kembali ke opts.revertTo (default "idle") setelah beberapa ms.
   */
  function setMood(slot, mood, opts = {}) {
    if (!slot) return;
    window.clearTimeout(slot._moodTimer);

    // Paksa animasi mulai ulang walau mood sama
    slot.dataset.mood = "";
    void slot.offsetWidth;
    slot.dataset.mood = mood;

    if (MOOD_FX[mood]) emitFx(slot, MOOD_FX[mood][0], MOOD_FX[mood][1]);

    if (opts.revertMs) {
      slot._moodTimer = window.setTimeout(() => {
        slot.dataset.mood = opts.revertTo || "idle";
      }, opts.revertMs);
    }
  }

  /* ---------- Latar dunia ---------- */
  function sceneHTML(kind) {
    return (
      '<span class="scene__sun"></span>' +
      '<span class="scene__cloud scene__cloud--1"></span>' +
      '<span class="scene__cloud scene__cloud--2"></span>' +
      '<span class="scene__cloud scene__cloud--3"></span>' +
      '<svg class="scene__hills scene__hills--far" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true"><path d="M0 190C160 110 330 110 520 180s380 90 580-10 260-60 340-10V320H0z"/></svg>' +
      '<svg class="scene__hills scene__hills--near" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true"><path d="M0 250C200 190 400 200 620 245s420 55 620-25c90-36 160-30 200-15V320H0z"/></svg>' +
      (kind === "game" ? '<span class="scene__ground"></span>' : "")
    );
  }

  /** Isi semua elemen [data-scene] dengan latar petualangan. */
  function mountScenes(root = document) {
    root.querySelectorAll("[data-scene]").forEach((el) => {
      if (el.dataset.mounted) return;
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = sceneHTML(el.dataset.scene);
      el.dataset.mounted = "1";
    });
  }

  function mount(root = document) {
    mountScenes(root);
    mountMascots(root);
  }

  /* ---------- Bintang ---------- */
  function starsMarkup(count, total = 3, size = "") {
    const cls = size ? ` stars--${size}` : "";
    let html = `<span class="stars${cls}" role="img" aria-label="${count} dari ${total} bintang">`;
    for (let i = 0; i < total; i += 1) {
      html += `<svg class="star${i < count ? " is-on" : ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`;
    }
    return `${html}</span>`;
  }

  /* ---------- Konfeti ---------- */
  const COLORS = ["#6941F5", "#29C7B8", "#FFE34F", "#FF65A3"];

  function confetti(count = 70) {
    if (REDUCED) return;
    const layer = document.createElement("div");
    layer.className = "confetti";
    layer.setAttribute("aria-hidden", "true");

    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti__piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.width = `${6 + Math.round(Math.random() * 6)}px`;
      piece.style.height = `${10 + Math.round(Math.random() * 8)}px`;
      piece.style.setProperty("--dur", `${(2.6 + Math.random() * 1.8).toFixed(2)}s`);
      piece.style.setProperty("--delay", `${(Math.random() * 0.8).toFixed(2)}s`);
      piece.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 220)}px`);
      piece.style.setProperty("--spin", `${Math.round(360 + Math.random() * 720)}deg`);
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), 5200);
  }

  /* ---------- Utilitas ---------- */
  /** Jalankan ulang animasi CSS sebuah class. */
  function restartAnim(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  window.ZuppyGame = { mount, mountMascots, mountScenes, setMood, emitFx, starsMarkup, confetti, restartAnim, shuffle };
})();