// ==========================================
// GAME CONSTANTS & CONFIGURATION
// ==========================================
export const BOARD_SIZE = 10;
export const TILE_SIZE = 2.5;
export const BOARD_WIDTH = BOARD_SIZE * TILE_SIZE; // 25.0
export const BOARD_OFFSET = BOARD_WIDTH / 2; // 12.5
export const BOARD_SURFACE_Y = 0.45;

// Classic Indonesian Snake & Ladder Placements
export const SNAKES = [
  { head: 98, tail: 78 },
  { head: 95, tail: 56 },
  { head: 88, tail: 24 },
  { head: 62, tail: 18 },
  { head: 48, tail: 26 },
  { head: 36, tail: 6 },
  { head: 32, tail: 10 }
];

export const LADDERS = [
  { base: 4, top: 14 },
  { base: 9, top: 31 },
  { base: 21, top: 42 },
  { base: 28, top: 84 },
  { base: 51, top: 67 },
  { base: 71, top: 91 },
  { base: 80, top: 99 }
];

export const MYSTERY_TILES = [
  { tile: 19, type: 'BONUS', label: '🎁 Berkah +3', steps: 3, desc: 'Mendapat Berkah! Maju 3 langkah ekstra!' },
  { tile: 53, type: 'EXTRA_ROLL', label: '⚡ Dadu Ganda', steps: 0, desc: 'Dadu Ganda! Boleh lempar sekali lagi!' },
  { tile: 76, type: 'ZONK', label: '🌀 Zonk -3', steps: -3, desc: 'Tergelincir Zonk! Mundur 3 langkah!' }
];

// Special Culture & Trivia Tiles (Kotak Kartu Budaya Nusantara)
export const CULTURE_TILES = [12, 38, 65, 83];

export const TRIVIA_QUESTIONS = [
  {
    q: "Alat musik bambu dari Jawa Barat yang dimainkan dengan cara digoyangkan adalah?",
    options: ["Angklung", "Sasando", "Gamelan"],
    answer: 0,
    info: "Angklung telah diakui UNESCO sebagai Warisan Budaya Takbenda Dunia!"
  },
  {
    q: "Rumah adat Sumatera Barat dengan atap runcing menyerupai tanduk kerbau bernama?",
    options: ["Rumah Gadang", "Rumah Joglo", "Rumah Tongkonan"],
    answer: 0,
    info: "Rumah Gadang melambangkan keharmonisan masyarakat Minangkabau dengan alam."
  },
  {
    q: "Danau vulkanik terbesar di Indonesia yang terletak di Sumatera Utara adalah?",
    options: ["Danau Toba", "Danau Kelimutu", "Danau Maninjau"],
    answer: 0,
    info: "Danau Toba memiliki pulau Samosir di tengahnya yang memesona."
  },
  {
    q: "Candi Buddha terbesar di dunia yang terletak di Magelang, Jawa Tengah adalah?",
    options: ["Candi Borobudur", "Candi Prambanan", "Candi Mendut"],
    answer: 0,
    info: "Candi Borobudur dibangun pada abad ke-8 pada masa dinasti Syailendra."
  },
  {
    q: "Tari Kecak yang khas dengan paduan suara vokal 'cak-cak-cak' berasal dari daerah?",
    options: ["Bali", "Lombok", "Madura"],
    answer: 0,
    info: "Tari Kecak menceritakan kisah epik Ramayana saat matahari terbenam."
  },
  {
    q: "Alat musik petik tradisional dengan tabung bambu dan wadah daun lontar dari Pulau Rote NTT adalah?",
    options: ["Sasando", "Kolintang", "Kecapi"],
    answer: 0,
    info: "Sasando menghasilkan alunan melodi petik yang sangat anggun dan merdu."
  },
  {
    q: "Senjata tradisional khas suku Dayak di Kalimantan yang berhiaskan ukiran dan bulu burung adalah?",
    options: ["Mandau", "Keris", "Rencong"],
    answer: 0,
    info: "Mandau adalah pusaka kehormatan suku Dayak yang sarat makna filosofis."
  }
];

export const PLAYER_COLORS = [
  { hex: '#ef4444', int: 0xef4444, name: 'Merah' },
  { hex: '#3b82f6', int: 0x3b82f6, name: 'Biru' },
  { hex: '#10b981', int: 0x10b981, name: 'Hijau' },
  { hex: '#f59e0b', int: 0xf59e0b, name: 'Kuning' }
];

