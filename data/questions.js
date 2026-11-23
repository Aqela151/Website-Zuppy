/* ==========================================================
   ZUPPY — Bank level & soal permainan
   ZuppyData.levels[subjectId] = [ { id, title, place, ... questions } ]
   Setiap level berisi 5 soal (tingkat sedang). Tipe soal:
   - mc(pertanyaan, [pilihan], indeksJawabanBenar, penjelasan)
   - tf(pernyataan, benar?, penjelasan)
   Untuk menambah level/soal cukup tambahkan objek baru di sini.
   ========================================================== */
window.ZuppyData = window.ZuppyData || {};

(() => {
  "use strict";

  const mc = (q, options, answer, explain) => ({ type: "mc", q, options, answer, explain });
  const tf = (q, isTrue, explain) => ({ type: "tf", q, options: ["Benar", "Salah"], answer: isTrue ? 0 : 1, explain });

  const MOMO = "Text: Rina has a cat named Momo. Momo is white and very fluffy. Every morning, Momo drinks milk.";

  const levels = {
    /* ================= MATEMATIKA ================= */
    matematika: [
      {
        id: 1,
        title: "Lembah Bilangan",
        place: "Lembah Bilangan",
        description: "Taklukkan bilangan bulat dan pecahan di lembah penuh angka ajaib.",
        topic: "Bilangan bulat & pecahan",
        story: "Zuppy tersesat di Lembah Bilangan. Gerbang keluar hanya terbuka bagi petualang yang menguasai bilangan bulat dan pecahan!",
        goal: "Jawab 5 soal tentang bilangan bulat dan pecahan untuk membuka gerbang lembah.",
        recap: "Negatif dikali negatif hasilnya positif, dan pecahan harus disamakan penyebutnya sebelum dijumlahkan.",
        questions: [
          mc("Hasil dari -8 + 15 - 4 adalah ...", ["-3", "3", "11", "27"], 1, "Kerjakan dari kiri: -8 + 15 = 7, lalu 7 - 4 = 3."),
          tf("Hasil dari (-6) × (-3) adalah -18.", false, "Negatif dikali negatif menghasilkan positif, jadi (-6) × (-3) = 18."),
          mc("Hasil dari 2/3 + 1/6 adalah ...", ["3/9", "5/6", "3/6", "7/6"], 1, "Samakan penyebut: 2/3 = 4/6, sehingga 4/6 + 1/6 = 5/6."),
          mc("Urutan bilangan dari yang terkecil ke terbesar untuk 3, -5, 0, -2 adalah ...", ["-5, -2, 0, 3", "-2, -5, 0, 3", "0, -2, -5, 3", "3, 0, -2, -5"], 0, "Pada garis bilangan, makin ke kiri makin kecil: -5, lalu -2, 0, dan 3."),
          tf("Pecahan 3/4 sama nilainya dengan 75%.", true, "3/4 = 0,75 dan 0,75 × 100% = 75%."),
        ],
      },
      {
        id: 2,
        title: "Hutan Aljabar",
        place: "Hutan Aljabar",
        description: "Pecahkan teka-teki variabel di hutan yang penuh huruf misterius.",
        topic: "Aljabar & persamaan linear satu variabel",
        story: "Pepohonan di Hutan Aljabar menyembunyikan huruf x dan y. Bantu Zuppy menemukan nilai yang hilang agar jalan setapak terbuka!",
        goal: "Selesaikan 5 soal aljabar dan persamaan sederhana untuk menemukan jalan keluar hutan.",
        recap: "Untuk mencari nilai x, lakukan operasi yang sama pada kedua ruas persamaan sampai x berdiri sendiri.",
        questions: [
          mc("Nilai x dari 2x + 5 = 17 adalah ...", ["11", "6", "12", "22"], 1, "2x = 17 - 5 = 12, sehingga x = 12 ÷ 2 = 6."),
          mc("Bentuk sederhana dari 4a + 3a - 2a adalah ...", ["9a", "5a", "7a", "a"], 1, "Suku sejenis dijumlahkan: 4a + 3a - 2a = 5a."),
          tf("Jika 5x = 35, maka x = 7.", true, "Bagi kedua ruas dengan 5: x = 35 ÷ 5 = 7."),
          mc("Penyelesaian dari 3x - 4 = 11 adalah ...", ["x = 3", "x = 5", "x = 7", "x = 15"], 1, "3x = 11 + 4 = 15, sehingga x = 15 ÷ 3 = 5."),
          mc("Umur Dika x tahun dan kakaknya 5 tahun lebih tua. Jika umur kakak 17 tahun, umur Dika adalah ...", ["10 tahun", "12 tahun", "22 tahun", "5 tahun"], 1, "x + 5 = 17, sehingga x = 12 tahun."),
        ],
      },
      {
        id: 3,
        title: "Menara Geometri",
        place: "Menara Geometri",
        description: "Daki menara bangun datar dan teorema Pythagoras sampai ke puncak.",
        topic: "Bangun datar & teorema Pythagoras",
        story: "Di puncak Menara Geometri tersimpan peta harta karun. Tapi tiap lantainya dijaga teka-teki bangun datar dan sudut!",
        goal: "Jawab 5 soal geometri untuk mencapai puncak menara.",
        recap: "Luas persegi panjang = panjang × lebar, luas segitiga = ½ × alas × tinggi, dan sisi miring segitiga siku-siku dihitung dengan Pythagoras.",
        questions: [
          mc("Luas persegi panjang dengan panjang 12 cm dan lebar 5 cm adalah ...", ["17 cm²", "34 cm²", "60 cm²", "120 cm²"], 2, "Luas = 12 × 5 = 60 cm²."),
          mc("Keliling lingkaran dengan jari-jari 14 cm (π = 22/7) adalah ...", ["44 cm", "88 cm", "154 cm", "616 cm"], 1, "K = 2πr = 2 × 22/7 × 14 = 88 cm."),
          tf("Jumlah besar sudut dalam sebuah segitiga adalah 180°.", true, "Apa pun jenis segitiganya, jumlah ketiga sudutnya selalu 180°."),
          mc("Segitiga siku-siku memiliki sisi tegak 6 cm dan 8 cm. Panjang sisi miringnya adalah ...", ["10 cm", "12 cm", "14 cm", "48 cm"], 0, "c² = 6² + 8² = 36 + 64 = 100, sehingga c = 10 cm."),
          tf("Luas segitiga dengan alas 10 cm dan tinggi 6 cm adalah 60 cm².", false, "Luas segitiga = ½ × 10 × 6 = 30 cm², bukan 60 cm²."),
        ],
      },
    ],

    /* ================= BAHASA INDONESIA ================= */
    "bahasa-indonesia": [
      {
        id: 1,
        title: "Hutan Kata",
        place: "Hutan Kata",
        description: "Telusuri hutan kata baku dan ejaan yang benar.",
        topic: "Kata baku & ejaan (PUEBI)",
        story: "Zuppy menemukan hutan yang pohonnya berbentuk huruf. Hanya penulisan yang benar yang bisa membuka jalan!",
        goal: "Jawab 5 soal kata baku dan ejaan untuk keluar dari hutan.",
        recap: "Gunakan kata baku sesuai KBBI, tulis 'di-' serangkai pada kata kerja, dan pisahkan dari kata tempat.",
        questions: [
          mc("Kata baku yang benar adalah ...", ["analisa", "analisis", "analises", "analisys"], 1, "Menurut KBBI, bentuk bakunya adalah analisis."),
          mc("Penulisan 'di' yang benar terdapat pada kalimat ...", ["Buku itu dibaca oleh Rina.", "Buku itu di baca oleh Rina.", "Ibu pergi dipasar.", "Ayah tinggal dikota Malang."], 0, "'Di-' ditulis serangkai pada kata kerja (dibaca), tetapi dipisah dari kata tempat (di pasar, di kota)."),
          tf("Kata 'silahkan' adalah bentuk baku, sedangkan 'silakan' tidak baku.", false, "Yang baku adalah 'silakan'. 'Silahkan' adalah bentuk tidak baku."),
          mc("Penggunaan huruf kapital yang tepat terdapat pada kalimat ...", ["Adik membeli buku di jalan Veteran.", "Kami berlibur ke Pulau Bali pada bulan Agustus.", "Kakak kuliah di universitas indonesia.", "Kami menonton film pada hari minggu."], 1, "Nama pulau dan nama bulan diawali huruf kapital. Pilihan lain keliru: seharusnya 'Jalan Veteran', 'Universitas Indonesia', dan 'hari Minggu'."),
          mc("Penulisan kata berimbuhan yang benar adalah ...", ["mempengaruhi", "memengaruhi", "mempengarui", "memengarui"], 1, "Huruf awal p pada kata dasar 'pengaruh' luluh saat mendapat awalan me-, sehingga menjadi memengaruhi."),
        ],
      },
      {
        id: 2,
        title: "Sungai Teks",
        place: "Sungai Teks",
        description: "Arungi sungai teks dan temukan gagasan utama di tiap arus.",
        topic: "Jenis teks & gagasan utama",
        story: "Arus Sungai Teks membawa potongan paragraf yang tercerai-berai. Susun maknanya agar perahu Zuppy sampai ke seberang!",
        goal: "Jawab 5 soal tentang teks dan paragraf untuk menyeberangi sungai.",
        recap: "Ide pokok adalah gagasan utama paragraf. Fakta dapat dibuktikan kebenarannya, sedangkan opini berupa pendapat.",
        questions: [
          mc("Gagasan utama dalam sebuah paragraf disebut ...", ["kalimat penjelas", "ide pokok", "simpulan", "judul"], 1, "Ide pokok adalah gagasan utama yang menjadi inti paragraf."),
          mc("Teks yang menjelaskan langkah-langkah melakukan sesuatu disebut teks ...", ["deskripsi", "narasi", "prosedur", "eksposisi"], 2, "Teks prosedur berisi urutan langkah, misalnya cara membuat teh."),
          tf("Teks narasi menceritakan rangkaian peristiwa berdasarkan urutan waktu.", true, "Narasi menyajikan cerita yang disusun berurutan, dari awal hingga akhir."),
          mc("Kalimat berikut yang merupakan opini adalah ...", ["Air membeku pada suhu 0°C.", "Candi Borobudur terletak di Magelang.", "Durian pasti lebih enak daripada mangga.", "Indonesia memiliki banyak pulau."], 2, "Opini adalah pendapat pribadi yang tidak dapat dibuktikan. Kalimat lainnya berisi fakta."),
          mc("Bagian awal berita yang memuat inti informasi (unsur 5W + 1H) disebut ...", ["ekor berita", "tubuh berita", "teras berita", "tajuk"], 2, "Teras berita (lead) adalah paragraf pembuka yang merangkum inti berita."),
        ],
      },
      {
        id: 3,
        title: "Pulau Sastra",
        place: "Pulau Sastra",
        description: "Jelajahi pulau yang penuh majas, puisi, dan tokoh cerita.",
        topic: "Majas & unsur karya sastra",
        story: "Di Pulau Sastra, pepohonan berbisik dan awan bercerita. Pahami bahasanya agar penduduk pulau mau menunjukkan harta karunnya!",
        goal: "Jawab 5 soal tentang majas dan unsur cerita untuk menaklukkan pulau.",
        recap: "Majas adalah gaya bahasa. Tema adalah ide dasar cerita, sedangkan amanat adalah pesan yang disampaikan pengarang.",
        questions: [
          mc("Majas dalam kalimat 'Senyumnya semanis madu' adalah ...", ["hiperbola", "personifikasi", "perumpamaan", "ironi"], 2, "Senyum dibandingkan dengan madu memakai kata pembanding (se-manis), itulah perumpamaan."),
          mc("Majas dalam kalimat 'Angin berbisik di telingaku' adalah ...", ["personifikasi", "metafora", "litotes", "sarkasme"], 0, "Angin diberi sifat manusia (berbisik), itulah personifikasi."),
          tf("Tema adalah pesan moral yang ingin disampaikan pengarang kepada pembaca.", false, "Pesan moral disebut amanat. Tema adalah ide dasar atau pokok persoalan cerita."),
          mc("Tokoh berwatak jahat yang menjadi lawan tokoh utama disebut ...", ["protagonis", "antagonis", "tritagonis", "figuran"], 1, "Antagonis adalah tokoh yang berlawanan dengan protagonis (tokoh utama)."),
          tf("Hiperbola adalah gaya bahasa yang melebih-lebihkan sesuatu.", true, "Contoh: 'Tangisnya membanjiri seluruh kota'."),
        ],
      },
    ],

    /* ================= BAHASA INGGRIS ================= */
    "bahasa-inggris": [
      {
        id: 1,
        title: "Greeting Garden",
        place: "Greeting Garden",
        description: "Sapa para penghuni taman dengan sapaan dan kosakata dasar.",
        topic: "Greetings, vocabulary & basic grammar",
        story: "Taman Greeting dihuni bunga-bunga yang hanya mau mekar kalau disapa dengan bahasa Inggris yang tepat!",
        goal: "Jawab 5 soal sapaan dan kosakata dasar untuk membuat taman mekar.",
        recap: "Setelah she/he/it kita memakai 'is', dan kata benda tidak beraturan seperti child berubah menjadi children.",
        questions: [
          mc("A: \"How are you?\" B: \"___\"", ["I'm fine, thank you.", "You're welcome.", "Good night.", "See you."], 0, "Untuk menjawab 'How are you?', kita menyebutkan kabar, misalnya 'I'm fine, thank you.'"),
          mc("Choose the correct sentence.", ["She are my friend.", "She is my friend.", "She am my friend.", "She be my friend."], 1, "Subjek 'she' dipasangkan dengan 'is'."),
          tf("'Cheerful' has a similar meaning to 'happy'.", true, "Cheerful (ceria) bersinonim dengan happy (bahagia)."),
          mc("The plural form of 'child' is ...", ["childs", "childen", "children", "childes"], 2, "'Child' adalah kata benda tidak beraturan: child - children."),
          mc("The opposite of 'big' is ...", ["tall", "long", "small", "wide"], 2, "Lawan kata big (besar) adalah small (kecil)."),
        ],
      },
      {
        id: 2,
        title: "Grammar Gorge",
        place: "Grammar Gorge",
        description: "Lompati jurang waktu dengan present dan past tense.",
        topic: "Simple present, simple past, present continuous",
        story: "Jurang Grammar penuh jembatan rapuh. Hanya kalimat bertata bahasa benar yang membuat jembatan kokoh!",
        goal: "Jawab 5 soal grammar untuk menyeberangi jurang.",
        recap: "Simple present: he/she/it + verb-s. Masa lampau memakai verb-2. Kegiatan yang sedang berlangsung memakai is/am/are + verb-ing.",
        questions: [
          mc("He ___ to school every day.", ["go", "goes", "going", "gone"], 1, "Simple present dengan subjek 'he' memakai verb + s/es: goes."),
          mc("Yesterday, we ___ football in the park.", ["play", "plays", "played", "playing"], 2, "'Yesterday' menandakan masa lampau, jadi dipakai past tense: played."),
          tf("The sentence 'They is happy.' is grammatically correct.", false, "Subjek 'they' dipasangkan dengan 'are': 'They are happy.'"),
          mc("What is the past form of the verb 'go'?", ["goed", "gone", "went", "going"], 2, "Go adalah kata kerja tidak beraturan: go - went - gone."),
          mc("My mother ___ a cake now.", ["make", "is making", "made", "makes"], 1, "'Now' menunjukkan kegiatan yang sedang berlangsung: is making."),
        ],
      },
      {
        id: 3,
        title: "Reading Ridge",
        place: "Reading Ridge",
        description: "Daki punggung bukit sambil membaca teks pendek dan ungkapan sehari-hari.",
        topic: "Short reading & daily expressions",
        story: "Di Reading Ridge, papan petunjuk ditulis dalam bahasa Inggris. Baca dengan teliti supaya Zuppy tidak salah jalan!",
        goal: "Jawab 5 soal membaca dan ungkapan untuk mencapai puncak bukit.",
        recap: "Baca teks sampai selesai sebelum menjawab, lalu cari kata kunci pertanyaan di dalam teks.",
        questions: [
          mc(`${MOMO}\n\nWhat color is Momo?`, ["Black", "White", "Brown", "Grey"], 1, "Teks menyebut 'Momo is white', jadi warnanya putih."),
          mc(`${MOMO}\n\nWhat does Momo drink every morning?`, ["Water", "Tea", "Milk", "Juice"], 2, "Kalimat terakhir menyebut 'Momo drinks milk' setiap pagi."),
          tf(`${MOMO}\n\nStatement: Momo is Rina's dog.`, false, "Teks menyebut Momo adalah kucing (cat), bukan anjing."),
          mc("Someone says, \"Thank you very much!\" The best response is ...", ["You're welcome.", "I'm sorry.", "Good night.", "See you."], 0, "Balasan yang sopan untuk 'Thank you' adalah 'You're welcome.'"),
          mc("Choose the correct word: The book is ___ the table.", ["on", "at", "to", "for"], 0, "Benda yang berada di permukaan meja memakai preposisi 'on'."),
        ],
      },
    ],

    /* ================= IPA ================= */
    ipa: [
      {
        id: 1,
        title: "Laboratorium Zat",
        place: "Laboratorium Zat",
        description: "Selidiki wujud zat dan perubahannya di laboratorium ajaib.",
        topic: "Wujud zat & perubahannya",
        story: "Laboratorium Zat berantakan! Tabung-tabung bocor dan wujud zat tertukar. Bantu Zuppy merapikannya dengan ilmu sains!",
        goal: "Jawab 5 soal tentang zat dan perubahan wujud untuk memulihkan laboratorium.",
        recap: "Zat padat berbentuk dan bervolume tetap. Perubahan wujud termasuk perubahan fisika.",
        questions: [
          mc("Perubahan wujud dari cair menjadi gas disebut ...", ["membeku", "menguap", "mencair", "mengembun"], 1, "Cair menjadi gas disebut menguap."),
          mc("Zat yang bentuk dan volumenya tetap adalah zat ...", ["cair", "gas", "padat", "uap"], 2, "Zat padat memiliki bentuk dan volume yang tetap."),
          tf("Air mendidih pada suhu 100°C pada tekanan udara normal.", true, "Titik didih air pada tekanan 1 atm adalah 100°C."),
          mc("Kapur barus di dalam lemari lama-kelamaan mengecil dan hilang karena mengalami ...", ["menyublim", "mengembun", "mencair", "membeku"], 0, "Menyublim adalah perubahan wujud dari padat langsung menjadi gas tanpa melalui wujud cair."),
          tf("Es yang mencair merupakan contoh perubahan kimia.", false, "Es mencair hanya berubah wujud, zat penyusunnya tetap air (perubahan fisika)."),
        ],
      },
      {
        id: 2,
        title: "Rimba Ekosistem",
        place: "Rimba Ekosistem",
        description: "Masuki rimba kehidupan dan pelajari rantai makanan.",
        topic: "Ekosistem & rantai makanan",
        story: "Rimba Ekosistem mulai tidak seimbang. Bantu Zuppy memahami siapa memakan siapa agar hutan kembali harmonis!",
        goal: "Jawab 5 soal ekosistem untuk menyeimbangkan rimba.",
        recap: "Produsen membuat makanan sendiri, konsumen memakan makhluk lain, dan pengurai menguraikan sisa makhluk hidup.",
        questions: [
          mc("Organisme yang membuat makanan sendiri melalui fotosintesis disebut ...", ["konsumen", "produsen", "pengurai", "predator"], 1, "Produsen (tumbuhan hijau) membuat makanan sendiri lewat fotosintesis."),
          mc("Rantai makanan: rumput → belalang → katak → ular. Yang berperan sebagai konsumen tingkat II adalah ...", ["rumput", "belalang", "katak", "ular"], 2, "Belalang konsumen I, katak konsumen II, ular konsumen III."),
          tf("Pengurai (dekomposer) menguraikan sisa makhluk hidup menjadi zat hara bagi tanah.", true, "Jamur dan bakteri pengurai mengembalikan zat hara ke tanah."),
          mc("Gas yang diperlukan tumbuhan untuk fotosintesis adalah ...", ["oksigen", "nitrogen", "karbon dioksida", "hidrogen"], 2, "Tumbuhan menyerap karbon dioksida dan menghasilkan oksigen."),
          mc("Hubungan lebah dan bunga yang saling menguntungkan disebut ...", ["parasitisme", "komensalisme", "predasi", "mutualisme"], 3, "Lebah mendapat nektar dan bunga terbantu penyerbukan: keduanya diuntungkan (mutualisme)."),
        ],
      },
      {
        id: 3,
        title: "Galaksi Energi",
        place: "Galaksi Energi",
        description: "Terbang melintasi galaksi untuk memahami energi, gerak, dan tata surya.",
        topic: "Energi, kecepatan, & tata surya",
        story: "Pesawat Zuppy kehabisan energi di tengah galaksi! Kumpulkan pengetahuan sains agar bisa mendarat di planet tujuan.",
        goal: "Jawab 5 soal energi dan tata surya untuk mengisi ulang pesawat.",
        recap: "Energi tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk. Kecepatan = jarak ÷ waktu.",
        questions: [
          mc("Energi yang dimiliki benda karena geraknya disebut energi ...", ["potensial", "kinetik", "kimia", "panas"], 1, "Energi gerak disebut energi kinetik."),
          mc("Planet yang paling dekat dengan Matahari adalah ...", ["Venus", "Bumi", "Merkurius", "Mars"], 2, "Merkurius adalah planet terdekat dari Matahari."),
          tf("Energi dapat diciptakan dan dimusnahkan.", false, "Menurut hukum kekekalan energi, energi tidak dapat diciptakan maupun dimusnahkan, hanya berubah bentuk."),
          mc("Sebuah mobil menempuh 120 km dalam 2 jam. Kecepatan rata-ratanya adalah ...", ["40 km/jam", "60 km/jam", "122 km/jam", "240 km/jam"], 1, "Kecepatan = jarak ÷ waktu = 120 ÷ 2 = 60 km/jam."),
          tf("Bumi mengelilingi Matahari dalam waktu sekitar 365 hari.", true, "Satu kali revolusi Bumi memerlukan sekitar 365 hari, yaitu satu tahun."),
        ],
      },
    ],

    /* ================= IPS ================= */
    ips: [
      {
        id: 1,
        title: "Peta Nusantara",
        place: "Peta Nusantara",
        description: "Jelajahi letak dan kondisi alam Indonesia di peta raksasa.",
        topic: "Geografi Indonesia",
        story: "Peta Nusantara terbelah jadi kepingan puzzle! Susun kembali dengan pengetahuan geografimu.",
        goal: "Jawab 5 soal geografi Indonesia untuk menyatukan peta.",
        recap: "Indonesia berada di antara dua benua (Asia dan Australia), dua samudra (Hindia dan Pasifik), dan dilalui garis khatulistiwa.",
        questions: [
          mc("Indonesia terletak di antara dua benua, yaitu ...", ["Asia dan Afrika", "Asia dan Australia", "Eropa dan Asia", "Australia dan Amerika"], 1, "Indonesia berada di antara benua Asia dan benua Australia."),
          mc("Indonesia terletak di antara dua samudra, yaitu ...", ["Atlantik dan Pasifik", "Hindia dan Atlantik", "Hindia dan Pasifik", "Arktik dan Pasifik"], 2, "Indonesia diapit Samudra Hindia dan Samudra Pasifik."),
          tf("Indonesia dilalui oleh garis khatulistiwa (ekuator).", true, "Garis khatulistiwa melintasi Indonesia, antara lain di Sumatra dan Kalimantan."),
          mc("Pukul 10.00 WIB, waktu di Jayapura (WIT) adalah pukul ...", ["09.00", "11.00", "12.00", "13.00"], 2, "WIT lebih cepat 2 jam dari WIB, sehingga 10.00 WIB = 12.00 WIT."),
          tf("Indonesia beriklim tropis.", true, "Karena dilalui khatulistiwa, Indonesia beriklim tropis dengan dua musim: hujan dan kemarau."),
        ],
      },
      {
        id: 2,
        title: "Kerajaan Lama",
        place: "Kerajaan Lama",
        description: "Masuki lorong waktu menuju kerajaan-kerajaan besar Nusantara.",
        topic: "Sejarah kerajaan Nusantara",
        story: "Mesin waktu Zuppy membawanya ke masa kerajaan-kerajaan besar. Jawab pertanyaan para raja agar bisa kembali pulang!",
        goal: "Jawab 5 soal sejarah kerajaan untuk kembali ke masa kini.",
        recap: "Kutai adalah kerajaan Hindu tertua, Sriwijaya berjaya di laut, dan Majapahit mencapai puncaknya di bawah Gajah Mada.",
        questions: [
          mc("Kerajaan Hindu tertua di Indonesia adalah ...", ["Majapahit", "Sriwijaya", "Kutai", "Mataram"], 2, "Kerajaan Kutai di Kalimantan Timur adalah kerajaan Hindu tertua di Indonesia."),
          mc("Sumpah Palapa diucapkan oleh ...", ["Hayam Wuruk", "Gajah Mada", "Airlangga", "Raden Wijaya"], 1, "Gajah Mada bersumpah menyatukan Nusantara pada masa Majapahit."),
          tf("Candi Borobudur dibangun pada masa Dinasti Syailendra.", true, "Borobudur dibangun oleh Dinasti Syailendra pada masa Mataram Kuno."),
          mc("Kerajaan Islam pertama di Indonesia adalah ...", ["Demak", "Samudra Pasai", "Banten", "Mataram Islam"], 1, "Samudra Pasai di Aceh adalah kerajaan Islam pertama di Indonesia."),
          tf("Kerajaan Sriwijaya terkenal sebagai kerajaan maritim.", true, "Sriwijaya menguasai jalur perdagangan laut di sekitar Selat Malaka."),
        ],
      },
      {
        id: 3,
        title: "Pasar Ekonomi",
        place: "Pasar Ekonomi",
        description: "Belajar ekonomi dan interaksi sosial di pasar yang ramai.",
        topic: "Kegiatan ekonomi & interaksi sosial",
        story: "Pasar Ekonomi tiba-tiba sepi! Para pedagang hanya mau melayani petualang yang paham cara kerja ekonomi.",
        goal: "Jawab 5 soal ekonomi dan sosial untuk menghidupkan kembali pasar.",
        recap: "Kebutuhan primer adalah kebutuhan pokok, harga naik membuat permintaan cenderung turun, dan uang berfungsi sebagai alat tukar.",
        questions: [
          mc("Kebutuhan pokok yang harus dipenuhi untuk bertahan hidup, seperti makan, disebut kebutuhan ...", ["primer", "sekunder", "tersier", "mewah"], 0, "Kebutuhan primer adalah kebutuhan pokok, misalnya pangan, sandang, dan papan."),
          mc("Jika harga suatu barang naik dan faktor lain tetap, jumlah barang yang diminta cenderung ...", ["naik", "menurun", "tetap", "hilang"], 1, "Menurut hukum permintaan, harga naik membuat jumlah barang yang diminta menurun."),
          tf("Interaksi sosial terjadi ketika dua orang atau lebih saling memengaruhi.", true, "Interaksi sosial adalah hubungan timbal balik antarindividu atau kelompok."),
          mc("Orang yang menggunakan barang atau jasa untuk memenuhi kebutuhannya disebut ...", ["produsen", "distributor", "konsumen", "investor"], 2, "Konsumen adalah pihak yang menggunakan barang atau jasa."),
          tf("Salah satu fungsi uang adalah sebagai alat tukar.", true, "Uang memudahkan transaksi sebagai alat tukar, serta sebagai satuan hitung dan penyimpan nilai."),
        ],
      },
    ],

    /* ================= PENDIDIKAN PANCASILA ================= */
    pancasila: [
      {
        id: 1,
        title: "Gerbang Pancasila",
        place: "Gerbang Pancasila",
        description: "Kenali lima sila dan nilai-nilainya di gerbang megah Garuda.",
        topic: "Sila-sila Pancasila, lambang & pengamalan",
        story: "Garuda penjaga gerbang hanya membukakan pintu bagi petualang yang mengenal dasar negaranya dengan baik!",
        goal: "Jawab 5 soal tentang Pancasila untuk membuka gerbang Garuda.",
        recap: "Sila 1 bintang, sila 2 rantai, sila 3 pohon beringin, sila 4 kepala banteng, sila 5 padi dan kapas. Pancasila disahkan PPKI pada 18 Agustus 1945.",
        questions: [
          mc("Sila yang lambangnya pohon beringin adalah sila ...", ["pertama", "kedua", "ketiga", "keempat"], 2, "Pohon beringin melambangkan sila ketiga, Persatuan Indonesia."),
          mc("Pancasila disahkan sebagai dasar negara oleh PPKI pada tanggal ...", ["1 Juni 1945", "17 Agustus 1945", "18 Agustus 1945", "22 Juni 1945"], 2, "PPKI mengesahkan Pancasila sebagai dasar negara pada 18 Agustus 1945. Tanggal 1 Juni diperingati sebagai hari lahir Pancasila."),
          tf("Membantu korban bencana tanpa membedakan suku dan agama mencerminkan nilai sila kedua.", true, "Sila kedua, Kemanusiaan yang adil dan beradab, mengajarkan menghargai sesama manusia tanpa membeda-bedakan."),
          mc("Sikap berikut yang sesuai dengan sila ketiga adalah ...", ["bekerja sama dengan teman dari berbagai daerah", "mengutamakan kelompok sendiri", "menolak berteman dengan siswa baru", "memaksakan bahasa daerah sendiri"], 0, "Sila ketiga mengajarkan persatuan, salah satunya dengan bekerja sama tanpa memandang asal daerah."),
          tf("Rumusan resmi Pancasila terdapat dalam Pembukaan UUD 1945 alinea keempat.", true, "Rumusan lima sila Pancasila tercantum dalam Pembukaan UUD 1945 alinea keempat."),
        ],
      },
      {
        id: 2,
        title: "Taman Kebinekaan",
        place: "Taman Kebinekaan",
        description: "Berjalan di taman penuh warna perbedaan dan belajar saling menghargai.",
        topic: "Bhinneka Tunggal Ika & toleransi",
        story: "Taman Kebinekaan penuh bunga berbagai warna. Semuanya mekar indah bila saling menghargai. Bantu Zuppy menjaga keharmonisannya!",
        goal: "Jawab 5 soal tentang kebinekaan dan toleransi untuk menjaga taman.",
        recap: "Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu, dan toleransi berarti menghargai perbedaan.",
        questions: [
          mc("Semboyan 'Bhinneka Tunggal Ika' berarti ...", ["Bersatu kita teguh", "Berbeda-beda tetapi tetap satu", "Maju terus pantang mundur", "Satu nusa satu bangsa"], 1, "Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu."),
          mc("Contoh sikap toleransi di sekolah adalah ...", ["mengejek teman yang berbeda agama", "menghormati teman yang sedang beribadah", "memilih teman hanya dari satu suku", "memaksakan pendapat pada teman"], 1, "Toleransi berarti menghargai perbedaan, misalnya menghormati teman yang sedang beribadah."),
          tf("Gotong royong mencerminkan nilai persatuan.", true, "Bekerja bersama untuk kepentingan umum menunjukkan semangat persatuan."),
          mc("Contoh sikap yang sesuai dengan sila keempat adalah ...", ["memaksakan pendapat pribadi", "bermusyawarah untuk mufakat", "memutuskan sendiri tanpa mendengar teman", "menolak hasil keputusan bersama"], 1, "Sila keempat mengajarkan musyawarah untuk mencapai mufakat."),
          mc("Semboyan Bhinneka Tunggal Ika berasal dari kitab ...", ["Negarakertagama", "Sutasoma", "Pararaton", "Arjunawiwaha"], 1, "Bhinneka Tunggal Ika diambil dari Kitab Sutasoma karya Mpu Tantular."),
        ],
      },
      {
        id: 3,
        title: "Istana Konstitusi",
        place: "Istana Konstitusi",
        description: "Masuki istana hukum dan pelajari hak, kewajiban, serta aturan negara.",
        topic: "UUD 1945, hak & kewajiban, norma",
        story: "Penjaga Istana Konstitusi akan memberikan kunci jika Zuppy memahami aturan dasar negara serta hak dan kewajiban warganya.",
        goal: "Jawab 5 soal tentang konstitusi dan norma untuk mendapatkan kunci istana.",
        recap: "UUD 1945 adalah hukum dasar tertulis tertinggi, hak dan kewajiban harus seimbang, dan norma hukum bersanksi tegas dari negara.",
        questions: [
          mc("Hukum dasar tertulis tertinggi di Indonesia adalah ...", ["Peraturan Daerah", "Undang-Undang Dasar 1945", "Peraturan Pemerintah", "Keputusan Presiden"], 1, "UUD 1945 adalah hukum dasar tertulis tertinggi di Indonesia."),
          mc("Sesuatu yang harus kita lakukan sebagai warga negara disebut ...", ["hak", "kewajiban", "kebebasan", "wewenang"], 1, "Kewajiban adalah sesuatu yang harus dilaksanakan, sedangkan hak adalah sesuatu yang boleh kita terima."),
          tf("Hak dan kewajiban harus dijalankan secara seimbang.", true, "Menuntut hak tanpa menjalankan kewajiban akan merugikan orang lain."),
          mc("Contoh kewajiban siswa di sekolah adalah ...", ["menaati tata tertib sekolah", "memilih pelajaran sesuka hati", "datang terlambat jika mau", "mengabaikan tugas dari guru"], 0, "Menaati tata tertib adalah kewajiban setiap siswa."),
          mc("Norma yang bersanksi tegas dari negara dan berasal dari aturan tertulis adalah norma ...", ["kesopanan", "kesusilaan", "hukum", "kebiasaan"], 2, "Norma hukum bersifat tertulis dan sanksinya tegas karena ditegakkan negara."),
        ],
      },
    ],
  };

  window.ZuppyData.levels = levels;

  // Pengaturan permainan
  window.ZuppyData.game = {
    xpPerCorrect: 10,
    xpPerStar: 10,
    scorePerCorrect: 100,
    maxStars: 3,
  };

  // Daftar materi turunan: satu level = satu materi (dipakai dashboard untuk hitung progres)
  window.ZuppyData.materials = Object.keys(levels).flatMap((subjectId) =>
    levels[subjectId].map((level) => ({
      id: `level-${level.id}`,
      subjectId,
      title: level.title,
    }))
  );
})();