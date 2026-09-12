# Changelog
All notable changes to the "Ular Tangga 3D Nusantara" project are documented in this file.

## [2.2.0] - 2026-09-12 (Production Ready - Mabar & Fitur Sosial 🌐)
### Added
- **Multiplayer Online Real-Time (Supabase)**: Migrasi dari SSE ke arsitektur Supabase Channels. Mendukung pembuatan *room*, *join room* dengan kode 6 karakter, sinkronisasi dadu, pergerakan, dan notifikasi pemain.
- **Voice Synthesizer (TTS) Multi-Dialek**: Menggunakan Web Speech API untuk membacakan balon obrolan dengan nada (pitch) dan kecepatan (rate) unik untuk tiap dialek nusantara (Jawa, Sunda, Minang, Betawi, dll).
- **Mode Malam Sakral Berpendar (Neon Mode)**: Skema pencahayaan khusus di mana langit menjadi gelap dan bidak pion, ular, serta tangga memancarkan cahaya neon yang indah (Emissive Glow).
- **Mini-Game Catur Jawa**: Jika pemain mendarat di petak 45, mereka ditantang bermain mini-game Catur Jawa melawan AI Bot lewat antarmuka modal. Menang maju +3, Kalah mundur -3 petak.
- **Vercel Deployment Ready**: Arsitektur front-end disederhanakan dan dibersihkan sehingga 100% siap di-deploy secara instan via Vercel.

## [2.1.0] - 2026-09-12 (Turnamen Piala Raja Nusantara 🏆)
### Added
- **Mode Turnamen Mini Knockout Bracket (Piala Raja Nusantara 🏆)**:
  - Sistem gugur 4 Pendekar Nusantara (Babak Semifinal ➔ Grand Final) memperebutkan Mahkota Emas dan Trofi Piala Raja:
    - **Semifinal A (Laga Utama)**: Pemain bertanding melawan Tuanku Imam 🐅 (Jawara Ranah Minang).
    - **Semifinal B**: Pertarungan legendaris antara Gajah Mada ⚔️ (Patih Majapahit) vs I Gusti Ngurah 🌺 (Ksatria Bali).
    - **Grand Final**: Pemenang Semifinal A menantang Jawara Semifinal B di arena megah Candi Kerajaan dengan alunan Gamelan Pelog dan taburan daun rimba.
  - **Bagan Interaktif Turnamen Knockout (`#modal-tournament-bracket`)**:
    - Visualisasi bagan pohon eliminasi dengan status badge dinamis (`BERTANDING`, `MENANG`, `GUGUR`, `JUARA 1`, `RUNNER-UP`).
    - Animasi penanda laga aktif dengan kilau emas neon (`pulseTag`).
    - Komentator status pertandingan interaktif dan tombol aksi transisi babak ("Lanjut ke Grand Final ⚔️", "Tantang Lagi 🔄").
- **Audio Synthesizer Web Audio API Kerajaan**:
  - `playRoyalFanfare()`: Rangkaian akor nada brass megah (*regal fanfare chime*) saat pembukaan babak final dan penobatan sang juara.
  - `playGongStrike()`: Resonansi dentang gong perunggu dalam berfrekuensi rendah 130 Hz dengan peluruhan eksponensial alami khas nusantara.
- **Lencana Prestasi ke-8**:
  - Lencana baru di Papan Statistik & Rekor: **🏆 Juara Piala Raja** ("Menangkan Turnamen Knockout Piala Raja Nusantara").
### Fixed
- **Multiplayer Server JSON Serialization**:
  - Memperbaiki penanganan objek response klien HTTP SSE pada `server.js` (`getRoomData`) agar bebas dari *circular structure error*.

## [2.0.0] - 2026-09-12 (Grand Milestone Release 🗺️🌺👑)
### Added
- **Motif Batik Tradisional Nusantara 3D Prosedural pada Pion**:
  - Generator tekstur kain adat Indonesia 100% prosedural via HTML5 Canvas 2D (zero external image assets):
    - 🌊 **Mega Mendung (Cirebon)**: Lapisan lengkung awan bertingkat biru, toska, dan putih.
    - 🌺 **Batik Kawung (Yogyakarta)**: 4 kelopak elips geometris pusaka dengan aksen titik emas konsentris.
    - 🧵 **Songket Emas (Palembang)**: Rajutan pola intan (*diamond lattice brocade*) bersulam emas di atas latar kirmizi/zamrud.
    - 🪢 **Tenun Ikat (Toraja & Sumba)**: Garis zig-zag etnik chevron ikat khas tenun nusantara.
    - ✨ **Polos Glossy**: Kilau enamel mengkilap bersih dengan pantulan cahaya dinamis.
  - Tombol pemilih motif batik pion (`.btn-motif-cycle`) interaktif pada formulir nama pemain.
