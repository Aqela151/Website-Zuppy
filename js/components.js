/* ==========================================================
   ZUPPY — Component loader
   - Memuat semua <div data-component="nama"> dari /components
   - Menyelesaikan path relatif (data-href / data-src) lewat data-root di <body>,
     baik di dalam komponen maupun di konten halaman itu sendiri
   - Menandai menu aktif lewat data-page di <body>
   - Mengatur menu mobile (header) & drawer (sidebar)
   - Dropdown menu: [data-dropdown] > [data-dropdown-toggle] + [data-dropdown-menu]
   - Logout dengan modal konfirmasi (elemen [data-action="logout"])

   Cara pakai di halaman:
     <body data-root="" data-page="home">            (index.html)
     <body data-root="../" data-page="dashboard">    (pages/*.html)

   Script halaman yang butuh komponen:
     ZuppyComponents.ready.then(() => { ... });
   ========================================================== */
(() => {
  "use strict";

  const ROOT = document.body.dataset.root || "";
  const PAGE = document.body.dataset.page || "";

  /** Tambahkan root ke path relatif; link eksternal & hash murni dibiarkan. */
  const withRoot = (path) =>
    /^(https?:|mailto:|tel:|#|\/\/)/.test(path) ? path : ROOT + path;

  /** Ubah data-href & data-src menjadi href & src yang benar. */
  function resolvePaths(scope) {
    scope.querySelectorAll("[data-href]").forEach((el) => {
      el.setAttribute("href", withRoot(el.dataset.href));
    });
    scope.querySelectorAll("[data-src]").forEach((el) => {
      el.setAttribute("src", withRoot(el.dataset.src));
    });
  }

  /** Tandai menu yang sesuai dengan data-page halaman. */
  function markActive(scope) {
    scope.querySelectorAll("[data-nav]").forEach((el) => {
      const isActive = el.dataset.nav === PAGE;
      el.classList.toggle("is-active", isActive);
      if (isActive) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  }

  /** Muat satu komponen dan gantikan elemen penampungnya. */
  async function loadComponent(slot) {
    const name = slot.dataset.component;
    try {
      const response = await fetch(`${ROOT}components/${name}.html`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const template = document.createElement("template");
      template.innerHTML = (await response.text()).trim();

      resolvePaths(template.content);
      markActive(template.content);
      slot.replaceWith(template.content);
    } catch (error) {
      console.error(`[Zuppy] Gagal memuat komponen "${name}":`, error);
      slot.textContent = `Komponen "${name}" gagal dimuat. Pastikan project dijalankan lewat Live Server.`;
      slot.classList.add("component-error");
    }
  }

  /* ---------- Header & sidebar ---------- */
  function setHeaderOpen(open) {
    const header = document.getElementById("siteHeader");
    if (!header) return;
    header.classList.toggle("is-open", open);
    const toggle = header.querySelector("[data-nav-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    }
  }

  function setSidebarOpen(open) {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (!sidebar) return;
    sidebar.classList.toggle("is-open", open);
    if (overlay) overlay.classList.toggle("is-visible", open);
    document.body.classList.toggle("no-scroll", open);
  }

  /* ---------- Dropdown (menu profil) ---------- */
  function setDropdownOpen(dropdown, open) {
    dropdown.classList.toggle("is-open", open);
    const toggle = dropdown.querySelector("[data-dropdown-toggle]");
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  }

  function closeAllDropdowns() {
    document.querySelectorAll("[data-dropdown].is-open").forEach((dropdown) => {
      setDropdownOpen(dropdown, false);
    });
  }

  /** Navigasi keyboard di dalam menu: panah atas/bawah dan Esc. */
  function handleDropdownKeys(event) {
    const dropdown = document.querySelector("[data-dropdown].is-open");
    if (!dropdown) return false;

    if (event.key === "Escape") {
      const toggle = dropdown.querySelector("[data-dropdown-toggle]");
      closeAllDropdowns();
      if (toggle) toggle.focus();
      return true;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const items = Array.from(dropdown.querySelectorAll('[role="menuitem"]'));
      if (!items.length) return false;
      event.preventDefault();
      const index = items.indexOf(document.activeElement);
      let next;
      if (index === -1) next = event.key === "ArrowDown" ? 0 : items.length - 1;
      else next = (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
      return true;
    }
    return false;
  }

  /* ---------- Modal konfirmasi logout ---------- */
  let lastTrigger = null;

  function openLogoutModal() {
    if (document.getElementById("logoutModal")) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "logoutModal";
    modal.innerHTML = `
      <div class="modal__backdrop" data-modal-close></div>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="logoutTitle" aria-describedby="logoutDesc">
        <div class="modal__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
        </div>
        <h2 id="logoutTitle">Yakin mau keluar?</h2>
        <p id="logoutDesc">Progres, XP, dan datamu tetap tersimpan. Kamu bisa masuk lagi kapan saja.</p>
        <div class="modal__actions">
          <button class="btn btn--secondary" type="button" data-modal-close>Batal</button>
          <button class="btn btn--primary" type="button" data-modal-confirm>Ya, Logout</button>
        </div>
      </div>`;

    document.body.appendChild(modal);
    document.body.classList.add("no-scroll");

    // Aktifkan transisi di frame berikutnya, fokus ke tombol aman (Batal)
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      modal.querySelector("[data-modal-close].btn").focus();
    });
  }

  function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (!modal || modal.dataset.closing) return;
    modal.dataset.closing = "true";
    modal.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    window.setTimeout(() => modal.remove(), 220);
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  }

  /** Hapus sesi saja (akun & progres tetap), lalu ke halaman Login. */
  function confirmLogout() {
    const modal = document.getElementById("logoutModal");
    if (!modal || modal.dataset.closing) return;
    modal.dataset.closing = "true";
    modal.querySelectorAll("button").forEach((button) => { button.disabled = true; });

    if (window.ZuppyStorage && typeof window.ZuppyStorage.logout === "function") {
      window.ZuppyStorage.logout();
    } else {
      try { window.localStorage.removeItem("zuppy_session"); } catch (error) { /* abaikan */ }
    }
    // replace: halaman internal tidak tersisa di riwayat browser
    window.location.replace(withRoot("pages/login.html"));
  }

  /** Jaga fokus keyboard tetap di dalam modal. */
  function trapFocus(event) {
    const modal = document.getElementById("logoutModal");
    if (!modal) return false;

    if (event.key === "Escape") {
      closeLogoutModal();
      return true;
    }
    if (event.key === "Tab") {
      const buttons = Array.from(modal.querySelectorAll("button:not(:disabled)"));
      if (!buttons.length) return true;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return true;
    }
    return false;
  }

  /* ---------- Interaksi UI (event delegation, aman untuk komponen dinamis) ---------- */
  function bindUI() {
    document.addEventListener("click", (event) => {
      const target = event.target;

      // Modal logout
      if (target.closest("[data-modal-confirm]")) { confirmLogout(); return; }
      if (target.closest("[data-modal-close]")) { closeLogoutModal(); return; }

      // Dropdown: buka/tutup lewat tombol toggle
      const dropdownToggle = target.closest("[data-dropdown-toggle]");
      if (dropdownToggle) {
        const dropdown = dropdownToggle.closest("[data-dropdown]");
        const willOpen = !dropdown.classList.contains("is-open");
        closeAllDropdowns();
        setDropdownOpen(dropdown, willOpen);
        return;
      }
      // Klik di luar dropdown, atau memilih item menu, menutup dropdown
      if (!target.closest("[data-dropdown]") || target.closest("[data-dropdown-menu] a, [data-dropdown-menu] button")) {
        closeAllDropdowns();
      }

      // Header mobile
      if (target.closest("[data-nav-toggle]")) {
        const header = document.getElementById("siteHeader");
        setHeaderOpen(!(header && header.classList.contains("is-open")));
        return;
      }
      if (target.closest(".site-nav a, .site-header__actions a")) setHeaderOpen(false);

      // Sidebar drawer
      if (target.closest("[data-sidebar-toggle]")) { setSidebarOpen(true); return; }
      if (target.closest("[data-sidebar-close]")) { setSidebarOpen(false); return; }
      if (target.closest(".sidebar a")) setSidebarOpen(false);

      // Logout: tampilkan konfirmasi dulu
      const logout = target.closest('[data-action="logout"]');
      if (logout) {
        event.preventDefault();
        // Jika dari dropdown, kembalikan fokus ke tombol profil saat modal ditutup
        const owner = logout.closest("[data-dropdown]");
        lastTrigger = owner ? owner.querySelector("[data-dropdown-toggle]") : logout;
        openLogoutModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (trapFocus(event)) return;
      if (handleDropdownKeys(event)) return;
      if (event.key === "Escape") { setHeaderOpen(false); setSidebarOpen(false); }
    });

    // Fokus berpindah ke luar dropdown (mis. lewat Tab): tutup menu
    document.addEventListener("focusin", (event) => {
      if (!event.target.closest("[data-dropdown]")) closeAllDropdowns();
    });

    // Reset state mobile saat layar membesar
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) { setHeaderOpen(false); setSidebarOpen(false); }
    });
  }

  /* ---------- Init ---------- */
  // Perbaiki path pada konten halaman itu sendiri (gambar, tombol, link)
  resolvePaths(document);

  const slots = Array.from(document.querySelectorAll("[data-component]"));
  const ready = Promise.all(slots.map(loadComponent)).then(() => {
    document.dispatchEvent(new CustomEvent("components:ready"));
  });

  bindUI();

  // API publik untuk script halaman lain
  window.ZuppyComponents = { ready, root: ROOT, page: PAGE, withRoot, resolvePaths };
})();