// Procedural Traditional Indonesian Headgears (Avatar Accessories)
export const HEADGEARS = [
  { id: 'mahkota', name: 'Mahkota Sultan', icon: '👑', desc: 'Mahkota Emas Kerajaan Nusantara' },
  { id: 'caping', name: 'Caping Bambu', icon: '🌾', desc: 'Topi Anyaman Bambu Tradisional' },
  { id: 'udeng', name: 'Udeng Jawara', icon: '🪓', desc: 'Ikat Kepala Pendekar Silat' },
  { id: 'peci', name: 'Peci Songkok', icon: '🎖️', desc: 'Peci Beludru Hitam Nusantara' },
  { id: 'helm', name: 'Helm Ksatria', icon: '🛡️', desc: 'Helm Perunggu Prajurit Majapahit' },
  { id: 'cendrawasih', name: 'Bulu Kasuari', icon: '🌿', desc: 'Mahkota Hias Kasuari & Papua' }
];

export const SOUNDPACKS = [
  { id: 'gamelan', name: 'Gamelan Pelog', icon: '🎶' },
  { id: 'angklung', name: 'Angklung Sunda', icon: '🎋' },
  { id: 'chiptune', name: 'Retro 8-Bit', icon: '🕹️' }
];

// Procedural Traditional Indonesian Textile & Batik Motifs for 3D Pawns
export const BATIK_MOTIFS = [
  { id: 'polos', name: 'Polos Glossy', icon: '✨', desc: 'Enamel Mengkilap Bersih' },
  { id: 'megamendung', name: 'Mega Mendung', icon: '🌊', desc: 'Batik Awan Cirebon Bertingkat' },
  { id: 'kawung', name: 'Batik Kawung', icon: '🌺', desc: 'Motif Pusaka Sakral 4 Kelopak' },
  { id: 'songket', name: 'Songket Emas', icon: '🧵', desc: 'Rajutan Tenun Benang Emas Kerajaan' },
  { id: 'tenun', name: 'Tenun Ikat', icon: '🪢', desc: 'Motif Geometris Etnik Toraja/Sumba' }
];

// Multi-Dialek Nusantara Voice Synthesizer Profiles & Banter Dictionaries
export const NUSANTARA_DIALECTS = [
  { id: 'jawa', name: 'Dialek Jawa', icon: 'ꦗ', pitch: 1.0, rate: 1.05 },
  { id: 'sunda', name: 'Dialek Sunda', icon: 'ᮞ', pitch: 1.25, rate: 1.0 },
  { id: 'minang', name: 'Dialek Minang', icon: '🐅', pitch: 1.1, rate: 1.15 },
  { id: 'betawi', name: 'Dialek Betawi', icon: '🏙️', pitch: 0.95, rate: 1.1 },
  { id: 'bali', name: 'Dialek Bali', icon: '🌺', pitch: 1.2, rate: 0.95 }
];