- **Mode Ekspedisi Pulau Nusantara (Archipelago Quest Stages)**:
  - Mode petualangan pulau legendaris Indonesia dengan 5 tahap ekspedisi unik:
    1. 🏛️ **Tahap 1: Tanah Jawa (Majapahit & Candi Borobudur)**: Suasana cerah, gaya papan Candi Borobudur relief batu andesit purba.
    2. 🌺 **Tahap 2: Pulau Dewata (Tirta Suci Bali)**: Suasana rintik hujan berkah, gapura sakral, dan musik Gamelan Pelog.
    3. 🌋 **Tahap 3: Ranah Minang & Toba (Sumatera)**: Bukit Barisan, cuaca daun rimba melayang, dan instrumen Angklung Sunda.
    4. 🌴 **Tahap 4: Hutan Rimba Kahayan (Kalimantan)**: Hujan tropis rimba Dayak dengan tangga bambu liana alami.
    5. ❄️ **Tahap 5: Puncak Salju Jayawijaya (Papua)**: Badai halilintar khatulistiwa dan boss ular mistis petak 100.
  - Lencana Prestasi baru di modal statistik `🏆`: **🗺️ Penakluk Nusantara** (terbuka otomatis saat memenangkan tahap ekspedisi).
- **Service Worker PWA Upgrade (Network-First)**:
  - Pembaharuan `sw.js` ke strategi *Network-First with Offline Cache Fallback* v2.0.0 untuk memastikan pembaruan kode selalu instan di semua perangkat tanpa masalah cache basi.
- **Desain Dialog Modal Responsif**:
  - Penambahan `max-height: 88vh` dan `overflow-y: auto` pada dialog modal setup agar selalu dapat di-scroll nyaman di layar laptop, HP, dan tablet.

## [1.9.0] - 2026-09-12
### Added
- **Efek Cuaca Dinamis 3D (Dynamic Weather Particles & Atmosphere)**:
  - 4 Mode Cuaca Prosedural yang dapat diganti kapan saja melalui tombol navigasi `🌧️` di header:
    - ☀️ **Cerah (Clear)**: Langit jernih dengan pencahayaan hangat matahari khatulistiwa dan kunang-kunang malam.
    - 🌧️ **Hujan Tropis (Rain)**: 450 partikel tetesan air hujan 3D dengan kabut basah dinamis dan rintik air mengalir.
    - ⛈️ **Badai Petir (Storm)**: Kilatan halilintar procedural berkala yang menerangi seluruh papan permainan disertai dentuman guntur (`playThunder()`) dari Web Audio API synthesizer.
    - 🍃 **Guguran Daun Rimba (Breeze & Leaves)**: 60 partikel daun tropis melayang dan bergoyang tertiup angin lembut melintasi petak-petak papan.
- **Mode Mabar Online Real-Time (Room Code Multiplayer)**:
  - Dukungan bermain bersama teman antar-browser/perangkat (HP, laptop, tablet) dalam satu jaringan lokal atau internet:
    - ➕ **Buat Ruangan**: Dapatkan kode ruangan unik (seperti `NUSA869`, `BALI102`, dll.) langsung dengan satu klik.
    - 🔗 **Salin Tautan Undangan**: Tautan langsung sekali klik untuk bergabung ke room yang sama.
    - 🚪 **Gabung Ruangan**: Masukkan kode room 6-7 karakter dan langsung terhubung secara instan.
    - ⚡ **Sinkronisasi Real-Time SSE (Server-Sent Events)**: Kocokan dadu 3D, pergerakan pion, animasi panjat tangga, gigitan ular, reaksi emote 3D, kuis budaya, hingga kondisi menang tersinkronisasi 100% mulus tanpa library pihak ketiga.
