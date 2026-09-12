# Product Requirements Document (PRD)
**Project**: Ular Tangga 3D Nusantara (Procedural 3D Snakes & Ladders)
**Version**: 1.0.0-draft
**Status**: In Ideation / Brainstorming
**Created**: 2026-09-12
**Last Updated**: 2026-09-12

---

## 1. Executive Summary
Ular Tangga 3D Nusantara adalah game papan 3D interaktif berbasis web yang menghidupkan kembali nostalgia permainan papan legendaris "Ular Tangga" klasik Indonesia yang pernah sangat tren. Seluruh aset 3D (papan 100 kotak retro warna-warni, ular 3D prosedural Catmull-Rom dengan tekstur sisik dinamis, tangga bambu 3D, dadu 3D berpips timbul, dan pion bidak 3D) dibuat secara otomatis 100% prosedural via Three.js tanpa bergantung pada file model 3D eksternal, sehingga game dapat dimainkan secara instan, ringan, dan siap pakai. Mode permainan mendukung 1 Pemain vs Bot AI pintar serta Mode Pass-and-Play (2 hingga 4 pemain lokal).

## 2. Problem Statement
- **Problem**: Banyak web game ular tangga yang ada hanya berupa 2D datar, membosankan, atau membutuhkan download aset 3D eksternal berukuran besar yang rawan gagal muat.
- **Target Users**: Pemain kasual segala usia di Indonesia, pecinta nostalgia board game masa kecil, dan keluarga/teman yang ingin bermain bersama di browser.
- **Current Pain Points**: Kurangnya animasi 3D yang dinamis, minimnya visual dramatis saat bidak dimakan ular atau memanjat tangga, dan ketergantungan pada file 3D eksternal yang berat.

## 3. Goals & Success Metrics
| Goal | Metric | Target |
|---|---|---|
| Zero External 3D Assets | % Model Dihasilkan Prosedural | 100% Prosedural (Three.js Geometry + Canvas Shaders) |
| Performa Halus & Cepat | Frame Rate di Browser & Mobile | 60 FPS stabil, Load time < 1.5 detik |
| User Engagement | Keseruan Bermain | Animasi kamera sinematik saat giliran, lemparan dadu, panjat tangga, & luncuran ular |

## 4. User Personas
### Persona 1: Budi (Pemain Nostalgia & Kasual)
- **Role**: Pengguna browser desktop/ponsel.
- **Goals**: Mengingat kenangan bermain ular tangga klasik zaman SD dengan sentuhan 3D modern yang seru.
- **Frustrations**: Game web yang lambat loading, iklan mengganggu, atau grafis kaku.

## 5. Feature Requirements
### MVP Features (Must Have — v1.0)
- [ ] **Papan 3D 100 Kotak Prosedural**: Grid 10x10 dengan sistem boustrophedon (ular tangga zigzag), tekstur nomor dan ornamen khas papan legendaris Indonesia.
- [ ] **Ular 3D Prosedural**: Mesh ular berlekuk dinamis dengan kepala, taring, dan mata 3D yang menghubungkan kotak tinggi ke kotak rendah.
- [ ] **Tangga 3D Prosedural**: Model tangga bambu/kayu dengan anak tangga 3D realistis yang menghubungkan kotak rendah ke kotak tinggi.
- [ ] **Dadu 3D Interaktif**: Simulasi kocok dadu 3D berputar realistis dengan angka 1-6.
- [ ] **Bidak Pion 3D**: Pion silindris/piala warna-warni dengan animasi lompat per kotak (hopping animation).
- [ ] **Kamera Sinematik**: Kamera orbit bebas (OrbitControls) dan kamera fokus dinamis mengikuti pion yang berjalan/meluncur.
- [ ] **Mode Permainan**: Main Lawan AI / Komputer Pintar atau Mode Pass-and-Play (2-4 Pemain Lokal).
- [ ] **Efek Suara & Visual Audio-Synthesizer**: Web Audio API untuk efek kocok dadu, langkah pion, suara memanjat tangga, dan desisan ular.

### Phase 2 Features (Should Have — v1.x)
- [ ] Kartu Kejutan / Petak Misteri (Kotak zonk, kotak berkah, dadu ganda).
- [ ] Tema Papan (Klasik Nusantara, Candi/Batu Purba, Hutan Tropis).

## 6. Technical Architecture
### Stack Decision
| Layer | Technology | Rationale |
|---|---|---|
| 3D Engine | Three.js (WebGL) | Standar industri 3D web, performa tinggi, dukungan penuh geometri prosedural |
| UI & Audio | Vanilla HTML5 / Modern CSS / Web Audio API | Ringan, responsif, tanpa dependensi berlebih, instan load |
| Asset Pipeline | Procedural Geometries & Dynamic Canvas Textures | Tidak perlu file `.gltf`/`.obj` eksternal, 100% siap langsung jalan |

## 7. Data Model (High-Level)
GameState:
- board: Tile[100] (id, snakeEnd, ladderEnd, trapType)
- players: Player[] (id, name, color, position, isAI, score)
- turnIndex: number
- diceValue: number
- gamePhase: 'IDLE' | 'ROLLING' | 'MOVING' | 'CLIMBING' | 'SLIDING' | 'GAME_OVER'

## 8. User Flows
1. Pemain membuka game -> Memilih jumlah pemain (1 vs Bot, 2P, 3P, atau 4P).
2. Pemain menekan tombol "Kocok Dadu" -> Dadu 3D melayang dan berguling di atas meja papan.
3. Pion melompat sesuai angka dadu.
4. Jika berhenti di ekor tangga -> Pion memanjat tangga ke atas dengan animasi kamera zoom.
5. Jika berhenti di kepala ular -> Pion meluncur turun ke ekor ular dengan animasi ekspresi lucu.
6. Siapa yang pertama kali mendarat tepat di kotak 100 keluar sebagai Juara dengan selebrasi partikel 3D!

## 9. Non-Functional Requirements
- Responsif untuk layar Laptop, Desktop, Tablet, dan Mobile.
- 60 FPS rendering dengan shadow mapping yang dioptimalkan.
- WCAG compliant color contrast dan tombol interaksi yang jelas.

## 10. Out of Scope (v1.0)
- Sistem multiplayer online WebSocket (disiapkan untuk arsitektur masa depan).
- Pembelian koin/mikrotransaksi.

## 11. Open Questions (Untuk Brainstorming)
- Pilihan gameplay & mode utama: Apakah mengutamakan mode Klasik Nostalgia 100 Kotak murni, atau dilengkapi dengan kotak Spesial/Jebakan (Power-ups/Misteri)?
- Visual style papan: Klasik retro kartun khas Indonesia atau Papan 3D Elegan Modern bertema Nusantara?
