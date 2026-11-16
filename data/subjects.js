/* ==========================================================
   ZUPPY — Data mata pelajaran
   Dipakai dashboard dan halaman Mata Pelajaran.
   `icon` berisi isi SVG (viewBox 24x24, gaya garis).
   `accent`: purple | turquoise | pink | yellow
   Jumlah materi dihitung dari window.ZuppyData.materials
   (data/materials.js, dibuat pada tahap Learning System).
   ========================================================== */
window.ZuppyData = window.ZuppyData || {};

window.ZuppyData.subjects = [
  {
    id: "matematika",
    name: "Matematika",
    tag: "Kalkulasi & Logika",
    description: "Pecahkan aljabar, kalkulasi cepat, geometri, dan logika hitung.",
    accent: "purple",
    icon: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
  },
  {
    id: "bahasa-indonesia",
    name: "Bahasa Indonesia",
    tag: "Literasi & Bahasa",
    description: "Kuasai pemahaman teks, tata bahasa baku, EYD, dan apresiasi sastra.",
    accent: "turquoise",
    icon: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  },
  {
    id: "bahasa-inggris",
    name: "Bahasa Inggris",
    tag: "Daily English",
    description: "Perluas vocabulary, grammar, reading, dan dialog sehari-hari.",
    accent: "pink",
    icon: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
  {
    id: "ipa",
    name: "IPA",
    tag: "Eksplorasi Sains",
    description: "Eksplorasi sains, fisika dasar, ekosistem, dan reaksi zat.",
    accent: "yellow",
    icon: '<path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.5 15h9"/>',
  },
  {
    id: "ips",
    name: "IPS",
    tag: "Dunia & Masyarakat",
    description: "Pelajari dinamika masyarakat, sejarah, dan geografi nusantara.",
    accent: "turquoise",
    icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  },
  {
    id: "pancasila",
    name: "Pendidikan Pancasila",
    tag: "Karakter & Nilai",
    description: "Pahami kebhinekaan, norma hukum, toleransi, serta hak dan kewajiban.",
    accent: "purple",
    icon: '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7z"/>',
  },
];