- **Server API Endpoint**:
  - `/api/room/create`: Membuat room mabar baru secara in-memory.
  - `/api/room/join`: Masuk ke room mabar (kapasitas 2-4 pemain).
  - `/api/room/action`: Siaran aksi giliran dadu & gerak langkah ke seluruh pemain di room.
  - `/api/room/events`: Koneksi streaming SSE real-time dua arah.

## [1.8.0] - 2026-09-12
### Added
- **Kustomisasi Avatar Karakter Tradisional Nusantara (Headgear Customizer)**:
  - 6 Pilihan Penutup Kepala Adat Nusantara 100% Prosedural Three.js:
    - 👑 **Mahkota Emas Sultan**: Mahkota bertingkat emas berkilau dengan 5 menara runcing dan permata rubi merah.
    - 🌾 **Caping Bambu Petani**: Kerucut bambu bertekstur anyaman dengan simpul puncak kayu jati dan lis bawah.
    - 🪓 **Udeng Jawara Silat**: Pita kain merah melingkar dengan dua simpul sayap lipatan khas pendekar.
    - 🎖️ **Peci Songkok Hitam**: Peci beludru hitam pekat berbentuk silinder lonjong dengan lis emas khas nasional.
    - 🛡️ **Helm Ksatria Majapahit**: Helm pelindung perunggu kuno dengan jambul dorsal dan pelindung pipi.
    - 🌿 **Mahkota Bulu Kasuari & Papua**: Mahkota serat alam dihiasi 3 helai bulu tegak tropis berwarna zamrud, emas, dan kirmizi.
  - Tombol pemilih aksesori langsung di formulir Nama Pemain pada dialog setup awal game, dapat diklik untuk berganti avatar secara interaktif.
  - Ikon dan nama penutup kepala ditampilkan dinamis pada Leaderboard HUD samping.
- **Soundpack Synthesizer Selector (Gamelan Pelog vs Angklung Sunda vs Retro 8-Bit)**:
  - Tombol `🎶 / 🎋 / 🕹️` pada header atas untuk beralih instrumen musik prosedural Web Audio API secara instan:
    - 🎶 **Gamelan Pelog**: Nada pentatonis slendro/pelog klasik dengan gong bass berdengung dalam.
    - 🎋 **Angklung Sunda**: Alunan harmonik bambu ganda lembut dengan tempo ritmis pedesaan Sunda.
    - 🕹️ **Retro 8-Bit Chiptune**: Nada square wave cepat bernuansa nostalgia game era 90-an.
- **Sistem Lencana Prestasi Nusantara (Achievement Badges)**:
  - Bagian baru pada modal Statistik `🏆` yang menampilkan 6 lencana pencapaian dengan status terbuka/terkunci:
    - 👑 **Sultan Petak 100**: Menangkan minimal 1 pertandingan.
    - 🛡️ **Kebal Bisa Ular**: Tangkis gigitan ular menggunakan Tameng Bambu Sakti.
    - 🧠 **Cendekiawan Budaya**: Jawab 3 kuis budaya nusantara dengan benar.
    - 🪜 **Pendaki Ulung**: Panjat total 5 tangga bambu secara akumulatif.
    - 🎲 **Hoki Dadu Dewa**: Gulir dadu angka 6 sebanyak 3 kali.
    - 🎮 **Penjelajah Sejati**: Mainkan minimal 5 game penuh.

## [1.7.0] - 2026-09-12
### Added
- **3 Gaya Papan 3D Multi-Tema (Board Themes)**:
  - 📜 **Klasik 90-an**: Papan nostalgia cetak kertas karton tempo dulu dengan pedestal kayu mahoni gelap dan aksen emas klasik.
  - 🏛️ **Candi Borobudur**: Papan relief batu andesit purbakala kelabu tua bertekstur pahatan relief, angka batu putih, dan bingkai emas candi sakral.
  - 🌴 **Rimba Tropis**: Papan kayu hutan hujan tropis bernuansa hijau zamrud, rimbun dedaunan, dan trim tanaman tropis eksotis.
- **Tombol Pengubah Gaya Papan di Header**: Tombol `📜 / 🏛️ / 🌴` pada bar navigasi atas untuk beralih gaya papan 3D secara dinamis real-time kapan pun saat bermain.
- **Pemilih Gaya Papan di Modal Setup**: Pemain dapat memilih gaya papan favorit langsung dari dialog awal sebelum permainan dimulai.

