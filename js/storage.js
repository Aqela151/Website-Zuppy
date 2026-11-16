/* ==========================================================
   ZUPPY — Storage (LocalStorage terpusat)
   Hanya satu role: siswa. Data disimpan terpisah per akun.

   Key yang dipakai:
   - zuppy_users            : daftar akun
   - zuppy_session          : sesi login aktif { userId, loginAt }
   - zuppy_progress_<id>    : progres belajar tiap siswa

   Struktur progres:
   {
     points, level,
     completedMaterials: ["subjectId/materialId", ...],
     quizHistory: [{ subjectId, materialId, title, correct, total, score, xp, at }],
     activityLog: [{ type: "material" | "quiz" | "challenge", title, xp, at, ... }],
     lastMaterial: { subjectId, materialId, title, progress } | null,
     challengeClaims: { "YYYY-MM-DD": ["challengeId", ...] }
   }

   Catatan: autentikasi LocalStorage hanya untuk simulasi / demo,
   bukan sistem keamanan produksi.
   ========================================================== */
(() => {
  "use strict";

  const KEYS = {
    users: "zuppy_users",
    session: "zuppy_session",
    progress: (userId) => `zuppy_progress_${userId}`,
  };

  const XP_PER_LEVEL = 200; // setiap 200 XP naik 1 level
  const MAX_LOG = 200;      // batas riwayat aktivitas yang disimpan

  /* ---------- Helper dasar ---------- */
  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error(`[Zuppy] Gagal membaca "${key}":`, error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Zuppy] Gagal menyimpan "${key}":`, error);
      return false;
    }
  }

  const normalize = (text) => String(text || "").trim().toLowerCase();

  /** Kunci tanggal lokal "YYYY-MM-DD". */
  function dateKey(input = new Date()) {
    const d = input instanceof Date ? input : new Date(input);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  }

  /* ---------- Akun ---------- */
  function getUsers() {
    const users = read(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  function findUserById(id) {
    return getUsers().find((user) => user.id === id) || null;
  }

  function findUserByEmail(email) {
    const target = normalize(email);
    return getUsers().find((user) => normalize(user.email) === target) || null;
  }

  function findUserByUsername(username) {
    const target = normalize(username);
    return getUsers().find((user) => normalize(user.username) === target) || null;
  }

  /** Cari akun lewat email (jika memuat "@") atau username. */
  function findUserByIdentifier(identifier) {
    const value = String(identifier || "").trim();
    return value.includes("@") ? findUserByEmail(value) : findUserByUsername(value);
  }

  function generateId() {
    return `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Buat akun siswa baru.
   * @returns {{ok: true, user: object} | {ok: false, error: string}}
   */
  function createUser({ fullName, username, email, passwordHash, salt }) {
    if (findUserByEmail(email)) return { ok: false, error: "email" };
    if (findUserByUsername(username)) return { ok: false, error: "username" };

    const user = {
      id: generateId(),
      fullName,
      username,
      email,
      passwordHash,
      salt,
      role: "siswa",
      createdAt: new Date().toISOString(),
    };

    const users = getUsers();
    users.push(user);
    if (!write(KEYS.users, users)) return { ok: false, error: "storage" };
    return { ok: true, user };
  }

  /** Perbarui data akun (id dan role tidak bisa diubah). */
  function updateUser(id, patch) {
    const users = getUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...patch, id: users[index].id, role: "siswa" };
    return write(KEYS.users, users) ? users[index] : null;
  }

  /* ---------- Sesi ---------- */
  function setSession(userId) {
    return write(KEYS.session, { userId, loginAt: new Date().toISOString() });
  }

  function getSession() {
    const session = read(KEYS.session, null);
    return session && session.userId ? session : null;
  }

  /** Akun yang sedang login, atau null jika belum login / akun tidak ada. */
  function getCurrentUser() {
    const session = getSession();
    return session ? findUserById(session.userId) : null;
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  /** Logout hanya menghapus sesi, data akun dan progres tetap tersimpan. */
  function logout() {
    try {
      window.localStorage.removeItem(KEYS.session);
    } catch (error) {
      console.error("[Zuppy] Gagal logout:", error);
    }
  }

  /** Untuk halaman yang butuh login. Mengembalikan akun, atau mengarahkan ke login. */
  function requireAuth(loginPath = "login.html") {
    const user = getCurrentUser();
    if (!user) {
      window.location.replace(loginPath);
      return null;
    }
    return user;
  }

  /* ---------- Level ---------- */
  function levelFromPoints(points) {
    return Math.floor(Math.max(0, Number(points) || 0) / XP_PER_LEVEL) + 1;
  }

  /** Info level: { level, current, needed, percent } untuk bar XP. */
  function getLevelInfo(points) {
    const safe = Math.max(0, Number(points) || 0);
    const current = safe % XP_PER_LEVEL;
    return {
      level: levelFromPoints(safe),
      current,
      needed: XP_PER_LEVEL,
      percent: Math.round((current / XP_PER_LEVEL) * 100),
    };
  }

  /* ---------- Progres (terpisah per siswa) ---------- */
  function defaultProgress() {
    return {
      points: 0,
      level: 1,
      completedMaterials: [],
      quizHistory: [],
      activityLog: [],
      lastMaterial: null,
      challengeClaims: {},
    };
  }

  function getProgress(userId) {
    const saved = read(KEYS.progress(userId), null);
    const progress = { ...defaultProgress(), ...(saved || {}) };
    if (!Array.isArray(progress.completedMaterials)) progress.completedMaterials = [];
    if (!Array.isArray(progress.quizHistory)) progress.quizHistory = [];
    if (!Array.isArray(progress.activityLog)) progress.activityLog = [];
    if (!progress.challengeClaims || typeof progress.challengeClaims !== "object") progress.challengeClaims = {};
    progress.points = Math.max(0, Number(progress.points) || 0);
    progress.level = levelFromPoints(progress.points);
    return progress;
  }

  function saveProgress(userId, progress) {
    return write(KEYS.progress(userId), progress);
  }

  function applyXP(progress, amount) {
    progress.points = Math.max(0, progress.points + (Number(amount) || 0));
    progress.level = levelFromPoints(progress.points);
  }

  function pushActivity(progress, entry) {
    progress.activityLog.push({ ...entry, at: new Date().toISOString() });
    if (progress.activityLog.length > MAX_LOG) {
      progress.activityLog = progress.activityLog.slice(-MAX_LOG);
    }
  }

  /**
   * Tandai materi selesai. XP hanya diberikan pada penyelesaian pertama.
   * @returns {{isNew: boolean, progress: object}}
   */
  function completeMaterial(userId, { subjectId, materialId, title, xp = 0 }) {
    const progress = getProgress(userId);
    const key = `${subjectId}/${materialId}`;
    const isNew = !progress.completedMaterials.includes(key);

    if (isNew) {
      progress.completedMaterials.push(key);
      applyXP(progress, xp);
      pushActivity(progress, { type: "material", subjectId, materialId, title, xp });
    }
    progress.lastMaterial = { subjectId, materialId, title, progress: 100 };
    saveProgress(userId, progress);
    return { isNew, progress };
  }

  /** Simpan materi terakhir yang dibuka (untuk "Lanjutkan Belajar"). */
  function setLastMaterial(userId, { subjectId, materialId, title, progress: percent = 0 }) {
    const progress = getProgress(userId);
    const done = progress.completedMaterials.includes(`${subjectId}/${materialId}`);
    progress.lastMaterial = {
      subjectId,
      materialId,
      title,
      progress: done ? 100 : Math.min(100, Math.max(0, Math.round(percent))),
    };
    saveProgress(userId, progress);
    return progress;
  }

  /** Simpan hasil kuis: riwayat, aktivitas, dan XP. */
  function recordQuizResult(userId, { subjectId, materialId, title, correct, total, xp = 0 }) {
    const progress = getProgress(userId);
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const at = new Date().toISOString();

    progress.quizHistory.push({ subjectId, materialId, title, correct, total, score, xp, at });
    applyXP(progress, xp);
    pushActivity(progress, { type: "quiz", subjectId, materialId, title, correct, total, xp });
    saveProgress(userId, progress);
    return progress;
  }

  /** Klaim hadiah tantangan harian (sekali per tantangan per hari). */
  function claimChallenge(userId, challengeId, xp, title) {
    const progress = getProgress(userId);
    const today = dateKey();
    const claimedToday = (progress.challengeClaims[today] || []).slice();

    if (claimedToday.includes(challengeId)) return false;

    claimedToday.push(challengeId);
    progress.challengeClaims = { [today]: claimedToday }; // hanya simpan hari ini
    applyXP(progress, xp);
    pushActivity(progress, { type: "challenge", title, xp });
    return saveProgress(userId, progress);
  }

  /** Streak: jumlah hari berturut-turut belajar (materi/kuis), berakhir hari ini atau kemarin. */
  function getStreak(activityLog) {
    const log = Array.isArray(activityLog) ? activityLog : [];
    const days = new Set(
      log.filter((e) => e.type === "material" || e.type === "quiz").map((e) => dateKey(e.at))
    );

    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

    let streak = 0;
    while (days.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  window.ZuppyStorage = {
    getUsers, findUserById, findUserByEmail, findUserByUsername, findUserByIdentifier,
    createUser, updateUser,
    setSession, getSession, getCurrentUser, isLoggedIn, logout, requireAuth,
    dateKey, getLevelInfo,
    getProgress, saveProgress,
    completeMaterial, setLastMaterial, recordQuizResult, claimChallenge, getStreak,
  };
})();