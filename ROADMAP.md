# Roadmap Pengembangan: Ular Tangga 3D Nusantara

## Fase 1: Brainstorming & Penyelarasan Konsep
- [x] Inisialisasi PRD, ERD, dan Dokumen Arsitektur
- [x] Penyelarasan preferensi tema, visual, dan mekanik gameplay dengan pengguna
- [x] Penguncian Pemahaman (Understanding Lock) & Dokumen Desain (DESIGN.md)

## Fase 2: Pondasi WebGL 3D & Procedural Model Generation
- [x] Setup Three.js scene, pencahayaan studio 3D, ambient light, dan dynamic shadow
- [x] Procedural Board Mesh (Papan 100 kotak zigzag bertekstur angka & ornamen klasik)
- [x] Procedural Snakes Generator (CatmullRomCurve3 tubing dengan kepala ular 3D, mata, dan lidah)
- [x] Procedural Ladders Generator (Tangga kayu/bambu 3D dengan tiang ganda dan anak tangga)
- [x] Procedural Pawns & 3D Physics Dice (Bidak piala warna-warni & kubus dadu dengan pips bintik angka)

## Fase 3: Logika Permainan & Animasi Sinematik
- [x] State Machine giliran pemain (Player vs Bot AI, Pass & Play 2-4 pemain)
- [x] Simulasi lemparan dadu 3D dengan rotasi fisik realistis
- [x] Animasi hopping pion per kotak
- [x] Animasi panjat tangga & animasi meluncur ular
- [x] Kontrol kamera dinamis (Orbit view bebas + Auto-tracking camera + Top-Down + Action Cam)

## Fase 4: UI/UX Modern & Audio Synthesis
- [x] Glassmorphic HUD overlay (Info giliran, papan skor, tombol kocok dadu)
- [x] Web Audio API sound generator (suara kocokan dadu, langkah pion, jingle menang, suara desisan ular)
- [x] Panel dialog pemenang & efek partikel kembang api 3D konfeti
- [x] PWA (Progressive Web App) dengan offline service worker & manifest

## Fase 5: Sistem Emote 3D & Reaksi Interaktif (v1.5.0)
- [x] Procedural 3D speech bubble billboards melayang di atas kepala pion
- [x] Quick Emote Bar di HUD (🔥, 🎉, 😱, 😂, 🙏, 🎲)
- [x] Reaksi otomatis saat panjat tangga, gigitan ular, dadu 6, dan pantulan 100
- [x] Smart AI Bot spontaneous banter
- [x] Web Audio pop chime untuk kemunculan balon reaksi

## Fase 6: Kartu Budaya Nusantara & Papan Rekor (v1.6.0)
- [x] Petak Kartu Budaya (Petak 12, 38, 65, 83) bertekstur bintang emas
- [x] Dialog interaktif Kuis Trivia Budaya Nusantara dengan hadiah langkah ekstra
- [x] Power-up Tameng Bambu Sakti dengan cincin energi 3D kebal gigitan ular
- [x] Papan Statistik & Rekor Pemain tersimpan permanen di LocalStorage
- [x] Sound effects baru (shield block, trivia correct, trivia wrong)

## Fase 7: Gaya Papan 3D & Kustomisasi (v1.7.0)
- [x] Pilihan Tema Tekstur Papan 3D (Candi Borobudur, Rimba Nusantara, Klasik 90-an)
- [x] Tombol pengubah tema papan di Header navigasi dan Modal Setup

## Fase 8: Avatar Nusantara & Soundpack Symphony (v1.8.0)
- [x] Custom Avatar Karakter Tradisional (6 Headgear Adat Nusantara 100% Prosedural 3D)
- [x] Pemilih Avatar Headgear interaktif pada formulir Setup Pemain
- [x] Soundpack Synthesizer Selector (Gamelan Pelog 🎶, Angklung Sunda 🎋, Retro 8-Bit 🕹️)
- [x] Sistem Lencana Prestasi Nusantara (6 Achievement Badges di Modal Statistik)

## Fase 9: Cuaca Dinamis 3D & Mabar Online Room Mode (v1.9.0)
- [x] Sistem Cuaca Dinamis 3D (Cerah ☀️, Hujan Tropis 🌧️, Badai Petir ⛈️, Daun Rimba 🍃)
- [x] Efek visual kilatan petir prosedural & dentuman guntur Web Audio API (`playThunder()`)
- [x] 450 partikel tetesan hujan 3D & 60 partikel daun tropis melayang bebas
- [x] Mode Mabar Online Room (Buat Ruangan & Gabung via Room Code 6 karakter)
- [x] Sinkronisasi aksi giliran dadu, pion, emote 3D, kuis budaya real-time via Server-Sent Events (SSE)
- [x] Tombol pengubah cuaca langsung di bar navigasi header (`🌧️`)

## Fase 10: Motif Batik Pion 3D & Ekspedisi Pulau Nusantara (v2.0.0 Grand Milestone)
- [x] Generator tekstur motif batik 100% prosedural (Mega Mendung 🌊, Kawung 🌺, Songket 🧵, Tenun Ikat 🪢, Polos ✨)
- [x] Pemilih motif kain batik interaktif di formulir setup pemain
- [x] Mode Ekspedisi Pulau Nusantara (5 Pulau: Jawa 🏛️, Bali 🌺, Sumatera 🌋, Kalimantan 🌴, Papua ❄️)
- [x] Lencana Prestasi ke-7 "🗺️ Penakluk Nusantara"
- [x] Desain dialog modal responsif dengan scrolling lancar di semua perangkat
- [x] Service worker PWA Network-First untuk pembaruan instan

## Fase 11: Turnamen Mini Knockout Bracket (v2.1.0)
- [x] Turnamen Mini Knockout Bracket (Piala Raja Nusantara 🏆)
- [x] Sistem eliminasi 4 Pendekar Nusantara (Semifinal A, Semifinal B, Grand Final)
- [x] Bagan interaktif Knockout Bracket Modal (`#modal-tournament-bracket`)
- [x] Lencana Prestasi ke-8 "🏆 Juara Piala Raja" di Papan Statistik
- [x] Audio Web Audio API Fanfar Raja (`playRoyalFanfare`) dan Dentang Gong Tradisional (`playGongStrike`)
- [x] Perbaikan circular JSON serialization pada multiplayer room server

## Fase 12: Rencana Fitur Masa Depan (v2.2.0+)
- [x] Voice Synthesizer / Sound Banter Pemain Multi-Dialek
- [x] Mode Malam Sakral Berpendar (Glow-in-the-dark Neon Nusantara)
- [x] Mini-Games Tantangan Catur Jawa di Petak Khusus