## [1.6.0] - 2026-09-12
### Added
- **Kartu Budaya Nusantara & Kuis Wawasan Daerah**: Petak khusus nomor 12, 38, 65, dan 83 berornamen emas bintang (`⭐ BUDAYA`) yang memicu dialog interaktif Kuis Budaya Nusantara. Menjawab benar memberikan bonus maju 2 langkah ekstra!
- **Power-Up Tameng Bambu Sakti**:
  - Efek cincin pelindung energi 3D hijau zamrud yang berputar mengitari tubuh pion.
  - Melindungi pemain dari 1 gigitan ular berbisa (ular tidak dapat menurunkan pion ke ekor saat tameng aktif).
  - Efek suara benturan tameng *gong resonance* Web Audio API.
- **Papan Statistik & Rekor Pemain (Leaderboard)**:
  - Tombol `🏆` pada navigasi bar atas membuka modal statistik komprehensif.
  - Melacak: Total Pertandingan, Kemenangan P1, Kemenangan Bot AI, Rekor Tercepat (Langkah Tersedikit), Total Tangga Dinaiki, Total Terkena Ular, Tameng Digunakan, dan Jumlah Trivia Benar.
  - Data tersimpan permanen di browser (`localStorage`) dengan opsi Reset Data.
- **Efek Suara Baru**:
  - `playShieldBlock()`: Efek dentuman tameng mistis.
  - `playTriviaCorrect()`: Fanfare melodi akor kemenangan kuis.
  - `playTriviaWrong()`: Nada peringatan santai saat jawaban kurang tepat.

## [1.5.0] - 2026-09-12
### Added
- **Sistem Emote 3D & Balon Reaksi Prosedural**: Balon obrolan ekspresif 3D yang melayang di atas kepala pion dengan animasi pegas elastis, floating drift, dan fade-out otomatis.
- **Quick Emote Reaction Bar di HUD**: 6 tombol reaksi interaktif langsung (`🔥 Gas Terus!`, `🎉 Mantap Jiwa!`, `😱 Waduh Bahaya!`, `😂 Wkwkwk!`, `🙏 Salam Santun`, `🎲 Hoki Dadu!`) yang memicu balon bicara 3D dan tercatat pada riwayat obrolan langkah.
- **Automatic Gameplay Reactions**:
  - Panjat Tangga: Reaksi kegembiraan *"Asik Naik! 🚀"*.
  - Gigitan Ular: Reaksi terkejut *"Aduh Ular! 😱"*.
  - Dadu 6: Reaksi bersemangat *"Hoki 6! 🔥"*.
  - Pantul Lebih dari 100: Reaksi kaget *"Yah Balik! 🔄"*.
  - Petak Berkah: *"Berkah! 🎁"*.
  - Petak Zonk: *"Kena Zonk! 🌀"*.
  - Dadu Ganda: *"Gas Lagi! ⚡"*.
  - Juara 1: Selebrasi *"Jawara 1! 👑"*.
- **Smart AI Bot Banter**: Bot AI secara spontan (~40% peluang) menampilkan balon obrolan sebelum melempar dadu (*"Giliranku nih! 😎"*, *"Bismillah dadu 6 🤲"*, *"Target: Petak 100! 🎯"*).
- **Web Audio Emote Chime**: Nada pop dual-tone sintetis Web Audio API saat balon reaksi muncul.
- **Audio Bugfix**: Menambahkan method `playTone` pada `AudioSynthesizer` untuk mencegah unhandled exceptions pada efek suara tangga, pantulan, dan fanfare.

## [1.4.0] - 2026-09-12
### Added
- **PWA (Progressive Web App) & Offline-Ready**: Game kini dapat di-*install* langsung ke layar utama Android, iOS, Windows, dan MacOS dengan dukungan ikon aplikasi dan Service Worker caching untuk bermain tanpa koneksi internet.
- **4 Sudut Pandang Kamera Presets**: Tombol kamera kini dapat beralih secara dinamis antara:
  - 🎥 **Sinematik Auto-Track**: Kamera dinamis mengikuti bidak aktif.
  - 📐 **Top-Down 2D/3D**: Sudut pandang klasik tegak lurus dari atas seperti papan asli.
  - 👁️ **Action Cam**: Sudut pandang dekat dramatis di belakang pion.
  - 🌐 **Kamera Bebas 360°**: Rotasi dan zoom manual bebas.

