/* ==========================================================
   ZUPPY — Halaman Profil (pages/profile.html)
   - Menampilkan identitas, statistik, dan progres per mata pelajaran
   - Edit nama / username / email (validasi + cek duplikat)
   - Ganti password (hash SHA-256 + salt, seperti auth.js)
   Bergantung pada: components.js, storage.js, navigation.js,
   data/subjects.js, data/questions.js

   Catatan: autentikasi LocalStorage hanya untuk simulasi / demo.
   ========================================================== */
(() => {
  "use strict";

  const Storage = window.ZuppyStorage;
  const Data = window.ZuppyData || {};

  let user = Storage.requireAuth("login.html");
  if (!user) return;

  const SUBJECTS = Array.isArray(Data.subjects) ? Data.subjects : [];
  const LEVELS = Data.levels || {};

  /* ---------- Helper ---------- */
  const $ = (id) => document.getElementById(id);

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const svg = (inner) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const ICON = {
    star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
    flame: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    book: svg('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    bolt: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>'),
  };

  const formatNumber = (n) => Number(n || 0).toLocaleString("id-ID");

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

  /* ---------- Hash password (sama dengan auth.js) ---------- */
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

  async function verifyPassword(password, account) {
    const algo = String(account.passwordHash || "").split(":")[0] || "sha256";
    const computed = await hashPassword(password, account.salt || "", algo);
    return computed === account.passwordHash;
  }

  /* ---------- Validasi ---------- */
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
      if (!value) return "Password baru wajib diisi.";
      if (value.length < 8) return "Password minimal 8 karakter.";
      if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Password harus berisi huruf dan angka.";
      return "";
    },
  };

  /* ---------- Helper UI ---------- */
  const fieldOf = (input) => input.closest(".field");

  function setFieldError(input, message) {
    const field = fieldOf(input);
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    field.querySelector(".field__error").textContent = message;
  }

  function clearFieldError(input) {
    const field = fieldOf(input);
    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    field.querySelector(".field__error").textContent = "";
  }

  function showAlert(box, type, message) {
    box.className = `alert alert--${type}`;
    box.textContent = message;
    box.hidden = false;
  }

  function hideAlert(box) {
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

  /* ---------- Render ---------- */
  function renderTopbar() {
    $("topGreeting").textContent = `${greeting()}!`;
    $("topName").textContent = user.fullName;
    $("topAvatar").textContent = initials(user.fullName);
    $("topUserName").textContent = firstName(user.fullName);
    $("topUserHandle").textContent = `@${user.username}`;
  }

  function renderHero(progress) {
    const info = Storage.getLevelInfo(progress.points);
    const joined = new Date(user.createdAt);
    const joinedText = Number.isNaN(joined.getTime())
      ? "Anggota Zuppy"
      : `Bergabung ${joined.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

    $("pfAvatar").textContent = initials(user.fullName);
    $("pfName").textContent = user.fullName;
    $("pfHandle").textContent = `@${user.username}`;
    $("pfEmail").textContent = user.email;
    $("pfLevel").textContent = `Level ${info.level} · ${formatNumber(progress.points)} XP`;
    $("pfJoined").textContent = joinedText;
  }

  function collectStats(progress) {
    let stars = 0;
    let cleared = 0;
    let totalLevels = 0;
    SUBJECTS.forEach((subject) => {
      const levels = LEVELS[subject.id] || [];
      totalLevels += levels.length;
      Storage.getLevelStatus(user.id, subject.id, levels.length).forEach((status) => {
        stars += status.stars;
        if (status.completed) cleared += 1;
      });
    });

    let correct = 0;
    let total = 0;
    progress.quizHistory.forEach((quiz) => {
      correct += Number(quiz.correct) || 0;
      total += Number(quiz.total) || 0;
    });

    return { stars, cleared, totalLevels, correct, total, accuracy: total ? Math.round((correct / total) * 100) : 0 };
  }

  function renderStats(progress) {
    const info = Storage.getLevelInfo(progress.points);
    const streak = Storage.getStreak(progress.activityLog);
    const s = collectStats(progress);

    const cards = [
      { tone: "yellow", icon: ICON.star, label: "Total XP", value: formatNumber(progress.points), sub: "Dikumpulkan dari level" },
      { tone: "purple", icon: ICON.bolt, label: "Level", value: String(info.level), sub: `${info.current}/${info.needed} XP ke Level ${info.level + 1}` },
      { tone: "pink", icon: ICON.flame, label: "Learning Streak", value: `${streak} hari`, sub: streak > 0 ? "hari berturut-turut" : "Belajar hari ini untuk mulai" },
      { tone: "turquoise", icon: ICON.book, label: "Level Selesai", value: `${s.cleared}/${s.totalLevels}`, sub: "dari semua mata pelajaran" },
      { tone: "purple", icon: ICON.target, label: "Akurasi Kuis", value: `${s.accuracy}%`, sub: s.total ? `${s.correct} dari ${s.total} jawaban benar` : "Belum ada kuis dikerjakan" },
      { tone: "yellow", icon: ICON.star, label: "Bintang", value: `${s.stars}/${s.totalLevels * 3}`, sub: "bintang terkumpul" },
    ];

    $("pfStats").innerHTML = cards.map((c) => `
      <article class="dash-stat dash-stat--${c.tone}">
        <span class="dash-stat__icon">${c.icon}</span>
        <div class="dash-stat__body">
          <p class="dash-stat__label">${esc(c.label)}</p>
          <p class="dash-stat__value">${esc(c.value)}</p>
          <p class="dash-stat__sub">${esc(c.sub)}</p>
        </div>
      </article>`).join("");
  }

  function renderSubjects() {
    const list = $("pfSubjects");
    if (!SUBJECTS.length) {
      list.innerHTML = '<p class="pf-note">Data mata pelajaran belum tersedia.</p>';
      return;
    }

    list.innerHTML = SUBJECTS.map((subject) => {
      const levels = LEVELS[subject.id] || [];
      const status = Storage.getLevelStatus(user.id, subject.id, levels.length);
      const cleared = status.filter((l) => l.completed).length;
      const stars = status.reduce((sum, l) => sum + l.stars, 0);
      const percent = levels.length ? Math.round((cleared / levels.length) * 100) : 0;

      return `
        <div class="pf-subject pf-subject--${esc(subject.accent)}">
          <span class="pf-subject__icon"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${subject.icon}</svg></span>
          <div class="pf-subject__body">
            <p class="pf-subject__name">${esc(subject.name)}</p>
            <p class="pf-subject__meta">${cleared}/${levels.length} level · ${stars}/${levels.length * 3} bintang</p>
            <div class="dash-progress"><span class="dash-progress__fill" data-fill="${percent}"></span></div>
          </div>
          <span class="pf-subject__pct">${percent}%</span>
        </div>`;
    }).join("");

    requestAnimationFrame(() => requestAnimationFrame(() => {
      list.querySelectorAll("[data-fill]").forEach((el) => { el.style.width = `${el.dataset.fill}%`; });
    }));
  }

  function fillForm() {
    const form = $("profileForm");
    form.elements.fullName.value = user.fullName;
    form.elements.username.value = user.username;
    form.elements.email.value = user.email;
  }

  function renderAll() {
    const progress = Storage.getProgress(user.id);
    renderTopbar();
    renderHero(progress);
    renderStats(progress);
    renderSubjects();
  }

  /* ---------- Edit profil ---------- */
  function initProfileForm() {
    const form = $("profileForm");
    const alertBox = $("profileAlert");
    const submitBtn = form.querySelector('button[type="submit"]');
    const f = form.elements;

    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => { clearFieldError(input); hideAlert(alertBox); });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      hideAlert(alertBox);

      const data = {
        fullName: f.fullName.value.trim().replace(/\s+/g, " "),
        username: f.username.value.trim(),
        email: f.email.value.trim(),
      };

      const errors = {
        fullName: validators.fullName(data.fullName),
        username: validators.username(data.username),
        email: validators.email(data.email),
      };

      // Cek duplikat (akun lain), hanya jika format sudah benar
      const sameUsername = Storage.findUserByUsername(data.username);
      if (!errors.username && sameUsername && sameUsername.id !== user.id) {
        errors.username = "Username sudah dipakai siswa lain.";
      }
      const sameEmail = Storage.findUserByEmail(data.email);
      if (!errors.email && sameEmail && sameEmail.id !== user.id) {
        errors.email = "Email ini sudah dipakai akun lain.";
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
        showAlert(alertBox, "error", "Periksa kembali isian yang ditandai ya.");
        firstInvalid.focus();
        return;
      }

      const unchanged =
        data.fullName === user.fullName &&
        data.username === user.username &&
        data.email === user.email;
      if (unchanged) {
        showAlert(alertBox, "info", "Belum ada perubahan yang perlu disimpan.");
        return;
      }

      setBusy(submitBtn, true, "Menyimpan...");
      const updated = Storage.updateUser(user.id, data);
      setBusy(submitBtn, false);

      if (!updated) {
        showAlert(alertBox, "error", "Perubahan gagal disimpan. Pastikan penyimpanan browser tidak diblokir.");
        return;
      }

      user = updated;
      fillForm();
      renderAll();
      showAlert(alertBox, "success", "Profil berhasil diperbarui!");
    });
  }

  /* ---------- Ganti password ---------- */
  function initPasswordForm() {
    const form = $("passwordForm");
    const alertBox = $("passwordAlert");
    const submitBtn = form.querySelector('button[type="submit"]');
    const f = form.elements;

    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => { clearFieldError(input); hideAlert(alertBox); });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideAlert(alertBox);

      const current = f.currentPassword.value;
      const next = f.newPassword.value;
      const confirm = f.confirmPassword.value;

      const errors = {
        currentPassword: current ? "" : "Password lama wajib diisi.",
        newPassword: validators.password(next),
        confirmPassword: !confirm
          ? "Konfirmasi password wajib diisi."
          : confirm !== next ? "Konfirmasi password belum sama dengan password baru." : "",
      };
      if (!errors.newPassword && current && next === current) {
        errors.newPassword = "Password baru harus berbeda dari password lama.";
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
        showAlert(alertBox, "error", "Periksa kembali isian yang ditandai ya.");
        firstInvalid.focus();
        return;
      }

      setBusy(submitBtn, true, "Memeriksa...");

      const valid = await verifyPassword(current, user);
      if (!valid) {
        setBusy(submitBtn, false);
        setFieldError(f.currentPassword, "Password lama salah.");
        showAlert(alertBox, "error", "Password lama tidak sesuai.");
        f.currentPassword.focus();
        return;
      }

      const salt = randomSalt();
      const passwordHash = await hashPassword(next, salt);
      const updated = Storage.updateUser(user.id, { passwordHash, salt });
      setBusy(submitBtn, false);

      if (!updated) {
        showAlert(alertBox, "error", "Password gagal disimpan. Pastikan penyimpanan browser tidak diblokir.");
        return;
      }

      user = updated;
      form.reset();
      showAlert(alertBox, "success", "Password berhasil diganti!");
    });
  }

  /** Tombol show/hide password. */
  function initPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      const input = $(button.dataset.togglePassword);
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

  /* ---------- Init ---------- */
  fillForm();
  renderAll();
  initProfileForm();
  initPasswordForm();
  initPasswordToggles();
})();