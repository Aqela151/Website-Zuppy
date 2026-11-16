/* ==========================================================
   ZUPPY — Autentikasi (login & register siswa)
   Dipakai oleh pages/login.html dan pages/register.html.
   Bergantung pada: js/storage.js (ZuppyStorage).

   Jika siswa sudah login, halaman login/register langsung
   mengarahkan ke dashboard.

   Catatan: ini simulasi demo berbasis LocalStorage, bukan
   sistem keamanan produksi.
   ========================================================== */
(() => {
  "use strict";

  const Storage = window.ZuppyStorage;
  const DASHBOARD_URL = "dashboard-student.html";
  const LOGIN_URL = "login.html";

  /* ---------- Hash password (demo) ---------- */
  const canUseSubtle = !!(window.crypto && window.crypto.subtle);

  function fnv1a(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  function randomSalt() {
    const bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  /** Hasil berformat "algoritma:hash". SHA-256 jika tersedia (Live Server / localhost). */
  async function hashPassword(password, salt, algo = canUseSubtle ? "sha256" : "fnv") {
    const input = `${salt}:${password}`;
    if (algo === "sha256" && canUseSubtle) {
      const buffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
      const hex = Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
      return `sha256:${hex}`;
    }
    const reversed = input.split("").reverse().join("");
    return `fnv:${fnv1a(input)}${fnv1a(reversed)}`;
  }

  async function verifyPassword(password, user) {
    const algo = String(user.passwordHash || "").split(":")[0] || "sha256";
    const computed = await hashPassword(password, user.salt || "", algo);
    return computed === user.passwordHash;
  }

  /* ---------- Aturan validasi ---------- */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validators = {
    fullName(value) {
      if (!value) return "Nama lengkap wajib diisi.";
      if (value.length < 3) return "Nama minimal 3 karakter.";
      if (value.length > 50) return "Nama maksimal 50 karakter.";
      if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(value)) return "Nama hanya boleh berisi huruf, spasi, titik, apostrof, atau tanda hubung.";
      return "";
    },
    username(value) {
      if (!value) return "Username wajib diisi.";
      if (value.length < 3) return "Username minimal 3 karakter.";
      if (value.length > 20) return "Username maksimal 20 karakter.";
      if (!/^[a-zA-Z0-9_.]+$/.test(value)) return "Username hanya boleh huruf, angka, titik, dan underscore.";
      return "";
    },
    email(value) {
      if (!value) return "Email wajib diisi.";
      if (!EMAIL_PATTERN.test(value)) return "Format email belum benar, contoh: nama@email.com.";
      return "";
    },
    password(value) {
      if (!value) return "Password wajib diisi.";
      if (value.length < 8) return "Password minimal 8 karakter.";
      if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Password harus berisi huruf dan angka.";
      return "";
    },
    confirmPassword(value, password) {
      if (!value) return "Konfirmasi password wajib diisi.";
      if (value !== password) return "Konfirmasi password belum sama dengan password.";
      return "";
    },
  };

  /* ---------- Helper UI ---------- */
  const fieldOf = (input) => input.closest(".field");

  function setFieldError(input, message) {
    const field = fieldOf(input);
    const errorEl = field.querySelector(".field__error");
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
  }

  function clearFieldError(input) {
    const field = fieldOf(input);
    const errorEl = field.querySelector(".field__error");
    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    errorEl.textContent = "";
  }

  function showAlert(type, message) {
    const box = document.getElementById("formAlert");
    box.className = `alert alert--${type}`;
    box.textContent = message;
    box.hidden = false;
  }

  function hideAlert() {
    const box = document.getElementById("formAlert");
    box.hidden = true;
    box.textContent = "";
  }

  function setBusy(button, busy, busyLabel) {
    const label = button.querySelector(".btn__label");
    if (busy) {
      button.dataset.label = label.textContent;
      label.textContent = busyLabel;
    } else if (button.dataset.label) {
      label.textContent = button.dataset.label;
    }
    button.disabled = busy;
  }

  /** Tombol show/hide password. */
  function initPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      button.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.classList.toggle("is-visible", show);
        button.setAttribute("aria-pressed", String(show));
        button.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
      });
    });
  }

  /** Hapus pesan error saat pengguna mengetik ulang. */
  function initClearOnInput(form) {
    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        clearFieldError(input);
        hideAlert();
      });
    });
  }

  /** Siswa yang sudah login tidak perlu melihat halaman login/register. */
  function redirectIfLoggedIn() {
    if (Storage.isLoggedIn()) {
      window.location.replace(DASHBOARD_URL);
      return true;
    }
    return false;
  }

  /* ---------- LOGIN ---------- */
  function initLogin(form) {
    const params = new URLSearchParams(window.location.search);
    const identifierInput = form.elements.identifier;
    const passwordInput = form.elements.password;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (params.get("registered") === "1") {
      showAlert("success", "Akun berhasil dibuat! Silakan masuk untuk mulai belajar.");
      identifierInput.value = params.get("id") || "";
      passwordInput.focus();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideAlert();
      clearFieldError(identifierInput);
      clearFieldError(passwordInput);

      const identifier = identifierInput.value.trim();
      const password = passwordInput.value;

      let hasError = false;
      if (!identifier) {
        setFieldError(identifierInput, "Email atau username wajib diisi.");
        hasError = true;
      }
      if (!password) {
        setFieldError(passwordInput, "Password wajib diisi.");
        hasError = true;
      }
      if (hasError) {
        (identifier ? passwordInput : identifierInput).focus();
        return;
      }

      setBusy(submitBtn, true, "Memeriksa...");

      const user = Storage.findUserByIdentifier(identifier);
      if (!user) {
        setBusy(submitBtn, false);
        setFieldError(identifierInput, "Akun tidak ditemukan. Cek lagi atau daftar dulu ya.");
        showAlert("error", "Login gagal: akun belum terdaftar.");
        identifierInput.focus();
        return;
      }

      const valid = await verifyPassword(password, user);
      if (!valid) {
        setBusy(submitBtn, false);
        setFieldError(passwordInput, "Password salah. Coba lagi ya.");
        showAlert("error", "Login gagal: password tidak sesuai.");
        passwordInput.focus();
        return;
      }

      if (!Storage.setSession(user.id)) {
        setBusy(submitBtn, false);
        showAlert("error", "Sesi gagal disimpan. Pastikan penyimpanan browser tidak diblokir.");
        return;
      }

      showAlert("success", `Selamat datang, ${user.fullName}! Mengarahkan ke dashboard...`);
      window.setTimeout(() => window.location.assign(DASHBOARD_URL), 800);
    });
  }

  /* ---------- REGISTER ---------- */
  function initRegister(form) {
    const f = form.elements;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validasi saat pindah kolom
    const liveRules = {
      fullName: (v) => validators.fullName(v.trim()),
      username: (v) => validators.username(v.trim()),
      email: (v) => validators.email(v.trim()),
      password: (v) => validators.password(v),
      confirmPassword: (v) => validators.confirmPassword(v, f.password.value),
    };
    Object.keys(liveRules).forEach((name) => {
      f[name].addEventListener("blur", () => {
        if (!f[name].value) return; // kolom kosong baru ditandai saat submit
        const message = liveRules[name](f[name].value);
        if (message) setFieldError(f[name], message);
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideAlert();

      const data = {
        fullName: f.fullName.value.trim().replace(/\s+/g, " "),
        username: f.username.value.trim(),
        email: f.email.value.trim(),
        password: f.password.value,
        confirmPassword: f.confirmPassword.value,
      };

      const errors = {
        fullName: validators.fullName(data.fullName),
        username: validators.username(data.username),
        email: validators.email(data.email),
        password: validators.password(data.password),
        confirmPassword: validators.confirmPassword(data.confirmPassword, data.password),
      };

      // Cek duplikat hanya jika format sudah benar
      if (!errors.username && Storage.findUserByUsername(data.username)) {
        errors.username = "Username sudah dipakai. Coba yang lain ya.";
      }
      if (!errors.email && Storage.findUserByEmail(data.email)) {
        errors.email = "Email ini sudah terdaftar. Silakan login.";
      }

      let firstInvalid = null;
      Object.keys(errors).forEach((name) => {
        clearFieldError(f[name]);
        if (errors[name]) {
          setFieldError(f[name], errors[name]);
          if (!firstInvalid) firstInvalid = f[name];
        }
      });

      if (firstInvalid) {
        showAlert("error", "Periksa kembali isian yang ditandai ya.");
        firstInvalid.focus();
        return;
      }

      setBusy(submitBtn, true, "Membuat akun...");

      const salt = randomSalt();
      const passwordHash = await hashPassword(data.password, salt);
      const result = Storage.createUser({
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        passwordHash,
        salt,
      });

      if (!result.ok) {
        setBusy(submitBtn, false);
        if (result.error === "username") setFieldError(f.username, "Username sudah dipakai. Coba yang lain ya.");
        else if (result.error === "email") setFieldError(f.email, "Email ini sudah terdaftar. Silakan login.");
        else showAlert("error", "Data gagal disimpan. Pastikan penyimpanan browser tidak diblokir.");
        return;
      }

      showAlert("success", "Yay, akunmu berhasil dibuat! Mengarahkan ke halaman login...");
      form.querySelectorAll("input, button").forEach((el) => { el.disabled = true; });
      window.setTimeout(() => {
        window.location.assign(`${LOGIN_URL}?registered=1&id=${encodeURIComponent(data.username)}`);
      }, 1600);
    });
  }

  /* ---------- Init ---------- */
  // Halaman dipulihkan dari cache lewat tombol Back
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) redirectIfLoggedIn();
  });

  if (!redirectIfLoggedIn()) {
    initPasswordToggles();

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    if (loginForm) { initClearOnInput(loginForm); initLogin(loginForm); }
    if (registerForm) { initClearOnInput(registerForm); initRegister(registerForm); }
  }
})();