## [1.3.0] - 2026-09-12
### Added
- **3D Environment Theme Switcher**: Tombol pengubah suasana 3D dinamis antara **Malam Berbintang 🌙**, **Siang Tropis Cerah ☀️**, dan **Senja Keemasan 🌅** dengan pencahayaan dan warna kabut atmosferik yang berubah secara real-time.
- **Interactive Tile Raycast Inspection**: Pemain dapat mengklik petak manapun pada papan 3D untuk melihat info status petak (posisi tangga, ular, petak berkah/zonk, atau petak aman) disertai audio chime.
- **Live Move History Log**: Panel riwayat langkah pada sidebar HUD yang mencatat riwayat lemparan dadu, panjat tangga, gigitan ular, dan perolehan petak kejutan secara langsung.

## [1.2.0] - 2026-09-12
### Added
- **Interactive 3D Raycaster Dice**: Pemain dapat mengklik langsung dadu 3D di atas papan untuk melempar dadu (dengan indikator hover kursor pointer).
- **Aksesori 3D Unik Tiap Bidak**:
  - Pemain 1: Mahkota Emas Jawara 3D
  - Pemain 2 / Bot: Caping Bambu Petani Nusantara 3D
  - Pemain 3: Topi Baret Petualang 3D
  - Pemain 4: Pita Ikat Kepala Jawara Merah 3D
- **Pengatur Kecepatan Permainan (Speed Toggle)**: Tombol `⚡1x / ⚡2x` pada navbar untuk mempercepat tempo animasi lompatan bidak.
- **Three.js Core Module Bundling**: Menyediakan `three.core.js` lengkap di folder lokal `lib/` sehingga seluruh modul Three.js r170+ berjalan 100% tanpa error 404.

## [1.1.0] - 2026-09-12
### Added
- **Procedural Background Music (Gamelan & Marimba Pentatonic Loop)**: Web Audio API synthesized ambient nostalgic BGM playing in harmony with game events.
- **Interactive Active Player Halo Ring**: 3D pulsing neon halo ring that glides smoothly under the active player's tile.
- **Petak Kejutan Nusantara (Mystery Tiles)**:
  - Kotak 19: 🎁 *Kotak Berkah* (+3 langkah maju ekstra).
  - Kotak 53: ⚡ *Dadu Ganda* (kesempatan lempar dadu sekali lagi).
  - Kotak 76: 🌀 *Kotak Zonk* (tergelincir mundur 3 langkah).
- **Ambient Magical Dust & Sparks**: 90 floating fireflies/stars drifting softly in 3D space around the board.

## [1.0.0] - 2026-09-12
### Added
- **100% Procedural 3D Board Generation**: 100 tiles zigzag boustrophedon board layout rendered with dynamic canvas textures, numbers, and retro Indonesian color themes.
- **Procedural 3D Snakes**: Tube geometry with Catmull-Rom 3D splines, scale textures, fangs, and eyes.
- **Procedural 3D Bamboo Ladders**: Double rail cylinders with multi-level bamboo rungs.
- **Procedural 3D Rolling Dice**: High-gloss cherry dice with physical tumbling animation and exact pip alignment.
- **Procedural 3D Pawns**: Multi-tiered glossy pawn pieces in 4 distinct colors with multi-player tile offset algorithm.
- **Game Logic State Machine**: Turn-based mechanics supporting 1 Player vs Smart Bot AI or 2-4 Local Players (Pass-and-Play).
- **Classic Bounce-Back Rule**: Rebounds backwards if roll exceeds tile 100.
- **Web Audio API Synthesizer**: Procedural sound effects for dice tumbling, hopping footsteps, ladder climbing, snake sliding, bounce back, and victory fanfare.
- **3D Confetti Particle Celebration**: 180 3D particle planes erupting on victory.
- **Glassmorphic UI Overlay**: Responsive header, turn indicator, scoreboard, setup dialog, rules modal, and celebration modal.
- **Local Dev Server**: Zero-dependency Node.js HTTP server.
