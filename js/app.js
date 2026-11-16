/* ==========================================================
   ZUPPY — Perilaku umum halaman publik
   - Animasi muncul saat di-scroll (.reveal)
   - Scroll-spy: menu header ikut aktif sesuai section ([data-spy])
   Dimuat setelah js/components.js (defer).
   ========================================================== */
(() => {
  "use strict";

  // Tandai JS aktif agar .reveal tidak tersembunyi jika JS mati
  document.documentElement.classList.add("js");

  /** Munculkan elemen .reveal ketika masuk layar. */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => observer.observe(el));
  }

  /** Aktifkan menu header sesuai section yang sedang dilihat. */
  function initScrollSpy() {
    const sections = document.querySelectorAll("[data-spy]");
    const links = document.querySelectorAll(".site-nav__link[data-nav]");
    if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

    const setActive = (key) => {
      links.forEach((link) => {
        const on = link.dataset.nav === key;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.dataset.spy);
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
  }

  initReveal();
  // Menu header berasal dari komponen, jadi tunggu sampai selesai dimuat
  window.ZuppyComponents.ready.then(initScrollSpy);
})();