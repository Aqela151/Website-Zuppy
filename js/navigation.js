/* ==========================================================
   ZUPPY — Navigasi & penjaga halaman internal
   Aktif hanya pada halaman dengan <body data-auth="required">.

   Memastikan halaman internal tidak terbuka tanpa sesi login:
   - saat halaman dimuat
   - saat halaman dipulihkan lewat tombol Back (cache browser)
   - saat tab kembali aktif
   - saat logout terjadi di tab lain

   Bergantung pada: js/components.js, js/storage.js
   ========================================================== */
(() => {
  "use strict";

  const Storage = window.ZuppyStorage;
  if (!Storage || document.body.dataset.auth !== "required") return;

  const Components = window.ZuppyComponents;
  const loginUrl = Components ? Components.withRoot("pages/login.html") : "login.html";

  /** Arahkan ke Login jika tidak ada sesi aktif. */
  function guard() {
    if (Storage.isLoggedIn()) return true;
    window.location.replace(loginUrl);
    return false;
  }

  guard();

  // Halaman dipulihkan dari cache (tombol Back/Forward)
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) guard();
  });

  // Logout atau perubahan data dari tab lain
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === "zuppy_session" || event.key === "zuppy_users") guard();
  });

  // Kembali ke tab ini setelah beberapa saat
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) guard();
  });
})();