export const DIALECT_BANTER = {
  jawa: {
    SNAKE: ["Waduh, dicokot ulo rek!", "Aduh, melorot mudun!", "Apes tenan, kena ulo!"],
    LADDER: ["Munggah tangga, mantep tenan!", "Alhamdulillah, munggah dhuwur!", "Gas terus munggah lur!"],
    SIX: ["Hoki tenan oleh nomer nem!", "Mantep, oleh dadu nem rek!", "Gas banter nomer nem!"],
    BOUNCE: ["Yah kebablasen, mencelat!", "Mundur maneh rek!", "Kelewat petak satus!"],
    WIN: ["Sopo sing iso ngalahke aku? Juara!", "Juara siji tenan rek!", "Menang tenan euy, mantep!"]
  },
  sunda: {
    SNAKE: ["Aduh cilaka, kacugak oray!", "Melorot deui euy, aduh!", "Hadeuh, dipacok oray!"],
    LADDER: ["Nerekel naek taraje euy!", "Mantep pisan naek ka luhur!", "Asik naek taraje baraya!"],
    SIX: ["Asik meunang genep baraya!", "Hoki pisan meunang genep!", "Gaspol genep lur!"],
    BOUNCE: ["Kelewatan euy, mundur deui!", "Wah mantul mundur baraya!", "Can pas saratus!"],
    WIN: ["Punten mang, urang nu juara!", "Hore urang juara baraya!", "Alhamdulillah rengse meunang!"]
  },
  minang: {
    SNAKE: ["Ondeh mande, digigik ula!", "Maluncua turun denai!", "Aduh cilako, kana ula gadang!"],
    LADDER: ["Mandaki janjang laju bana!", "Rancak bana, naiak ka ateh!", "Taruih mandaki dunsanak!"],
    SIX: ["Mantaap bana dapek anam!", "Hoki gadang dapek anam!", "Laju taruih anam!"],
    BOUNCE: ["Talampau laju, tapantua baliak!", "Mundua saketek dunsanak!", "Alun tapek saratuih!"],
    WIN: ["Alhamdulillah, den juaronyo!", "Gagah bana, denai juaro ciek!", "Alah salasai, rancak bana!"]
  },
  betawi: {
    SNAKE: ["Buset dah, dipatok uler tong!", "Meluncur ke bawah dah gua!", "Apes bener ketok uler!"],
    LADDER: ["Gile aje, ngibrit naek tangga!", "Mantap jiwa, naek ke atas!", "Langsung meluncur naek tong!"],
    SIX: ["Asik dapet enam cuy, hoki!", "Mantul dapet enam nih bos!", "Sikat abis dapet enam!"],
    BOUNCE: ["Kebablasan lu tong, ngoper balik!", "Mantul mundur dah jadinya!", "Belom pas cepek nih!"],
    WIN: ["Gue nih bos, senggol dong!", "Juara atu kite tong!", "Kaga ada obat, gue juarenye!"]
  },
  bali: {
    SNAKE: ["Aduh biang, kena lelipi gede!", "Ulung nolosor ke beten!", "Aduh kesisip lelipi!"],
    LADDER: ["Mapan gati, menek undag luung!", "Becik gati menek undag!", "Lancar jaya menek kaja!"],
    SIX: ["Becik gati maan angka nem!", "Hoki melah maan nem!", "Maju terus maan nem!"],
    BOUNCE: ["Liwat petakne, mawali ke duri!", "Mundurin jani timpang!", "Kondens pas satus!"],
    WIN: ["Tiang menang jengah, rahayu!", "Melah gati tiang nomer satu!", "Rahayu sareng sami, juara!"]
  }
};

// 5 Island Expedition Stages (Quest Mode)
export const EXPEDITIONS = [
  {
    id: 'jawa',
    name: 'Tanah Jawa',
    sub: 'Majapahit & Candi Borobudur',
    icon: '🏛️',
    boardTheme: 'candi',
    weather: 'cerah',
    soundpack: 'gamelan',
    badge: '👑 Penguasa Jawa'
  },
  {
    id: 'bali',
    name: 'Pulau Dewata',
    sub: 'Tirta Suci & Naga Barong',
    icon: '🌺',
    boardTheme: 'klasik',
    weather: 'hujan',
    soundpack: 'gamelan',
    badge: '🎋 Jawara Dewata'
  },
  {
    id: 'sumatera',
    name: 'Ranah Minang',
    sub: 'Danau Toba & Bukit Barisan',
    icon: '🌋',
    boardTheme: 'rimba',
    weather: 'daun',
    soundpack: 'angklung',
    badge: '🐅 Pendekar Minang'
  },
  {
    id: 'kalimantan',
    name: 'Rimba Kahayan',
    sub: 'Hutan Hujan Tropis Dayak',
    icon: '🌴',
    boardTheme: 'rimba',
    weather: 'hujan',
    soundpack: 'chiptune',
    badge: '🦅 Ksatria Dayak'
  },
  {
    id: 'papua',
    name: 'Puncak Jayawijaya',
    sub: 'Salju Abadi Khatulistiwa & Boss Ular',
    icon: '❄️',
    boardTheme: 'candi',
    weather: 'kabut',
    soundpack: 'gamelan',
    badge: '🗺️ Penakluk Nusantara'
  }
];

export const TOURNAMENT_BOTS = [
  { name: 'Tuanku Imam 🐅', accessory: 'tanjak', motif: 'songket' },
  { name: 'Gajah Mada ⚔️', accessory: 'mahkota', motif: 'kawung' },
  { name: 'Cut Nyak Dien 🦅', accessory: 'peci', motif: 'tenun' },
  { name: 'Pattimura 🗡️', accessory: 'udeng', motif: 'polos' },
  { name: 'Diponegoro 🐎', accessory: 'peci', motif: 'megamendung' },
  { name: 'I Gusti Ngurah 🌺', accessory: 'udeng', motif: 'songket' }
];
