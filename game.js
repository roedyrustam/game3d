import * as THREE from 'three';
import { OrbitControls } from './lib/OrbitControls.js';

import { BOARD_SIZE, TILE_SIZE, BOARD_WIDTH, BOARD_OFFSET, BOARD_SURFACE_Y, SNAKES, LADDERS, MYSTERY_TILES, CULTURE_TILES, TRIVIA_QUESTIONS, PLAYER_COLORS, HEADGEARS, SOUNDPACKS, BATIK_MOTIFS, NUSANTARA_DIALECTS, DIALECT_BANTER, EXPEDITIONS, TOURNAMENT_BOTS } from './constants.js';
import { audio } from './audio.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
// ==========================================
// 3D GAME STATE & APP ENGINE
// ==========================================
class SnakeAndLadderGame {
  constructor() {
    this.supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
    this.container = document.getElementById('canvas-container');
    this.players = [];
    this.currentTurn = 0;
    this.isRolling = false;
    this.isMoving = false;
    this.autoCamera = true;
    this.gameSpeed = 1;
    this.tileCoords = new Map(); // tileNum -> THREE.Vector3
    this.confettiParticles = [];
    this.activeEmotes = []; // Active 3D floating speech bubbles
    this.playerHeadgears = ['mahkota', 'caping', 'udeng', 'peci'];
    this.playerMotifs = ['megamendung', 'kawung', 'songket', 'tenun'];
    this.playerDialects = ['jawa', 'sunda', 'minang', 'betawi'];
    this.voiceEnabled = true;
    this.expeditionLevel = parseInt(localStorage.getItem('expeditionLevel') || '0');
    this.currentExpedition = EXPEDITIONS[this.expeditionLevel]?.id || 'jawa';
    this.isExpeditionMode = false;

    // Turnamen Mini Knockout Bracket (Piala Raja Nusantara)
    this.isTournamentMode = false;
    this.tournamentRound = 'semifinal'; // 'semifinal' | 'final'
    this.tournamentPlayer = { name: 'Pemain 1', accessory: 'mahkota', motif: 'megamendung' };
    this.tournamentBracket = {
      sf1: { p1: 'Pemain Anda', p2: 'Tuanku Imam 🐅', winner: null, status: 'ready' },
      sf2: { p1: 'Gajah Mada ⚔️', p2: 'I Gusti Ngurah 🌺', winner: null, status: 'waiting' },
      final: { p1: 'Menunggu SF1', p2: 'Menunggu SF2', winner: null, status: 'waiting' }
    };

    // 3D Dynamic Weather Engine
    this.currentWeather = 'cerah'; // 'cerah' | 'hujan' | 'daun' | 'kabut'
    this.rainParticles = null;
    this.leafParticles = [];
    this.lightningTimer = null;

    // Real-Time Online Multiplayer Room State
    this.isOnlineGame = false;
    this.roomId = null;
    this.myPlayerIndex = 0;
    this.eventSource = null;

    this.initThree();
    this.initProceduralBoard();
    this.initProceduralLadders();
    this.initProceduralSnakes();
    this.initProceduralDice();
    this.initRaycaster();
    this.initUI();
    this.animate();
  }

  // ------------------------------------------
  // Game Statistics & Records (Local Persistence)
  // ------------------------------------------
  loadStats() {
    try {
      const saved = localStorage.getItem('ular_tangga_stats_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      gamesPlayed: 0,
      p1Wins: 0,
      botWins: 0,
      fastestWin: null,
      totalLadders: 0,
      totalSnakes: 0,
      shieldsUsed: 0,
      triviaCorrect: 0,
      sixRolls: 0
    };
  }

  saveStats() {
    try {
      localStorage.setItem('ular_tangga_stats_v1', JSON.stringify(this.stats));
    } catch (e) {}
  }

  recordStat(key, increment = 1) {
    if (typeof this.stats[key] === 'undefined') {
      this.stats[key] = 0;
    }
    if (typeof this.stats[key] === 'number') {
      this.stats[key] += increment;
    }
    this.saveStats();
  }

  renderStatsUI() {
    const container = document.getElementById('stats-grid-container');
    if (container) {
      container.innerHTML = `
        <div class="stat-card">
          <span class="stat-num">${this.stats.gamesPlayed}</span>
          <span class="stat-label">🎮 Total Main</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #4ade80;">${this.stats.p1Wins}</span>
          <span class="stat-label">👑 Menang P1</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #60a5fa;">${this.stats.botWins}</span>
          <span class="stat-label">🤖 Menang Bot AI</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #f43f5e;">${this.stats.fastestWin ? this.stats.fastestWin + ' Dadu' : '-'}</span>
          <span class="stat-label">⚡ Rekor Tercepat</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #34d399;">${this.stats.totalLadders}</span>
          <span class="stat-label">🪜 Naik Tangga</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #f87171;">${this.stats.totalSnakes}</span>
          <span class="stat-label">🐍 Digigit Ular</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #a78bfa;">${this.stats.shieldsUsed}</span>
          <span class="stat-label">🛡️ Tameng Aktif</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #fbbf24;">${this.stats.triviaCorrect}</span>
          <span class="stat-label">📚 Trivia Benar</span>
        </div>
      `;
    }

    // Render Badges / Achievements
    const badgeContainer = document.getElementById('badges-grid-container');
    if (badgeContainer) {
      const badges = [
        {
          id: 'juara',
          title: 'Sultan Petak 100',
          desc: 'Menangkan minimal 1 permainan',
          icon: '👑',
          unlocked: this.stats.p1Wins >= 1,
          progress: `${Math.min(1, this.stats.p1Wins)}/1`
        },
        {
          id: 'tameng',
          title: 'Kebal Bisa Ular',
          desc: 'Tangkis gigitan ular dengan Tameng Bambu',
          icon: '🛡️',
          unlocked: this.stats.shieldsUsed >= 1,
          progress: `${Math.min(1, this.stats.shieldsUsed)}/1`
        },
        {
          id: 'budaya',
          title: 'Cendekiawan Budaya',
          desc: 'Jawab 3 kuis budaya dengan benar',
          icon: '🧠',
          unlocked: this.stats.triviaCorrect >= 3,
          progress: `${Math.min(3, this.stats.triviaCorrect)}/3`
        },
        {
          id: 'tangga',
          title: 'Pendaki Ulung',
          desc: 'Panjat 5 tangga secara akumulatif',
          icon: '🪜',
          unlocked: this.stats.totalLadders >= 5,
          progress: `${Math.min(5, this.stats.totalLadders)}/5`
        },
        {
          id: 'dadu6',
          title: 'Hoki Dadu Dewa',
          desc: 'Lempar angka 6 sebanyak 3 kali',
          icon: '🎲',
          unlocked: (this.stats.sixRolls || 0) >= 3,
          progress: `${Math.min(3, this.stats.sixRolls || 0)}/3`
        },
        {
          id: 'veteran',
          title: 'Penjelajah Sejati',
          desc: 'Selesaikan 5 permainan penuh',
          icon: '🎮',
          unlocked: this.stats.gamesPlayed >= 5,
          progress: `${Math.min(5, this.stats.gamesPlayed)}/5`
        },
        {
          id: 'ekspedisi',
          title: 'Penakluk Nusantara',
          desc: 'Selesaikan minimal 1 tahap Ekspedisi Pulau',
          icon: '🗺️',
          unlocked: (this.stats.expeditionsCompleted || 0) >= 1,
          progress: `${Math.min(1, this.stats.expeditionsCompleted || 0)}/1`
        },
        {
          id: 'pialaraja',
          title: 'Juara Piala Raja',
          desc: 'Menangkan Turnamen Knockout Piala Raja Nusantara',
          icon: '🏆',
          unlocked: (this.stats.tournamentsWon || 0) >= 1,
          progress: `${Math.min(1, this.stats.tournamentsWon || 0)}/1`
        }
      ];

      badgeContainer.innerHTML = badges.map(b => `
        <div class="badge-card ${b.unlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-info">
            <div class="badge-title">${b.title}</div>
            <div class="badge-desc">${b.desc}</div>
            <div class="badge-tag ${b.unlocked ? 'unlocked' : 'locked'}">
              ${b.unlocked ? '⭐ TERBUKA' : '🔒 TERKUNCI (' + b.progress + ')'}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // ------------------------------------------
  // Three.js Scene, Camera, Lights, Renderer
  // ------------------------------------------
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 32, 28);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 0, 0);

    // Studio Lighting
    this.ambientLight = new THREE.AmbientLight(0xfff6ea, 1.1);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sunLight.position.set(15, 35, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;
    const shadowD = 18;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    this.rimLight.position.set(-20, 15, -20);
    this.scene.add(this.rimLight);

    this.currentEnvironmentTheme = 'malam';
    this.tileMeshes = [];

    this.initActiveTileHalo();
    this.initFloatingSparks();
    this.initWeatherParticles();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  // ------------------------------------------
  // 3D Dynamic Weather Engine (Efek Cuaca Dinamis 3D)
  // ------------------------------------------
  initWeatherParticles() {
    // 1. Procedural 3D Rain Particles (450 drops)
    const rainCount = 450;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    this.rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 45;
      rainPositions[i * 3 + 1] = 0.5 + Math.random() * 30;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 45;
      this.rainVelocities[i] = 0.55 + Math.random() * 0.3;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.28,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // 2. Procedural Swirling Tropical Leaves (60 leaves)
    this.leafGroup = new THREE.Group();
    const leafGeo = new THREE.PlaneGeometry(0.3, 0.45);
    const leafColors = [0x10b981, 0x059669, 0xd97706, 0xeab308, 0x15803d];

    this.leafData = [];
    for (let i = 0; i < 60; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: leafColors[i % leafColors.length],
        side: THREE.DoubleSide,
        roughness: 0.6
      });
      const mesh = new THREE.Mesh(leafGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 35,
        1 + Math.random() * 20,
        (Math.random() - 0.5) * 35
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.leafGroup.add(mesh);

      this.leafData.push({
        mesh,
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.05, 0.02 + Math.random() * 0.04, (Math.random() - 0.5) * 0.04),
        fallSpeed: 0.03 + Math.random() * 0.03,
        driftPhase: Math.random() * Math.PI * 2
      });
    }

    this.leafGroup.visible = false;
    this.scene.add(this.leafGroup);
  }

  setWeather(weatherId) {
    this.currentWeather = weatherId;
    if (this.lightningTimer) {
      clearInterval(this.lightningTimer);
      this.lightningTimer = null;
    }

    if (weatherId === 'hujan') {
      // 🌧️ Hujan Tropis Nusantara
      if (this.rainParticles) this.rainParticles.visible = true;
      if (this.leafGroup) this.leafGroup.visible = false;
      if (this.sparks) this.sparks.visible = false;
      this.scene.fog.density = 0.024;
      this.showToast('🌧️ Cuaca: Hujan Tropis Nusantara!');

      // Periodic random thunder & lightning flash (every 12-20s)
      this.lightningTimer = setInterval(() => {
        if (this.currentWeather === 'hujan' && Math.random() < 0.6) {
          this.triggerLightningFlash();
        }
      }, 14000);

      this.triggerLightningFlash(); // initial welcome thunder
    } else if (weatherId === 'daun') {
      // 🍃 Guguran Daun Rimba
      if (this.rainParticles) this.rainParticles.visible = false;
      if (this.leafGroup) this.leafGroup.visible = true;
      if (this.sparks) this.sparks.visible = false;
      this.scene.fog.density = 0.018;
      this.showToast('🍃 Cuaca: Guguran Daun Rimba!');
      audio.playPop(520, 0.08);
    } else if (weatherId === 'kabut') {
      // 🌫️ Kabut Mistis Candi
      if (this.rainParticles) this.rainParticles.visible = false;
      if (this.leafGroup) this.leafGroup.visible = false;
      if (this.sparks) this.sparks.visible = true;
      this.scene.fog.density = 0.038; // Rich thick fog
      this.showToast('🌫️ Cuaca: Kabut Mistis Pegunungan!');
      audio.playPop(380, 0.08);
    } else {
      // ✨ Cerah Berbintang (Default)
      if (this.rainParticles) this.rainParticles.visible = false;
      if (this.leafGroup) this.leafGroup.visible = false;
      if (this.sparks) this.sparks.visible = true;
      this.scene.fog.density = 0.015;
      this.showToast('✨ Cuaca: Langit Cerah Berbintang!');
      audio.playPop(620, 0.08);
    }
  }

  cycleWeather() {
    const weathers = [
      { id: 'cerah', icon: '✨', name: 'Cerah Berbintang' },
      { id: 'hujan', icon: '🌧️', name: 'Hujan Tropis' },
      { id: 'daun', icon: '🍃', name: 'Guguran Daun Rimba' },
      { id: 'kabut', icon: '🌫️', name: 'Kabut Mistis Pagi' }
    ];
    const idx = weathers.findIndex(w => w.id === this.currentWeather);
    const nextW = weathers[(idx + 1) % weathers.length];
    this.setWeather(nextW.id);
    const btn = document.getElementById('btn-weather');
    if (btn) btn.innerText = nextW.icon;
    return nextW;
  }

  triggerLightningFlash() {
    if (!this.sunLight || !this.ambientLight) return;
    audio.playThunder();

    const origSun = this.sunLight.intensity;
    const origAmb = this.ambientLight.intensity;

    // Fast Double Flash
    this.sunLight.intensity = 3.8;
    this.ambientLight.intensity = 2.6;

    setTimeout(() => {
      this.sunLight.intensity = origSun * 1.5;
      this.ambientLight.intensity = origAmb * 1.4;
      setTimeout(() => {
        this.sunLight.intensity = 3.2;
        this.ambientLight.intensity = 2.2;
        setTimeout(() => {
          this.sunLight.intensity = origSun;
          this.ambientLight.intensity = origAmb;
        }, 120);
      }, 70);
    }, 90);
  }

  setEnvironmentTheme(theme) {
    this.currentEnvironmentTheme = theme;
    if (theme === 'siang') {
      this.scene.background.set(0x38bdf8);
      this.scene.fog.color.set(0x38bdf8);
      this.sunLight.color.set(0xfffbeb);
      this.sunLight.intensity = 1.7;
      this.ambientLight.color.set(0xffffff);
      this.ambientLight.intensity = 1.3;
      this.rimLight.color.set(0xfef08a);
    } else if (theme === 'senja') {
      this.scene.background.set(0x451a03);
      this.scene.fog.color.set(0x451a03);
      this.sunLight.color.set(0xf97316);
      this.sunLight.intensity = 1.8;
      this.ambientLight.color.set(0xfed7aa);
      this.ambientLight.intensity = 1.0;
      this.rimLight.color.set(0xec4899);
    } else if (theme === 'neon') {
      // Mode Malam Sakral Berpendar (Glow-in-the-dark Neon Nusantara)
      this.scene.background.set(0x040614);
      this.scene.fog.color.set(0x040614);
      this.sunLight.color.set(0x06b6d4); // Neon Cyan
      this.sunLight.intensity = 1.3;
      this.ambientLight.color.set(0xa855f7); // Neon Violet
      this.ambientLight.intensity = 1.5;
      this.rimLight.color.set(0xfacc15); // Neon Gold
      if (this.sparks) {
        this.sparks.material.color.set(0x22d3ee);
        this.sparks.material.size = 0.55;
      }
    } else {
      // malam (default)
      this.scene.background.set(0x0a0f1d);
      this.scene.fog.color.set(0x0a0f1d);
      this.sunLight.color.set(0xffffff);
      this.sunLight.intensity = 1.4;
      this.ambientLight.color.set(0xfff6ea);
      this.ambientLight.intensity = 1.1;
      this.rimLight.color.set(0x38bdf8);
      if (this.sparks) {
        this.sparks.material.color.set(0xfde047);
        this.sparks.material.size = 0.35;
      }
    }
    
    // Toggle material emissive states for neon glowing mode
    this.toggleNeonEmissive(theme === 'neon');
  }

  toggleNeonEmissive(isNeon) {
    document.body.classList.toggle('neon-mode', isNeon); // For CSS HUD dark mode
    this.scene.traverse((child) => {
      if (child.isMesh && child.material && child.userData.isNeonable) {
        // Assume material supports emissive (MeshStandardMaterial)
        if (isNeon) {
          if (!child.userData.originalEmissive) {
            child.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000);
          }
          child.material.emissive = new THREE.Color(child.userData.neonColor || 0x22d3ee);
          child.material.emissiveIntensity = child.userData.neonIntensity || 0.8;
        } else {
          if (child.userData.originalEmissive && child.material.emissive) {
            child.material.emissive.copy(child.userData.originalEmissive);
            child.material.emissiveIntensity = 1;
          }
        }
      }
    });
  }

  initActiveTileHalo() {
    const ringGeo = new THREE.RingGeometry(0.85, 1.15, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.haloMesh = new THREE.Mesh(ringGeo, ringMat);
    this.haloMesh.position.y = BOARD_SURFACE_Y + 0.05;
    this.scene.add(this.haloMesh);
  }

  initFloatingSparks() {
    const count = 90;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = 1 + Math.random() * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.sparks = new THREE.Points(geom, mat);
    this.scene.add(this.sparks);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.interactive') || e.target.closest('.modal-dialog')) return;
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.diceMesh) {
        const hits = this.raycaster.intersectObject(this.diceMesh);
        if (hits.length > 0) {
          const cur = this.players[this.currentTurn];
          if (cur && !cur.isAI && !this.isRolling && !this.isMoving) {
            this.rollDice();
            return;
          }
        }
      }

      // Check Tile Inspection Click
      if (this.tileMeshes && this.tileMeshes.length > 0) {
        const tileHits = this.raycaster.intersectObjects(this.tileMeshes);
        if (tileHits.length > 0) {
          const num = tileHits[0].object.userData.tileNum;
          if (num) this.inspectTile(num);
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.diceMesh) {
        const hits = this.raycaster.intersectObject(this.diceMesh);
        const cur = this.players[this.currentTurn];
        if (hits.length > 0 && cur && !cur.isAI && !this.isRolling && !this.isMoving) {
          document.body.style.cursor = 'pointer';
          return;
        }
      }
      document.body.style.cursor = 'default';
    });
  }

  inspectTile(num) {
    const snake = SNAKES.find(s => s.head === num);
    const ladder = LADDERS.find(l => l.base === num);
    const mystery = MYSTERY_TILES.find(m => m.tile === num);
    const isCulture = CULTURE_TILES.includes(num);

    if (num === 1) {
      this.showToast('📍 Petak 1: Titik Awal Permainan!');
    } else if (num === 100) {
      this.showToast('🏆 Petak 100: Garis Akhir Kemenangan!');
    } else if (ladder) {
      this.showToast(`🪜 Petak ${num}: Tangga Bambu naik ke Petak ${ladder.top}!`);
      audio.playPop(520, 0.1);
    } else if (snake) {
      this.showToast(`🐍 Petak ${num}: Awas Ular! Meluncur turun ke Petak ${snake.tail}!`);
      audio.playPop(220, 0.1);
    } else if (mystery) {
      this.showToast(`${mystery.label}: ${mystery.desc}`);
      audio.playMysterySound();
    } else if (isCulture) {
      this.showToast(`⭐ Petak ${num}: Kartu Budaya Nusantara! Berisi Kuis Wawasan & Tameng Sakti!`);
      audio.playMysterySound();
    } else {
      this.showToast(`📍 Petak ${num}: Petak aman.`);
      audio.playPop(400, 0.05);
    }
  }

  addHistoryLog(msg) {
    const container = document.getElementById('game-history-log');
    if (!container) return;
    const item = document.createElement('div');
    item.style.padding = '4px 0';
    item.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
    item.innerHTML = msg;
    if (container.children.length === 1 && container.children[0].innerText.includes('Belum ada')) {
      container.innerHTML = '';
    }
    container.insertBefore(item, container.firstChild);
    while (container.children.length > 8) {
      container.removeChild(container.lastChild);
    }
  }

  // ------------------------------------------
  // Boustrophedon Tile Mapping (1 to 100)
  // ------------------------------------------
  getTilePosition(tileNum) {
    if (this.tileCoords.has(tileNum)) {
      return this.tileCoords.get(tileNum).clone();
    }
    const n = Math.max(1, Math.min(100, tileNum));
    const row = Math.floor((n - 1) / BOARD_SIZE); // 0 (bottom) to 9 (top)
    let col = (n - 1) % BOARD_SIZE;
    if (row % 2 === 1) {
      col = BOARD_SIZE - 1 - col; // Reverse on odd rows (zigzag)
    }
    const x = (col + 0.5) * TILE_SIZE - BOARD_OFFSET;
    const z = BOARD_OFFSET - (row + 0.5) * TILE_SIZE;
    const y = BOARD_SURFACE_Y;
    const pos = new THREE.Vector3(x, y, z);
    this.tileCoords.set(tileNum, pos);
    return pos.clone();
  }

  // ------------------------------------------
  // Procedural 3D Board Generation
  // ------------------------------------------
  // ------------------------------------------
  // Procedural 3D Board Generation & Themes
  // ------------------------------------------
  setBoardTheme(themeName) {
    if (this.boardTheme === themeName) return;
    this.boardTheme = themeName;

    // Dispose and remove existing board meshes and textures
    if (this.boardGroup) {
      this.scene.remove(this.boardGroup);
      this.boardGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
    }

    this.tileMeshes = [];
    this.initProceduralBoard();

    // Refresh pawn placement
    if (this.players.length > 0) {
      this.updatePawnPositions(false);
    }
    audio.playPop(580, 0.08);
  }

  initProceduralBoard() {
    this.boardTheme = this.boardTheme || 'klasik';
    this.boardGroup = new THREE.Group();

    // Default Theme Palette: Klasik 90-an
    let woodBaseColor = 0x451a03;
    let goldTrimColor = 0xd97706;
    let tileColors = ['#fef08a', '#bae6fd', '#bbf7d0', '#fbcfe8', '#fed7aa'];
    let normalBorderColor = '#334155';
    let numberTextColor = '#0f172a';
    let cultureBg = '#fef3c7';
    let cultureBorder = '#d97706';
    let cultureTextColor = '#b45309';
    let startBg = '#4ade80';
    let finishBg = '#fbbf24';

    if (this.boardTheme === 'candi') {
      // Candi Borobudur / Ancient Andesite Stone & Gold
      woodBaseColor = 0x1e293b;
      goldTrimColor = 0xf59e0b;
      tileColors = ['#334155', '#2c3545', '#3e4a5e', '#374151', '#283243'];
      normalBorderColor = '#64748b';
      numberTextColor = '#f8fafc';
      cultureBg = '#451a03';
      cultureBorder = '#fbbf24';
      cultureTextColor = '#fde047';
      startBg = '#065f46';
      finishBg = '#b45309';
    } else if (this.boardTheme === 'rimba') {
      // Rimba Hutan Tropis / Lush Emerald & Teak
      woodBaseColor = 0x14532d;
      goldTrimColor = 0x10b981;
      tileColors = ['#dcfce7', '#bbf7d0', '#fef9c3', '#a7f3d0', '#fef08a'];
      normalBorderColor = '#15803d';
      numberTextColor = '#064e3b';
      cultureBg = '#fed7aa';
      cultureBorder = '#ea580c';
      cultureTextColor = '#c2410c';
      startBg = '#22c55e';
      finishBg = '#eab308';
    }

    // Base Pedestal
    const baseGeo = new THREE.BoxGeometry(BOARD_WIDTH + 1.8, 0.8, BOARD_WIDTH + 1.8);
    const woodMat = new THREE.MeshStandardMaterial({
      color: woodBaseColor,
      roughness: this.boardTheme === 'candi' ? 0.9 : 0.6,
      metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeo, woodMat);
    baseMesh.position.y = -0.4;
    baseMesh.receiveShadow = true;
    this.boardGroup.add(baseMesh);

    // Decorative Trim
    const trimGeo = new THREE.BoxGeometry(BOARD_WIDTH + 2.1, 0.15, BOARD_WIDTH + 2.1);
    const goldMat = new THREE.MeshStandardMaterial({
      color: goldTrimColor,
      roughness: 0.3,
      metalness: 0.8
    });
    const trimMesh = new THREE.Mesh(trimGeo, goldMat);
    trimMesh.position.y = 0.02;
    this.boardGroup.add(trimMesh);

    // Generate 100 Individual Interactive Tiles with Procedural Textures
    const tileMeshGeo = new THREE.BoxGeometry(TILE_SIZE - 0.12, 0.12, TILE_SIZE - 0.12);

    for (let num = 1; num <= 100; num++) {
      const pos = this.getTilePosition(num);
      const isStart = num === 1;
      const isFinish = num === 100;
      const snakeHead = SNAKES.find(s => s.head === num);
      const ladderBase = LADDERS.find(l => l.base === num);

      // Create Dynamic Canvas Texture for each tile
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const mystery = MYSTERY_TILES.find(m => m.tile === num);
      const isCulture = CULTURE_TILES.includes(num);

      // Tile Background Color
      const bgIdx = (num + Math.floor((num - 1) / 10)) % tileColors.length;
      ctx.fillStyle = isStart ? startBg : isFinish ? finishBg : isCulture ? cultureBg : mystery ? (mystery.type === 'ZONK' ? '#fecaca' : '#ede9fe') : tileColors[bgIdx];
      ctx.fillRect(0, 0, 256, 256);

      // Ornate Border
      ctx.strokeStyle = isCulture ? cultureBorder : mystery ? (mystery.type === 'ZONK' ? '#dc2626' : '#7c3aed') : normalBorderColor;
      ctx.lineWidth = isCulture || mystery ? 14 : 10;
      ctx.strokeRect(5, 5, 246, 246);

      // Inner Corner Accents
      ctx.strokeStyle = isCulture ? 'rgba(217, 119, 6, 0.4)' : (this.boardTheme === 'candi' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)');
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, 220, 220);

      // Draw Tile Number
      ctx.fillStyle = isStart ? '#ffffff' : isFinish ? '#ffffff' : numberTextColor;
      ctx.font = 'bold 74px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${num}`, 128, isStart || isFinish || snakeHead || ladderBase || mystery || isCulture ? 90 : 128);

      // Special Indicators
      if (isStart) {
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('MULAI', 128, 175);
      } else if (isFinish) {
        ctx.font = 'bold 40px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🏆 JUARA', 128, 175);
      } else if (snakeHead) {
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.fillText(`🐍 KE ${snakeHead.tail}`, 128, 175);
      } else if (ladderBase) {
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.fillStyle = this.boardTheme === 'candi' ? '#34d399' : '#047857';
        ctx.fillText(`🪜 KE ${ladderBase.top}`, 128, 175);
      } else if (mystery) {
        ctx.font = 'bold 30px Outfit, sans-serif';
        ctx.fillStyle = mystery.type === 'ZONK' ? '#b91c1c' : '#6d28d9';
        ctx.fillText(mystery.label, 128, 175);
      } else if (isCulture) {
        ctx.font = 'bold 28px Outfit, sans-serif';
        ctx.fillStyle = cultureTextColor;
        ctx.fillText('⭐ BUDAYA', 128, 175);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;

      const tileMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: this.boardTheme === 'candi' ? 0.8 : 0.5,
        metalness: 0.05
      });

      const tileMesh = new THREE.Mesh(tileMeshGeo, tileMat);
      tileMesh.position.set(pos.x, 0.06, pos.z);
      tileMesh.receiveShadow = true;
      tileMesh.castShadow = true;
      tileMesh.userData = { tileNum: num };
      this.tileMeshes.push(tileMesh);
      this.boardGroup.add(tileMesh);
    }

    this.scene.add(this.boardGroup);
  }

  // ------------------------------------------
  // Procedural 3D Ladders (Tangga Bambu)
  // ------------------------------------------
  initProceduralLadders() {
    this.laddersGroup = new THREE.Group();

    const bambooMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.4,
      metalness: 0.2
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.5
    });

    LADDERS.forEach(ladder => {
      const p1 = this.getTilePosition(ladder.base);
      const p2 = this.getTilePosition(ladder.top);

      // Elevation for 3D ladder look
      p1.y = 0.15;
      p2.y = 0.25;

      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      // Perpendicular vector for the two ladder rails
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(0.42);

      // Left and Right Rail Positions
      const leftStart = new THREE.Vector3().addVectors(p1, perp);
      const leftEnd = new THREE.Vector3().addVectors(p2, perp);
      const rightStart = new THREE.Vector3().subVectors(p1, perp);
      const rightEnd = new THREE.Vector3().subVectors(p2, perp);

      // Create Rail Cylinder Helper
      const createRail = (start, end) => {
        const railDir = new THREE.Vector3().subVectors(end, start);
        const railLen = railDir.length();
        const railMid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const railGeo = new THREE.CylinderGeometry(0.1, 0.1, railLen, 12);
        const railMesh = new THREE.Mesh(railGeo, bambooMat);
        railMesh.position.copy(railMid);
        railMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), railDir.clone().normalize());
        railMesh.castShadow = true;
        railMesh.userData = { isNeonable: true, neonColor: 0xfacc15, neonIntensity: 0.6 };
        return railMesh;
      };

      this.laddersGroup.add(createRail(leftStart, leftEnd));
      this.laddersGroup.add(createRail(rightStart, rightEnd));

      // Create Rungs (Anak Tangga)
      const numRungs = Math.max(3, Math.floor(len / 1.0));
      for (let i = 1; i <= numRungs; i++) {
        const t = i / (numRungs + 1);
        const rungLeft = new THREE.Vector3().lerpVectors(leftStart, leftEnd, t);
        const rungRight = new THREE.Vector3().lerpVectors(rightStart, rightEnd, t);
        const rungDir = new THREE.Vector3().subVectors(rungRight, rungLeft);
        const rungLen = rungDir.length();
        const rungMid = new THREE.Vector3().addVectors(rungLeft, rungRight).multiplyScalar(0.5);

        const rungGeo = new THREE.CylinderGeometry(0.08, 0.08, rungLen, 10);
        const rungMesh = new THREE.Mesh(rungGeo, jointMat);
        rungMesh.position.copy(rungMid);
        rungMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rungDir.clone().normalize());
        rungMesh.castShadow = true;
        rungMesh.userData = { isNeonable: true, neonColor: 0xf59e0b, neonIntensity: 0.7 };
        this.laddersGroup.add(rungMesh);
      }
    });

    this.scene.add(this.laddersGroup);
  }

  // ------------------------------------------
  // Procedural 3D Snakes (Ular Catmull-Rom)
  // ------------------------------------------
  initProceduralSnakes() {
    this.snakesGroup = new THREE.Group();

    // Procedural Snake Scale Pattern
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = 128;
    scaleCanvas.height = 128;
    const sCtx = scaleCanvas.getContext('2d');
    sCtx.fillStyle = '#15803d'; // Rich forest green
    sCtx.fillRect(0, 0, 128, 128);
    sCtx.fillStyle = '#facc15'; // Golden yellow spots
    for (let x = 0; x < 128; x += 32) {
      for (let y = 0; y < 128; y += 32) {
        sCtx.beginPath();
        sCtx.arc(x + 16, y + 16, 10, 0, Math.PI * 2);
        sCtx.fill();
      }
    }
    const snakeTexture = new THREE.CanvasTexture(scaleCanvas);
    snakeTexture.wrapS = THREE.RepeatWrapping;
    snakeTexture.wrapT = THREE.RepeatWrapping;
    snakeTexture.repeat.set(2, 16);

    const snakeBodyMat = new THREE.MeshStandardMaterial({
      map: snakeTexture,
      roughness: 0.35,
      metalness: 0.15
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const fangMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });

    SNAKES.forEach(snake => {
      const pHead = this.getTilePosition(snake.head);
      const pTail = this.getTilePosition(snake.tail);

      // Generate Natural 3D S-Curve with elevated points
      const points = [];
      const steps = 6;
      const dir = new THREE.Vector3().subVectors(pTail, pHead);
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pt = new THREE.Vector3().lerpVectors(pHead, pTail, t);
        // Arching height in 3D
        pt.y = 0.2 + Math.sin(t * Math.PI) * 2.2;
        // Lateral undulating wave
        const wave = Math.sin(t * Math.PI * 3) * 1.0;
        pt.addScaledVector(perp, wave);
        points.push(pt);
      }

      const curve = new THREE.CatmullRomCurve3(points);
      snake.curve = curve; // Saved for pawn sliding animation

      // Tube Body
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.3, 10, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, snakeBodyMat);
      tubeMesh.castShadow = true;
      tubeMesh.userData = { isNeonable: true, neonColor: 0x22c55e, neonIntensity: 0.7 };
      this.snakesGroup.add(tubeMesh);

      // Snake Head (At Head Tile)
      const headGroup = new THREE.Group();
      headGroup.position.copy(points[0]);
      headGroup.position.y += 0.35;

      const headGeo = new THREE.SphereGeometry(0.48, 16, 12);
      headGeo.scale(1, 0.7, 1.4);
      const headMesh = new THREE.Mesh(headGeo, snakeBodyMat);
      headMesh.castShadow = true;
      headMesh.userData = { isNeonable: true, neonColor: 0x22c55e, neonIntensity: 0.8 };
      headGroup.add(headMesh);

      // Two Fierce Eyes
      const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(0.24, 0.2, 0.25);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(-0.24, 0.2, 0.25);
      headGroup.add(eyeL);
      headGroup.add(eyeR);

      // Sharp White Fangs
      const fangGeo = new THREE.ConeGeometry(0.06, 0.25, 8);
      const fangL = new THREE.Mesh(fangGeo, fangMat);
      fangL.position.set(0.18, -0.2, 0.45);
      fangL.rotation.x = Math.PI;
      const fangR = new THREE.Mesh(fangGeo, fangMat);
      fangR.position.set(-0.18, -0.2, 0.45);
      fangR.rotation.x = Math.PI;
      headGroup.add(fangL);
      headGroup.add(fangR);

      // Orient head towards first segment
      const headLook = points[1].clone();
      headGroup.lookAt(headLook);
      this.snakesGroup.add(headGroup);
    });

    this.scene.add(this.snakesGroup);
  }

  // ------------------------------------------
  // Procedural 3D Rolling Dice
  // ------------------------------------------
  initProceduralDice() {
    this.diceGroup = new THREE.Group();

    // Create 6 Materials for Dice Faces (Pips 1 to 6)
    const materials = [];
    const facePips = [
      2, // +X face
      5, // -X face
      1, // +Y face (Top)
      6, // -Y face (Bottom)
      3, // +Z face
      4  // -Z face
    ];

    facePips.forEach(val => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      // Dice Face Background (Cherry Glossy Red)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 128, 128);

      // Outer Bevel Edge
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 120, 120);

      // White Indented Pips
      ctx.fillStyle = '#ffffff';
      const drawPip = (x, y) => {
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
      };

      const c = 64;
      const l = 34;
      const r = 94;

      if (val === 1) {
        drawPip(c, c);
      } else if (val === 2) {
        drawPip(l, l);
        drawPip(r, r);
      } else if (val === 3) {
        drawPip(l, l);
        drawPip(c, c);
        drawPip(r, r);
      } else if (val === 4) {
        drawPip(l, l);
        drawPip(r, l);
        drawPip(l, r);
        drawPip(r, r);
      } else if (val === 5) {
        drawPip(l, l);
        drawPip(r, l);
        drawPip(c, c);
        drawPip(l, r);
        drawPip(r, r);
      } else if (val === 6) {
        drawPip(l, 30);
        drawPip(l, c);
        drawPip(l, 98);
        drawPip(r, 30);
        drawPip(r, c);
        drawPip(r, 98);
      }

      const tex = new THREE.CanvasTexture(canvas);
      materials.push(
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.2,
          metalness: 0.1
        })
      );
    });

    const diceGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    this.diceMesh = new THREE.Mesh(diceGeo, materials);
    this.diceMesh.castShadow = true;
    this.diceMesh.receiveShadow = true;

    this.diceGroup.position.set(15, 1.0, 15);
    this.diceGroup.add(this.diceMesh);
    this.scene.add(this.diceGroup);
  }

  // ------------------------------------------
  // Procedural Textile / Batik Texture Generator (100% Canvas 2D)
  // ------------------------------------------
  createBatikTexture(motifId = 'polos', baseColorHex = '#ef4444') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base background with subtle cultural tone
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 256, 256);

    if (motifId === 'megamendung') {
      // Cirebon Mega Mendung layered clouds
      const cloudColors = ['#082f49', '#0284c7', '#38bdf8', '#bae6fd', '#ffffff'];
      for (let cy = 0; cy <= 256; cy += 64) {
        for (let cx = -32; cx <= 288; cx += 64) {
          const shift = (Math.floor(cy / 64) % 2) * 32;
          const x = cx + shift;
          const y = cy;
          for (let l = 4; l >= 0; l--) {
            const rad = 10 + l * 4.2;
            ctx.fillStyle = cloudColors[l];
            ctx.beginPath();
            ctx.arc(x, y, rad, Math.PI, 0);
            ctx.bezierCurveTo(x + rad, y + rad * 0.8, x + rad * 0.3, y + rad * 1.3, x, y + rad * 1.2);
            ctx.bezierCurveTo(x - rad * 0.3, y + rad * 1.3, x - rad, y + rad * 0.8, x - rad, y);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    } else if (motifId === 'kawung') {
      // Yogyakarta Kawung 4-lobed sacred oval flowers
      const step = 64;
      for (let y = 0; y <= 256; y += step) {
        for (let x = 0; x <= 256; x += step) {
          const petals = [
            { dx: 0, dy: -step * 0.28, rx: 11, ry: 18, rot: 0 },
            { dx: 0, dy: step * 0.28, rx: 11, ry: 18, rot: 0 },
            { dx: -step * 0.28, dy: 0, rx: 18, ry: 11, rot: 0 },
            { dx: step * 0.28, dy: 0, rx: 18, ry: 11, rot: 0 }
          ];
          petals.forEach(p => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(x + p.dx, y + p.dy, p.rx, p.ry, p.rot, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner golden accent dot
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(x + p.dx * 0.9, y + p.dy * 0.9, 3.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Center sacred diamond
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (motifId === 'songket') {
      // Palembang Royal Gold Brocade Lattice
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 2;
      const step = 32;
      ctx.beginPath();
      for (let i = -256; i <= 512; i += step) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 256, 256);
        ctx.moveTo(i, 256);
        ctx.lineTo(i + 256, 0);
      }
      ctx.stroke();

      // Golden florets at intersections
      for (let y = 0; y <= 256; y += step) {
        for (let x = 0; x <= 256; x += step) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (motifId === 'tenun') {
      // Toraja & Sumba Chevron Ikat
      const rowHeight = 32;
      for (let y = 0; y < 256; y += rowHeight) {
        const isAlt = (y / rowHeight) % 2 === 0;
        ctx.fillStyle = isAlt ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, y, 256, rowHeight);

        ctx.strokeStyle = isAlt ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= 256; x += 32) {
          ctx.moveTo(x, y + rowHeight);
          ctx.lineTo(x + 16, y);
          ctx.lineTo(x + 32, y + rowHeight);
        }
        ctx.stroke();
      }
    } else {
      // Polos: Subtle radial sheen
      const grad = ctx.createRadialGradient(90, 80, 10, 128, 128, 140);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // ------------------------------------------
  // Procedural Pawns (Bidak Pemain 3D dengan Aksesori & Motif Batik)
  // ------------------------------------------
  createPawnMesh(colorInt, index = 0, accessoryType = null, motifType = 'polos', colorHex = '#ef4444') {
    const pawnGroup = new THREE.Group();

    const batikTex = this.createBatikTexture(motifType, colorHex);
    const mat = new THREE.MeshStandardMaterial({
      color: colorInt,
      map: batikTex,
      roughness: motifType === 'polos' ? 0.2 : 0.4,
      metalness: motifType === 'songket' ? 0.55 : (motifType === 'polos' ? 0.4 : 0.25)
    });

    // Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.25, 16);
    const baseMesh = new THREE.Mesh(baseGeo, mat);
    baseMesh.position.y = 0.125;
    baseMesh.castShadow = true;
    baseMesh.userData = { isNeonable: true, neonColor: colorInt, neonIntensity: 0.5 };
    pawnGroup.add(baseMesh);

    // Tapered Body
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.5, 0.8, 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, mat);
    bodyMesh.position.y = 0.6;
    bodyMesh.castShadow = true;
    bodyMesh.userData = { isNeonable: true, neonColor: colorInt, neonIntensity: 0.7 };
    pawnGroup.add(bodyMesh);

    // Decorative Collar
    const ringGeo = new THREE.TorusGeometry(0.34, 0.08, 10, 20);
    const ringMesh = new THREE.Mesh(ringGeo, mat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 1.0;
    ringMesh.userData = { isNeonable: true, neonColor: colorInt, neonIntensity: 0.8 };
    pawnGroup.add(ringMesh);

    // Spherical Crown Head
    const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, mat);
    headMesh.position.y = 1.38;
    headMesh.castShadow = true;
    headMesh.userData = { isNeonable: true, neonColor: colorInt, neonIntensity: 0.8 };
    pawnGroup.add(headMesh);

    // Resolve Accessory Type & Motif
    const defaultTypes = ['mahkota', 'caping', 'udeng', 'peci', 'helm', 'cendrawasih'];
    const acc = accessoryType || defaultTypes[index % defaultTypes.length];
    pawnGroup.userData = { accessory: acc, motif: motifType };

    if (acc === 'mahkota') {
      // 1. Mahkota Emas Sultan (Kerajaan Nusantara)
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.15, metalness: 0.85 });
      const crownGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.24, 6);
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.y = 1.82;
      crownMesh.castShadow = true;
      pawnGroup.add(crownMesh);

      // 5 Crown Peaks (Pointed Spires)
      for (let p = 0; p < 5; p++) {
        const ang = (p / 5) * Math.PI * 2;
        const spireGeo = new THREE.ConeGeometry(0.08, 0.22, 5);
        const spireMesh = new THREE.Mesh(spireGeo, crownMat);
        spireMesh.position.set(Math.cos(ang) * 0.32, 1.95, Math.sin(ang) * 0.32);
        spireMesh.castShadow = true;
        pawnGroup.add(spireMesh);
      }

      // Ruby Red Front Gem
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x991b1b,
        emissiveIntensity: 0.6,
        roughness: 0.1
      });
      const gemMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), gemMat);
      gemMesh.position.set(0, 1.82, 0.34);
      pawnGroup.add(gemMesh);

    } else if (acc === 'caping') {
      // 2. Caping Petani Bambu Nusantara
      const capingMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55, metalness: 0.1 });
      const capingGeo = new THREE.ConeGeometry(0.68, 0.32, 20);
      const capingMesh = new THREE.Mesh(capingGeo, capingMat);
      capingMesh.position.y = 1.76;
      capingMesh.castShadow = true;
      pawnGroup.add(capingMesh);

      // Center Pinnacle Knot
      const knotMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
      const knotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), knotMat);
      knotMesh.position.set(0, 1.94, 0);
      pawnGroup.add(knotMesh);

      // Under-brim bamboo ring
      const underRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 20), knotMat);
      underRing.rotation.x = Math.PI / 2;
      underRing.position.y = 1.62;
      pawnGroup.add(underRing);

    } else if (acc === 'udeng') {
      // 3. Udeng / Ikat Kepala Pendekar Silat
      const udengMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      const bandGeo = new THREE.TorusGeometry(0.44, 0.09, 8, 20);
      const bandMesh = new THREE.Mesh(bandGeo, udengMat);
      bandMesh.rotation.x = Math.PI / 2;
      bandMesh.position.y = 1.54;
      pawnGroup.add(bandMesh);

      // Folded Udeng Wing / Knot Flaps at Side
      const wingGeo = new THREE.BoxGeometry(0.16, 0.26, 0.06);
      const wingMesh1 = new THREE.Mesh(wingGeo, udengMat);
      wingMesh1.position.set(0.38, 1.58, -0.15);
      wingMesh1.rotation.set(0.3, 0.2, -0.4);
      pawnGroup.add(wingMesh1);

      const wingMesh2 = new THREE.Mesh(wingGeo, udengMat);
      wingMesh2.position.set(0.42, 1.64, -0.08);
      wingMesh2.rotation.set(0.2, 0.4, -0.6);
      pawnGroup.add(wingMesh2);

    } else if (acc === 'peci') {
      // 4. Peci Songkok Hitam Nusantara
      const peciMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.05 });
      const peciGeo = new THREE.CylinderGeometry(0.38, 0.40, 0.34, 20);
      const peciMesh = new THREE.Mesh(peciGeo, peciMat);
      peciMesh.scale.set(1.0, 1.0, 0.82); // Oblong shape typical of Indonesian peci
      peciMesh.position.y = 1.72;
      peciMesh.castShadow = true;
      pawnGroup.add(peciMesh);

      // Subtle Gold Trim Accent
      const goldTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.39, 0.025, 6, 20),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.8 })
      );
      goldTrim.rotation.x = Math.PI / 2;
      goldTrim.scale.set(1.0, 0.82, 1.0);
      goldTrim.position.y = 1.58;
      pawnGroup.add(goldTrim);

    } else if (acc === 'helm') {
      // 5. Helm Ksatria Perunggu Majapahit
      const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.25, metalness: 0.85 });
      const helmGeo = new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
      const helmMesh = new THREE.Mesh(helmGeo, bronzeMat);
      helmMesh.position.y = 1.58;
      helmMesh.castShadow = true;
      pawnGroup.add(helmMesh);

      // Top Dorsal Ridge Crest
      const crestGeo = new THREE.BoxGeometry(0.07, 0.28, 0.65);
      const crestMesh = new THREE.Mesh(crestGeo, bronzeMat);
      crestMesh.position.set(0, 1.84, 0);
      crestMesh.castShadow = true;
      pawnGroup.add(crestMesh);

      // Cheek Guard Flaps
      const cheekGeo = new THREE.BoxGeometry(0.08, 0.24, 0.18);
      const cheekL = new THREE.Mesh(cheekGeo, bronzeMat);
      cheekL.position.set(0.42, 1.45, 0.08);
      pawnGroup.add(cheekL);
      const cheekR = new THREE.Mesh(cheekGeo, bronzeMat);
      cheekR.position.set(-0.42, 1.45, 0.08);
      pawnGroup.add(cheekR);

    } else if (acc === 'cendrawasih') {
      // 6. Mahkota Hias Bulu Kasuari & Papua
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
      const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.10, 16), bandMat);
      bandMesh.position.y = 1.55;
      pawnGroup.add(bandMesh);

      // 3 Multi-colored Feather Plumes (Emerald, Gold, Crimson)
      const plumeColors = [0x10b981, 0xf59e0b, 0xef4444];
      const plumeRotations = [-0.18, 0.0, 0.18];
      const plumeX = [-0.16, 0.0, 0.16];

      for (let i = 0; i < 3; i++) {
        const plumeMat = new THREE.MeshStandardMaterial({ color: plumeColors[i], roughness: 0.3 });
        const plumeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.52, 6), plumeMat);
        plumeMesh.position.set(plumeX[i], 1.88, 0.18);
        plumeMesh.rotation.z = plumeRotations[i];
        plumeMesh.rotation.x = -0.15;
        plumeMesh.castShadow = true;
        pawnGroup.add(plumeMesh);
      }
    }

    return pawnGroup;
  }

  // ------------------------------------------
  // 3D Procedural Emote & Speech Bubble System
  // ------------------------------------------
  createEmoteTexture(text, borderColor = '#fbbf24') {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    // Rounded speech bubble geometry
    const x = 14, y = 10, w = 352, h = 88, r = 26;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    // Pointer tail pointing down towards pawn head
    ctx.lineTo(x + w / 2 + 18, y + h);
    ctx.lineTo(x + w / 2, y + h + 30);
    ctx.lineTo(x + w / 2 - 18, y + h);

    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    // Semi-transparent deep glassmorphic body
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fill();

    // Vibrant accent border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw Emoji & Bold Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 190, 52);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  triggerPawnEmote(player, text, borderColor = '#fbbf24', duration = 2400) {
    if (!player || !player.mesh) return;

    // Remove any currently active emote on this pawn
    const existingIdx = this.activeEmotes.findIndex(e => e.player === player);
    if (existingIdx !== -1) {
      const old = this.activeEmotes[existingIdx];
      player.mesh.remove(old.sprite);
      if (old.sprite.material.map) old.sprite.material.map.dispose();
      old.sprite.material.dispose();
      this.activeEmotes.splice(existingIdx, 1);
    }

    const texture = this.createEmoteTexture(text, borderColor);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.0,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    const aspect = 140 / 380;
    const baseWidth = 3.2;

    sprite.position.set(0, 2.35, 0);
    sprite.scale.set(0.01, 0.01, 1);

    player.mesh.add(sprite);
    audio.playEmotePop();

    this.activeEmotes.push({
      player,
      sprite,
      startTime: performance.now(),
      duration,
      baseY: 2.35,
      baseWidth,
      baseHeight: baseWidth * aspect
    });
  }

  // Multi-Dialek Voice Synthesizer & Speech Banter (v2.2.0)
  speakDialect(player, eventType) {
    if (!player) return;
    const dialectId = player.dialect || 'jawa';
    const dialectObj = NUSANTARA_DIALECTS.find(d => d.id === dialectId) || NUSANTARA_DIALECTS[0];
    const dialectPhrases = DIALECT_BANTER[dialectId] || DIALECT_BANTER.jawa;
    const phrases = dialectPhrases[eventType] || dialectPhrases.WIN;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    // 1. Trigger 3D speech bubble above pawn head
    this.triggerPawnEmote(player, phrase, player.colorHex, 2800);

    // 2. Synthesize voice speech with Indonesian phonetic utterance
    if (this.voiceEnabled && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const cleanText = phrase.replace(/[^\w\s,!?]/gi, '').trim();
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = 'id-ID';
        utter.pitch = dialectObj.pitch;
        utter.rate = dialectObj.rate;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  }

  // Setup Players
  setupPlayers(playerConfigs) {
    if (!playerConfigs || playerConfigs.length === 0) {
      playerConfigs = [
        { name: 'Pemain 1', isAI: false, accessory: 'mahkota', motif: 'megamendung', dialect: 'jawa' },
        { name: 'Si Bot Pintar', isAI: true, accessory: 'caping', motif: 'kawung', dialect: 'sunda' }
      ];
    }

    // Clear active emotes
    this.activeEmotes.forEach(e => {
      if (e.player && e.player.mesh) e.player.mesh.remove(e.sprite);
      if (e.sprite.material.map) e.sprite.material.map.dispose();
      e.sprite.material.dispose();
    });
    this.activeEmotes = [];

    // Remove existing pawn meshes
    this.players.forEach(p => {
      if (p.shieldMesh) p.mesh.remove(p.shieldMesh);
      if (p.mesh) this.scene.remove(p.mesh);
    });

    this.players = playerConfigs.map((cfg, index) => {
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      const motif = cfg.motif || this.playerMotifs[index] || 'polos';
      const dialect = cfg.dialect || this.playerDialects[index] || NUSANTARA_DIALECTS[index % NUSANTARA_DIALECTS.length].id;
      const mesh = this.createPawnMesh(color.int, index, cfg.accessory, motif, color.hex);
      this.scene.add(mesh);

      return {
        id: index,
        name: cfg.name,
        isAI: cfg.isAI,
        colorHex: color.hex,
        tile: 1,
        mesh: mesh,
        accessory: cfg.accessory || mesh.userData.accessory,
        motif: motif,
        dialect: dialect,
        hasShield: false,
        shieldMesh: null
      };
    });

    this.currentTurn = 0;
    this.updatePawnPositions(false);
    this.updateHUD();
    this.showToast(`Permainan Dimulai! Giliran ${this.players[0].name}.`);
  }

  // ------------------------------------------
  // Power-Up: Tameng Bambu Sakti
  // ------------------------------------------
  giveBambooShield(player) {
    if (!player || !player.mesh) return;
    if (player.hasShield && player.shieldMesh) {
      player.mesh.remove(player.shieldMesh);
    }
    player.hasShield = true;
    this.recordStat('shieldsUsed', 1);

    // 3D Emerald Energy Torus Ring around pawn
    const shieldGeo = new THREE.TorusGeometry(0.72, 0.09, 12, 28);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.rotation.x = Math.PI / 2;
    shieldMesh.position.y = 0.65;
    player.mesh.add(shieldMesh);
    player.shieldMesh = shieldMesh;

    this.showToast(`🛡️ ${player.name} mendapatkan Tameng Bambu Sakti! Kebal dari 1 gigitan ular!`);
    this.addHistoryLog(`🛡️ <span style="color:${player.colorHex}">${player.name}</span> aktifkan <strong>Tameng Bambu</strong>!`);
    this.triggerPawnEmote(player, 'Tameng Aktif! 🛡️', '#10b981');
    audio.playMysterySound();
  }

  // ------------------------------------------
  // Kartu Budaya Nusantara & Trivia Modal Flow
  // ------------------------------------------
  handleCultureCard(player) {
    return new Promise(resolve => {
      audio.playMysterySound();
      this.addHistoryLog(`⭐ <span style="color:${player.colorHex}">${player.name}</span> mendarat di <strong>Petak Budaya</strong>!`);

      // Event probability:
      // ~25% Tameng Bambu (if not yet holding shield)
      // ~20% Angin Muson (+2 langkah)
      // ~55% Trivia Budaya Nusantara
      const roll = Math.random();

      if (roll < 0.25 && !player.hasShield) {
        this.giveBambooShield(player);
        resolve();
      } else if (roll < 0.45) {
        this.showToast(`🦅 Angin Muson Nusantara berhembus kencang! Maju 2 langkah!`);
        this.triggerPawnEmote(player, 'Angin Muson! 🦅', '#38bdf8');
        const targetTile = Math.min(100, player.tile + 2);
        (async () => {
          for (let t = player.tile + 1; t <= targetTile; t++) {
            await this.hopPawnToTile(player, t);
            player.tile = t;
            this.updateHUD();
          }
          resolve();
        })();
      } else {
        // Trivia Question Modal
        const qIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
        const trivia = TRIVIA_QUESTIONS[qIndex];

        const modal = document.getElementById('modal-trivia');
        const subTitle = document.getElementById('trivia-player-sub');
        const qText = document.getElementById('trivia-question-text');
        const optsContainer = document.getElementById('trivia-options-container');
        const feedbackBox = document.getElementById('trivia-feedback-box');
        const continueBtn = document.getElementById('btn-trivia-continue');

        subTitle.innerText = `Giliran: ${player.name} ${player.isAI ? '(Bot AI)' : ''}`;
        qText.innerText = trivia.q;
        optsContainer.innerHTML = '';
        feedbackBox.style.display = 'none';
        continueBtn.style.display = 'none';

        if (player.isAI) {
          modal.classList.add('open');
          trivia.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'trivia-option-btn';
            btn.disabled = true;
            btn.innerHTML = `<span>${String.fromCharCode(65 + idx)}.</span> <span>${opt}</span>`;
            optsContainer.appendChild(btn);
          });

          // Bot thinks for 1.2s then picks
          setTimeout(async () => {
            const isCorrect = Math.random() < 0.75;
            const chosen = isCorrect ? trivia.answer : (trivia.answer + 1) % trivia.options.length;
            const buttons = optsContainer.querySelectorAll('.trivia-option-btn');
            buttons[chosen].classList.add(isCorrect ? 'correct' : 'wrong');
            buttons[trivia.answer].classList.add('correct');

            feedbackBox.style.display = 'block';
            if (isCorrect) {
              audio.playTriviaCorrect();
              feedbackBox.style.background = 'rgba(16, 185, 129, 0.15)';
              feedbackBox.style.color = '#34d399';
              feedbackBox.innerHTML = `<strong>Jawaban AI Benar!</strong> ${trivia.info} (+2 Langkah)`;
              this.recordStat('triviaCorrect', 1);
              this.triggerPawnEmote(player, 'Benar! 🎯', '#10b981');
            } else {
              audio.playTriviaWrong();
              feedbackBox.style.background = 'rgba(239, 68, 68, 0.15)';
              feedbackBox.style.color = '#f87171';
              feedbackBox.innerHTML = `<strong>Jawaban AI Kurang Tepat!</strong> ${trivia.info}`;
              this.triggerPawnEmote(player, 'Salah! 😅', '#ef4444');
            }

            setTimeout(async () => {
              modal.classList.remove('open');
              if (isCorrect) {
                const target = Math.min(100, player.tile + 2);
                for (let t = player.tile + 1; t <= target; t++) {
                  await this.hopPawnToTile(player, t);
                  player.tile = t;
                  this.updateHUD();
                }
              }
              resolve();
            }, 1800);
          }, 1200);
        } else {
          modal.classList.add('open');
          let answered = false;

          trivia.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'trivia-option-btn';
            btn.innerHTML = `<span>${String.fromCharCode(65 + idx)}.</span> <span>${opt}</span>`;
            btn.addEventListener('click', async () => {
              if (answered) return;
              answered = true;

              const isCorrect = idx === trivia.answer;
              btn.classList.add(isCorrect ? 'correct' : 'wrong');
              if (!isCorrect) {
                optsContainer.querySelectorAll('.trivia-option-btn')[trivia.answer].classList.add('correct');
              }

              feedbackBox.style.display = 'block';
              if (isCorrect) {
                audio.playTriviaCorrect();
                feedbackBox.style.background = 'rgba(16, 185, 129, 0.15)';
                feedbackBox.style.color = '#34d399';
                feedbackBox.innerHTML = `<strong>Hebat, Jawabanmu Benar! 🎉</strong><br>${trivia.info}<br><em>Bonus: Maju 2 Langkah Ekstra!</em>`;
                this.recordStat('triviaCorrect', 1);
                this.triggerPawnEmote(player, 'Pintar! 🧠', '#10b981');
              } else {
                audio.playTriviaWrong();
                feedbackBox.style.background = 'rgba(239, 68, 68, 0.15)';
                feedbackBox.style.color = '#f87171';
                feedbackBox.innerHTML = `<strong>Kurang Tepat! 😊</strong><br>${trivia.info}`;
                this.triggerPawnEmote(player, 'Belajar Lagi! 📖', '#f59e0b');
              }

              continueBtn.style.display = 'block';
              continueBtn.onclick = async () => {
                modal.classList.remove('open');
                if (isCorrect) {
                  const target = Math.min(100, player.tile + 2);
                  for (let t = player.tile + 1; t <= target; t++) {
                    await this.hopPawnToTile(player, t);
                    player.tile = t;
                    this.updateHUD();
                  }
                }
                resolve();
              };
            });
            optsContainer.appendChild(btn);
          });
        }
      }
    });
  }

  // Position Multi-Pawns without clipping
  updatePawnPositions(animated = true) {
    const tileGroups = new Map();
    this.players.forEach(p => {
      if (!tileGroups.has(p.tile)) {
        tileGroups.set(p.tile, []);
      }
      tileGroups.get(p.tile).push(p);
    });

    tileGroups.forEach((pawnsOnTile, tile) => {
      const center = this.getTilePosition(tile);
      const count = pawnsOnTile.length;
      const offsetRadius = count > 1 ? 0.48 : 0.0;

      pawnsOnTile.forEach((player, i) => {
        const angle = (i / count) * Math.PI * 2;
        const targetX = center.x + Math.cos(angle) * offsetRadius;
        const targetZ = center.z + Math.sin(angle) * offsetRadius;
        const targetY = center.y;

        if (!animated) {
          player.mesh.position.set(targetX, targetY, targetZ);
        }
      });
    });
  }

  // ------------------------------------------
  // Core Gameplay Logic: Roll & Move
  // ------------------------------------------
  rollDice() {
    if (this.isRolling || this.isMoving) return;
    if (this.isOnlineGame && this.currentTurn !== this.myPlayerIndex) {
      this.showToast('Bukan giliran Anda! Menunggu lawan melempar...');
      return;
    }
    this.isRolling = true;

    audio.playDiceRoll();

    // Roll Result: 1 to 6
    const rollValue = Math.floor(Math.random() * 6) + 1;

    // If Online, broadcast roll action to room clients
    if (this.isOnlineGame) {
      this.sendRoomAction({ type: 'DICE_ROLL', playerIndex: this.myPlayerIndex, rollValue });
    }

    const rollBtn = document.getElementById('btn-roll');
    rollBtn.disabled = true;

    // Dice Physics Rotation Targets
    const targetEuler = new THREE.Euler();
    switch (rollValue) {
      case 1: targetEuler.set(0, 0, 0); break;
      case 6: targetEuler.set(Math.PI, 0, 0); break;
      case 2: targetEuler.set(0, 0, -Math.PI / 2); break;
      case 5: targetEuler.set(0, 0, Math.PI / 2); break;
      case 3: targetEuler.set(Math.PI / 2, 0, 0); break;
      case 4: targetEuler.set(-Math.PI / 2, 0, 0); break;
    }

    // Dynamic Dice Jump & Tumble Animation
    const currentPlayer = this.players[this.currentTurn];
    const playerTilePos = this.getTilePosition(currentPlayer.tile);

    // Place dice near current player's tile
    const startX = playerTilePos.x + (Math.random() - 0.5) * 4;
    const startZ = playerTilePos.z + 3;
    this.diceGroup.position.set(startX, 1.2, startZ);

    const duration = 1000;
    const startTime = performance.now();

    const animateDice = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Arc bounce
      this.diceGroup.position.y = 1.0 + Math.sin(progress * Math.PI) * 4.5;

      // Tumbling rotation
      this.diceMesh.rotation.x += 0.35 * (1 - progress * 0.7);
      this.diceMesh.rotation.y += 0.45 * (1 - progress * 0.7);
      this.diceMesh.rotation.z += 0.25 * (1 - progress * 0.7);

      if (progress < 1) {
        requestAnimationFrame(animateDice);
      } else {
        // Snap to exact face rotation
        this.diceGroup.position.y = 1.0;
        this.diceMesh.rotation.copy(targetEuler);
        this.onDiceLanded(rollValue);
      }
    };

    requestAnimationFrame(animateDice);
  }

  onDiceLanded(rollValue) {
    this.isRolling = false;
    document.getElementById('dice-value-display').innerText = rollValue;
    const player = this.players[this.currentTurn];

    if (rollValue === 6) {
      this.recordStat('sixRolls', 1);
      this.triggerPawnEmote(player, 'Hoki 6! 🔥', '#ef4444');
    }

    this.showToast(`${player.name} mendapat angka ${rollValue}!`);
    this.addHistoryLog(`🎲 <span style="color:${player.colorHex};font-weight:700;">${player.name}</span> melempar <strong>${rollValue}</strong>`);
    this.movePlayer(player, rollValue);
  }

  // Move Pawn Step-by-Step with Hopping Animation
  async movePlayer(player, rollSteps) {
    this.isMoving = true;
    let targetTile = player.tile + rollSteps;

    // Classic Indonesian Bounce-Back Rule if over 100
    let stepsList = [];
    if (targetTile <= 100) {
      for (let t = player.tile + 1; t <= targetTile; t++) {
        stepsList.push(t);
      }
    } else {
      // Step forward to 100, then bounce backward
      for (let t = player.tile + 1; t <= 100; t++) {
        stepsList.push(t);
      }
      const excess = targetTile - 100;
      for (let b = 1; b <= excess; b++) {
        stepsList.push(100 - b);
      }
      this.showToast('⚠️ Angka Berlebih! Memantul mundur dari 100!');
      this.triggerPawnEmote(player, 'Yah Balik! 🔄', '#f97316');
      audio.playBounceBack();
    }

    // Step-by-step Hop Animation
    for (const nextTile of stepsList) {
      await this.hopPawnToTile(player, nextTile);
      player.tile = nextTile;
      this.updateHUD();
    }

    // Check Ladders or Snakes
    await this.checkSpecialTiles(player);

    this.isMoving = false;

    // Check Victory
    if (player.tile === 100) {
      this.handleVictory(player);
      return;
    }

    // Extra Roll handling (Petak Dadu Ganda)
    if (this.hasExtraRoll) {
      this.hasExtraRoll = false;
      this.isMoving = false;
      this.showToast(`⚡ Giliran Bonus! ${player.name} melempar dadu sekali lagi!`);
      if (player.isAI) {
        setTimeout(() => this.rollDice(), 1200);
      } else {
        document.getElementById('btn-roll').disabled = false;
      }
      return;
    }

    // Next Turn
    this.nextTurn();
  }

  // Hop animation between single adjacent tiles
  hopPawnToTile(player, tileNum) {
    return new Promise((resolve) => {
      const startPos = player.mesh.position.clone();
      const endPos = this.getTilePosition(tileNum);
      const duration = 260 / (this.gameSpeed || 1);
      const startTime = performance.now();

      audio.playPop(380 + Math.random() * 80, 0.08);

      const hopStep = (now) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);

        player.mesh.position.x = THREE.MathUtils.lerp(startPos.x, endPos.x, p);
        player.mesh.position.z = THREE.MathUtils.lerp(startPos.z, endPos.z, p);
        
        // Parabolic Hop Arc
        const yArc = Math.sin(p * Math.PI);
        player.mesh.position.y = startPos.y + yArc * 1.5;
        
        // Spin rotation
        player.mesh.rotation.y = (p * Math.PI * 2);

        // Squash and stretch animation
        if (p < 0.2) {
            player.mesh.scale.set(1.2, 0.8, 1.2); // Takeoff squash
        } else if (p < 0.8) {
            const stretchY = 1.0 + yArc * 0.4;
            const squashXZ = 1.0 - yArc * 0.2;
            player.mesh.scale.set(squashXZ, stretchY, squashXZ); // Mid-air stretch
        } else {
            const landingP = (p - 0.8) / 0.2;
            const squashY = 0.8 + (landingP * 0.2);
            const stretchXZ = 1.2 - (landingP * 0.2);
            player.mesh.scale.set(stretchXZ, squashY, stretchXZ); // Landing squash
        }

        if (p < 1) {
          requestAnimationFrame(hopStep);
        } else {
          player.mesh.position.copy(endPos);
          player.mesh.scale.set(1, 1, 1);
          player.mesh.rotation.y = 0;
          this.createLandingSparks(endPos, player.colorInt || 0xffffff);
          resolve();
        }
      };

      requestAnimationFrame(hopStep);
    });
  }

  // Check and animate Ladder Climb, Snake Slide, or Mystery Tile
  async checkSpecialTiles(player) {
    const ladder = LADDERS.find(l => l.base === player.tile);
    const snake = SNAKES.find(s => s.head === player.tile);
    const mystery = MYSTERY_TILES.find(m => m.tile === player.tile);
    const isCulture = CULTURE_TILES.includes(player.tile);

    if (snake) {
      if (player.hasShield) {
        audio.playShieldBlock();
        this.showToast(`🛡️ Sakti! Tameng Bambu menangkis gigitan ular! ${player.name} tetap aman di petak ${player.tile}!`);
        this.triggerPawnEmote(player, 'Kebal Ular! 🛡️', '#10b981');
        this.addHistoryLog(`🛡️ <span style="color:${player.colorHex}">${player.name}</span> menangkis ular dengan Tameng Bambu!`);
        if (player.shieldMesh) {
          player.mesh.remove(player.shieldMesh);
          player.shieldMesh.geometry.dispose();
          player.shieldMesh.material.dispose();
          player.shieldMesh = null;
        }
        player.hasShield = false;
        return;
      }

      this.recordStat('totalSnakes', 1);
      this.showToast(`🐍 Awas! ${player.name} digigit ular meluncur ke petak ${snake.tail}!`);
      this.triggerPawnEmote(player, 'Aduh Ular! 😱', '#ef4444');
      audio.playSnakeSlide();
      this.addHistoryLog(`🐍 <span style="color:${player.colorHex}">${player.name}</span> digigit ular ke <strong>${snake.tail}</strong>!`);

      // Slide down along snake curve
      if (snake.curve) {
        await this.slideAlongCurve(player.mesh, snake.curve, 1400);
      } else {
        const startPos = this.getTilePosition(snake.head);
        const endPos = this.getTilePosition(snake.tail);
        await this.smoothTravel(player.mesh, startPos, endPos, 1200, 0.5);
      }
      player.tile = snake.tail;
      this.updateHUD();
    } else if (ladder) {
      this.recordStat('totalLadders', 1);
      this.showToast(`🪜 Hebat! ${player.name} memanjat tangga ke petak ${ladder.top}!`);
      this.triggerPawnEmote(player, 'Asik Naik! 🚀', '#10b981');
      audio.playLadderClimb();
      this.addHistoryLog(`🪜 <span style="color:${player.colorHex}">${player.name}</span> naik tangga ke <strong>${ladder.top}</strong>!`);

      // Smooth climb along ladder
      const startPos = this.getTilePosition(ladder.base);
      const endPos = this.getTilePosition(ladder.top);
      await this.smoothTravel(player.mesh, startPos, endPos, 1200, 2.5);
      player.tile = ladder.top;
      this.updateHUD();
    } else if (isCulture) {
      await this.handleCultureCard(player);
    } else if (mystery) {
      this.addHistoryLog(`${mystery.label} <span style="color:${player.colorHex}">${player.name}</span>`);
      if (mystery.type === 'BONUS') {
        this.showToast(`🎁 ${mystery.desc}`);
        this.triggerPawnEmote(player, 'Berkah! 🎁', '#8b5cf6');
        audio.playMysterySound();
        const targetTile = Math.min(100, player.tile + mystery.steps);
        for (let t = player.tile + 1; t <= targetTile; t++) {
          await this.hopPawnToTile(player, t);
          player.tile = t;
          this.updateHUD();
        }
      } else if (mystery.type === 'ZONK') {
        this.showToast(`🌀 ${mystery.desc}`);
        this.triggerPawnEmote(player, 'Kena Zonk! 🌀', '#dc2626');
        audio.playZonkSound();
        const targetTile = Math.max(1, player.tile + mystery.steps);
        for (let t = player.tile - 1; t >= targetTile; t--) {
          await this.hopPawnToTile(player, t);
          player.tile = t;
          this.updateHUD();
        }
      } else if (mystery.type === 'EXTRA_ROLL') {
        this.showToast(`⚡ ${mystery.desc}`);
        this.triggerPawnEmote(player, 'Gas Lagi! ⚡', '#eab308');
        audio.playMysterySound();
        this.hasExtraRoll = true;
      }
    }

    this.updatePawnPositions(false);
  }

  smoothTravel(mesh, startPos, endPos, duration, archHeight = 1.0) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const travel = (now) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        mesh.position.lerpVectors(startPos, endPos, p);
        mesh.position.y += Math.sin(p * Math.PI) * archHeight;
        
        // Wobble left and right while climbing
        mesh.rotation.z = Math.sin(p * Math.PI * 6) * 0.15;
        mesh.rotation.x = Math.cos(p * Math.PI * 6) * 0.15;
        
        if (p < 1) {
          requestAnimationFrame(travel);
        } else {
          mesh.position.copy(endPos);
          mesh.rotation.set(0, 0, 0);
          resolve();
        }
      };
      requestAnimationFrame(travel);
    });
  }

  slideAlongCurve(mesh, curve, duration) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const slide = (now) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        const point = curve.getPointAt(p);
        mesh.position.copy(point);
        mesh.position.y += 0.35; // Hover over snake spine
        
        // Spin wildly while sliding down
        mesh.rotation.y = p * Math.PI * 10;
        mesh.rotation.z = Math.sin(p * Math.PI * 8) * 0.2;

        if (p < 1) {
          requestAnimationFrame(slide);
        } else {
          mesh.rotation.y = 0;
          mesh.rotation.z = 0;
          resolve();
        }
      };
      requestAnimationFrame(slide);
    });
  }

  // Next Player Turn
  nextTurn() {
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    this.updateHUD();

    if (this.isOnlineGame) {
      this.syncOnlineTurnButtons();
      return;
    }

    const nextPlayer = this.players[this.currentTurn];
    const rollBtn = document.getElementById('btn-roll');

    if (nextPlayer.isAI) {
      rollBtn.disabled = true;
      this.showToast(`Giliran ${nextPlayer.name} (Bot AI)...`);

      // 40% chance of spontaneous AI banter emote
      if (Math.random() < 0.4) {
        const aiQuotes = [
          'Giliranku nih! 😎',
          'Bismillah dadu 6 🤲',
          'Target: Petak 100! 🎯',
          'Jangan kedip ya! 🔥',
          'Semoga gak kena ular! 🐍'
        ];
        const q = aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
        this.triggerPawnEmote(nextPlayer, q, nextPlayer.colorHex);
      }

      // Automated AI move delay
      setTimeout(() => {
        this.rollDice();
      }, 1200);
    } else {
      rollBtn.disabled = false;
      this.showToast(`Giliran ${nextPlayer.name}! Silakan kocok dadu.`);
    }
  }

  // Victory Celebration
  handleVictory(winner) {
    audio.playWinFanfare();
    this.recordStat('gamesPlayed', 1);
    if (winner.isAI) {
      this.recordStat('botWins', 1);
    } else {
      this.recordStat('p1Wins', 1);
      if (this.isExpeditionMode) {
        this.recordStat('expeditionsCompleted', 1);
      }
    }
    this.triggerPawnEmote(winner, 'Jawara 1! 👑', '#fbbf24', 6000);
    this.spawnConfetti();

    // Turnamen Piala Raja Resolution
    if (this.isTournamentMode) {
      if (this.tournamentRound === 'semifinal') {
        if (!winner.isAI) {
          this.tournamentBracket.sf1.winner = winner.name;
          this.tournamentBracket.sf1.status = 'done';
          this.tournamentBracket.sf2.winner = this.tourBots[1].name;
          this.tournamentBracket.sf2.status = 'done';
          this.tournamentBracket.final.p1 = winner.name;
          this.tournamentBracket.final.p2 = this.tourBots[1].name;
          this.tournamentBracket.final.status = 'ready';
          this.showToast(`🏆 Kemenangan Semifinal! Bersiap untuk Grand Final!`);
          setTimeout(() => {
            this.showTournamentBracketModal('sf_win');
          }, 1800);
          return;
        } else {
          this.tournamentBracket.sf1.winner = winner.name;
          this.tournamentBracket.sf1.status = 'done';
          this.tournamentBracket.sf2.winner = this.tourBots[1].name;
          this.tournamentBracket.sf2.status = 'done';
          this.tournamentBracket.final.p1 = winner.name;
          this.tournamentBracket.final.p2 = this.tourBots[1].name;
          this.showToast(`Gugur di Semifinal... Coba lagi!`);
          setTimeout(() => {
            this.showTournamentBracketModal('sf_lost');
          }, 1800);
          return;
        }
      } else if (this.tournamentRound === 'final') {
        if (!winner.isAI) {
          this.recordStat('tournamentsWon', 1);
          this.tournamentBracket.final.winner = winner.name;
          this.tournamentBracket.final.status = 'champion';
          audio.playRoyalFanfare();
          this.showToast(`👑 SANG JUARA PIALA RAJA NUSANTARA! 🏆`);
          // Grand Fireworks
          for(let i=1; i<=4; i++) setTimeout(() => this.spawnConfetti(), i * 600);
          setTimeout(() => {
            this.showTournamentBracketModal('final_win');
          }, 1800);
          return;
        } else {
          this.tournamentBracket.final.winner = winner.name;
          this.tournamentBracket.final.status = 'done';
          this.showToast(`Juara 2 (Runner-Up) Piala Raja!`);
          setTimeout(() => {
            this.showTournamentBracketModal('final_lost');
          }, 1800);
          return;
        }
      }
    }

    const winnerAnnounceEl = document.getElementById('winner-announcement');
    if (this.isExpeditionMode && !winner.isAI) {
      const exp = EXPEDITIONS.find(e => e.id === this.currentExpedition) || EXPEDITIONS[0];
      const expIndex = EXPEDITIONS.findIndex(e => e.id === this.currentExpedition);
      
      if (expIndex >= this.expeditionLevel) {
        this.expeditionLevel = Math.min(EXPEDITIONS.length - 1, expIndex + 1);
        localStorage.setItem('expeditionLevel', this.expeditionLevel);
      }
      
      const nextExp = EXPEDITIONS[this.expeditionLevel];
      
      if (expIndex === EXPEDITIONS.length - 1) {
        winnerAnnounceEl.innerHTML = `🎉 <b>${winner.name}</b> Berhasil Menaklukkan Seluruh Nusantara! 🗺️`;
        this.showToast(`Lencana "Penakluk Nusantara" Terbuka!`);
        this.recordStat('tournamentsWon', 1); // as placeholder for badge
      } else {
        winnerAnnounceEl.innerHTML = `🎉 <b>${winner.name}</b> Menaklukkan <b>${exp.name}</b>! ${exp.icon}<br><br>
        <button id="btn-next-expedition" class="action-btn" style="margin-top:15px; font-size:1.1rem; padding: 12px 24px;">Lanjutkan ke ${nextExp.name} ${nextExp.icon}</button>`;
        setTimeout(() => {
          document.getElementById('btn-next-expedition')?.addEventListener('click', () => {
             this.currentExpedition = nextExp.id;
             document.getElementById('modal-winner').classList.remove('open');
             this.setupPlayers([
               { name: winner.name, isAI: false, accessory: winner.accessory, motif: winner.motif },
               { name: 'Penjaga ' + nextExp.name, isAI: true, accessory: 'caping', motif: 'polos' }
             ]);
             this.isExpeditionMode = true;
          });
        }, 100);
      }
      this.showToast(`Tahap Ekspedisi ${exp.name} Selesai!`);
    } else {
      winnerAnnounceEl.innerText = `${winner.name} keluar sebagai Juara Ular Tangga 3D!`;
    }
    document.getElementById('modal-winner').classList.add('open');
  }

  spawnConfetti() {
    const confettiColors = [0xf59e0b, 0xef4444, 0x10b981, 0x3b82f6, 0xec4899, 0xffffff];
    const confGeo = new THREE.PlaneGeometry(0.35, 0.35);

    for (let i = 0; i < 180; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(confGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        15 + Math.random() * 10,
        (Math.random() - 0.5) * 16
      );
      mesh.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        -0.08 - Math.random() * 0.1,
        (Math.random() - 0.5) * 0.1
      );
      mesh.rotSpeed = new THREE.Vector3(
        Math.random() * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.1
      );
      this.scene.add(mesh);
      this.confettiParticles.push(mesh);
    }
  }

  // ------------------------------------------
  // UI & HUD Interaction
  // ------------------------------------------
  initUI() {
    // Setup Modal Mode Pills
    const modePills = document.querySelectorAll('#mode-pills .selector-pill');
    modePills.forEach(pill => {
      pill.addEventListener('click', () => {
        modePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.dataset.count;
        const onlineSec = document.getElementById('setup-online-section');
        const expeditionSec = document.getElementById('setup-expedition-section');
        const tournamentSec = document.getElementById('setup-tournament-section');
        const startBtn = document.getElementById('btn-start-game');

        if (mode === 'online') {
          if (onlineSec) onlineSec.style.display = 'block';
          if (expeditionSec) expeditionSec.style.display = 'none';
          if (tournamentSec) tournamentSec.style.display = 'none';
          if (startBtn) startBtn.innerText = 'Mulai Mabar Online 🌐';
          this.renderPlayerForm(1);
        } else if (mode === 'expedition') {
          if (onlineSec) onlineSec.style.display = 'none';
          if (expeditionSec) expeditionSec.style.display = 'block';
          if (tournamentSec) tournamentSec.style.display = 'none';
          if (startBtn) startBtn.innerText = 'Mulai Ekspedisi Nusantara 🗺️';
          this.renderPlayerForm(1);
        } else if (mode === 'tournament') {
          if (onlineSec) onlineSec.style.display = 'none';
          if (expeditionSec) expeditionSec.style.display = 'none';
          if (tournamentSec) tournamentSec.style.display = 'block';
          if (startBtn) startBtn.innerText = 'Mulai Babak Semifinal ⚔️';
          this.renderPlayerForm(1);
          const p1Input = document.getElementById('input-p1');
          const tPreviewP1 = document.getElementById('t-preview-p1');
          if (p1Input && tPreviewP1) {
            tPreviewP1.innerText = p1Input.value.trim() || 'Pemain Anda';
          }
        } else {
          if (onlineSec) onlineSec.style.display = 'none';
          if (expeditionSec) expeditionSec.style.display = 'none';
          if (tournamentSec) tournamentSec.style.display = 'none';
          if (startBtn) startBtn.innerText = 'Mulai Petualangan 🚀';
          this.renderPlayerForm(parseInt(mode, 10) || 1);
        }
      });
    });

    // Expedition Stage Cards Click Handler
    const expCards = document.querySelectorAll('.expedition-card');
    expCards.forEach(card => {
      const stageId = card.dataset.stage;
      const expIndex = EXPEDITIONS.findIndex(e => e.id === stageId);
      
      if (expIndex > this.expeditionLevel) {
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
        card.title = 'Terkunci! Selesaikan ekspedisi sebelumnya.';
      } else {
        card.title = 'Terbuka';
      }

      card.addEventListener('click', () => {
        if (expIndex > this.expeditionLevel) {
          this.showToast(`🔒 Ekspedisi Terkunci! Selesaikan level sebelumnya.`);
          return;
        }
        expCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.currentExpedition = card.dataset.stage;
        const exp = EXPEDITIONS.find(e => e.id === this.currentExpedition);
        if (exp) {
          this.setBoardTheme(exp.boardTheme);
          this.setWeather(exp.weather);
          audio.setSoundpack(exp.soundpack);
          this.showToast(`Pilih Ekspedisi: ${exp.name} ${exp.icon}`);
        }
      });
    });

    // Online Room Tabs (Create vs Join)
    const tabCreate = document.getElementById('tab-create-room');
    const tabJoin = document.getElementById('tab-join-room');
    const boxCreate = document.getElementById('box-create-room');
    const boxJoin = document.getElementById('box-join-room');

    if (tabCreate && tabJoin) {
      tabCreate.addEventListener('click', () => {
        tabCreate.classList.add('active');
        tabJoin.classList.remove('active');
        if (boxCreate) boxCreate.style.display = 'block';
        if (boxJoin) boxJoin.style.display = 'none';
      });

      tabJoin.addEventListener('click', () => {
        tabJoin.classList.add('active');
        tabCreate.classList.remove('active');
        if (boxJoin) boxJoin.style.display = 'block';
        if (boxCreate) boxCreate.style.display = 'none';
      });
    }

    this.renderPlayerForm(1); // Default 1 vs BOT

    // Start Game Button
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.onStartGameClick();
    });

    // Roll Dice Button
    document.getElementById('btn-roll').addEventListener('click', () => {
      this.rollDice();
    });

    // Speed Multiplier Button
    const btnSpeed = document.getElementById('btn-speed');
    if (btnSpeed) {
      btnSpeed.addEventListener('click', () => {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        btnSpeed.innerText = `⚡${this.gameSpeed}x`;
        btnSpeed.classList.toggle('active', this.gameSpeed === 2);
        this.showToast(`Kecepatan Animasi: ${this.gameSpeed}x`);
      });
    }

    // 3D Weather Switcher (Cerah / Hujan / Daun / Kabut)
    const btnWeather = document.getElementById('btn-weather');
    if (btnWeather) {
      btnWeather.addEventListener('click', () => {
        this.cycleWeather();
      });
    }

    // 3D Environment Theme Switcher (Malam / Siang / Senja)
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
      const themes = [
        { id: 'malam', icon: '🌙', name: 'Malam Berbintang' },
        { id: 'siang', icon: '☀️', name: 'Siang Tropis' },
        { id: 'senja', icon: '🌅', name: 'Senja Keemasan' },
        { id: 'neon', icon: '✨', name: 'Malam Neon Sakral' }
      ];
      let tIndex = 0;
      btnTheme.addEventListener('click', () => {
        tIndex = (tIndex + 1) % themes.length;
        const currentT = themes[tIndex];
        this.setEnvironmentTheme(currentT.id);
        btnTheme.innerText = currentT.icon;
        this.showToast(`Suasana: ${currentT.name}`);
        audio.playPop(480, 0.08);
      });
    }

    // 3D Board Theme Switcher (Klasik / Candi / Rimba)
    const btnBoardTheme = document.getElementById('btn-board-theme');
    if (btnBoardTheme) {
      const bThemes = [
        { id: 'klasik', icon: '📜', name: 'Klasik 90-an' },
        { id: 'candi', icon: '🏛️', name: 'Candi Borobudur' },
        { id: 'rimba', icon: '🌴', name: 'Rimba Tropis' }
      ];
      let bIdx = 0;
      btnBoardTheme.addEventListener('click', () => {
        bIdx = (bIdx + 1) % bThemes.length;
        const currentB = bThemes[bIdx];
        this.setBoardTheme(currentB.id);
        btnBoardTheme.innerText = currentB.icon;
        this.showToast(`Gaya Papan: ${currentB.name}`);
        document.querySelectorAll('.btheme-pill').forEach(pill => {
          pill.classList.toggle('active', pill.dataset.btheme === currentB.id);
        });
      });
    }

    // Setup Modal Board Theme Pills
    const bthemePills = document.querySelectorAll('.btheme-pill');
    bthemePills.forEach(pill => {
      pill.addEventListener('click', () => {
        bthemePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.setBoardTheme(pill.dataset.btheme);
        if (btnBoardTheme) {
          const iconMap = { klasik: '📜', candi: '🏛️', rimba: '🌴' };
          btnBoardTheme.innerText = iconMap[pill.dataset.btheme] || '📜';
        }
      });
    });

    // Sound Toggle Button
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const active = audio.toggle();
      btnSound.innerText = active ? '🔊' : '🔇';
      btnSound.classList.toggle('active', active);
      if (active) {
        audio.startBGM();
      } else {
        audio.stopBGM();
      }
    });

    // Camera Mode & Preset Cycler
    const btnCamera = document.getElementById('btn-camera');
    if (btnCamera) {
      const cameraModes = [
        { id: 'auto', icon: '🎥', name: 'Sinematik (Auto-Track)', pos: new THREE.Vector3(0, 32, 28) },
        { id: 'topdown', icon: '📐', name: 'Top-Down 2D/3D', pos: new THREE.Vector3(0, 44, 0.1) },
        { id: 'action', icon: '👁️', name: 'Action Cam (Dekat)', pos: new THREE.Vector3(0, 15, 18) },
        { id: 'free', icon: '🌐', name: 'Kamera Bebas 360°', pos: new THREE.Vector3(20, 26, 20) }
      ];
      let camIdx = 0;
      btnCamera.addEventListener('click', () => {
        camIdx = (camIdx + 1) % cameraModes.length;
        const currentMode = cameraModes[camIdx];
        this.cameraMode = currentMode.id;
        this.autoCamera = currentMode.id === 'auto' || currentMode.id === 'action';
        btnCamera.innerText = currentMode.icon;
        this.showToast(`Kamera: ${currentMode.name}`);
        this.controls.target.set(0, 0, 0);
        this.camera.position.copy(currentMode.pos);
        this.controls.update();
        audio.playPop(520, 0.08);
      });
    }

    // Interactive Emote Reaction Bar
    const emoteBtns = document.querySelectorAll('.btn-emote');
    emoteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.players.length === 0) return;
        const activePlayer = this.players[this.isOnlineGame ? this.myPlayerIndex : this.currentTurn];
        if (!activePlayer) return;
        const text = btn.dataset.text || btn.innerText;
        this.triggerPawnEmote(activePlayer, text, activePlayer.colorHex);
        this.addHistoryLog(`💬 <span style="color:${activePlayer.colorHex}">${activePlayer.name}</span>: "${text}"`);
        if (this.isOnlineGame) {
          this.sendRoomAction({ type: 'EMOTE', playerIndex: this.myPlayerIndex, text });
        }
      });
    });

    // Restart / Setup Game Button
    document.getElementById('btn-restart').addEventListener('click', () => {
      document.getElementById('modal-setup').classList.add('open');
    });

    // Settings Modal
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      document.getElementById('modal-settings').classList.add('open');
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      document.getElementById('modal-settings').classList.remove('open');
    });
    document.getElementById('btn-reset-expedition')?.addEventListener('click', () => {
      if (confirm('Yakin ingin mereset progres Ekspedisi kembali ke Tanah Jawa?')) {
        this.expeditionLevel = 0;
        localStorage.setItem('expeditionLevel', 0);
        this.currentExpedition = 'jawa';
        this.showToast('Progres Ekspedisi berhasil direset.');
        document.getElementById('modal-settings').classList.remove('open');
        // Refresh UI if on expedition tab
        const expCards = document.querySelectorAll('.expedition-card');
        expCards.forEach(card => {
          const stageId = card.dataset.stage;
          const expIndex = EXPEDITIONS.findIndex(e => e.id === stageId);
          if (expIndex > this.expeditionLevel) {
            card.style.opacity = '0.5';
            card.style.cursor = 'not-allowed';
            card.title = 'Terkunci! Selesaikan ekspedisi sebelumnya.';
          } else {
            card.style.opacity = '1';
            card.style.cursor = 'pointer';
            card.title = 'Terbuka';
          }
          if (stageId === 'jawa') card.classList.add('active');
          else card.classList.remove('active');
        });
      }
    });
    document.getElementById('btn-clear-all-data')?.addEventListener('click', () => {
      if (confirm('BAHAYA! Semua data, statistik, dan pencapaian akan dihapus. Lanjutkan?')) {
        localStorage.clear();
        location.reload();
      }
    });

    // Rules Modal
    document.getElementById('btn-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('open');
    });
    document.getElementById('btn-close-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.remove('open');
    });

    // Statistics & Records Modal
    const btnStats = document.getElementById('btn-stats');
    if (btnStats) {
      btnStats.addEventListener('click', () => {
        this.renderStatsUI();
        document.getElementById('modal-stats').classList.add('open');
      });
    }
    const btnCloseStats = document.getElementById('btn-close-stats');
    if (btnCloseStats) {
      btnCloseStats.addEventListener('click', () => {
        document.getElementById('modal-stats').classList.remove('open');
      });
    }
    const btnResetStats = document.getElementById('btn-reset-stats');
    if (btnResetStats) {
      btnResetStats.addEventListener('click', () => {
        if (confirm('Yakin ingin mereset seluruh data statistik dan rekor permainan?')) {
          localStorage.removeItem('ular_tangga_stats_v1');
          this.stats = this.loadStats();
          this.renderStatsUI();
          this.showToast('Statistik telah direset.');
        }
      });
    }

    // Soundpack Selector Button
    const btnSoundpack = document.getElementById('btn-soundpack');
    if (btnSoundpack) {
      btnSoundpack.addEventListener('click', () => {
        const nextPack = audio.cycleSoundpack();
        btnSoundpack.innerText = nextPack.icon;
        this.showToast(`Soundpack Musik: ${nextPack.name} ${nextPack.icon}`);
      });
    }

    // Play Again Button
    document.getElementById('btn-play-again').addEventListener('click', () => {
      document.getElementById('modal-winner').classList.remove('open');
      this.confettiParticles.forEach(p => this.scene.remove(p));
      this.confettiParticles = [];
      document.getElementById('modal-setup').classList.add('open');
    });

    // Tournament Bracket Menu Button
    const btnBracketMenu = document.getElementById('btn-bracket-menu');
    if (btnBracketMenu) {
      btnBracketMenu.addEventListener('click', () => {
        document.getElementById('modal-tournament-bracket').classList.remove('open');
        document.getElementById('modal-setup').classList.add('open');
      });
    }
  }

  onStartGameClick() {
    audio.init();
    audio.startBGM();

    const activeModePill = document.querySelector('#mode-pills .selector-pill.active');
    const mode = activeModePill ? activeModePill.dataset.count : '1';

    if (mode === 'online') {
      const isCreate = document.getElementById('tab-create-room')?.classList.contains('active');
      const p1Name = document.getElementById('input-p1')?.value?.trim() || 'Pemain Anda';
      const p1Acc = this.playerHeadgears[0] || 'mahkota';

      if (isCreate) {
        this.createOnlineRoom(p1Name, p1Acc);
      } else {
        const roomCode = document.getElementById('input-room-code')?.value?.trim()?.toUpperCase();
        this.joinOnlineRoom(roomCode, p1Name, p1Acc);
      }
      return;
    }

    if (mode === 'tournament') {
      const p1Name = document.getElementById('input-p1')?.value?.trim() || 'Pemain Anda';
      const p1Acc = this.playerHeadgears[0] || 'mahkota';
      const p1Motif = this.playerMotifs[0] || 'megamendung';
      this.initTournament(p1Name, p1Acc, p1Motif);
      return;
    }

    if (mode === 'expedition') {
      const exp = EXPEDITIONS.find(e => e.id === this.currentExpedition) || EXPEDITIONS[0];
      this.isExpeditionMode = true;
      this.setBoardTheme(exp.boardTheme);
      this.setWeather(exp.weather);
      audio.setSoundpack(exp.soundpack);

      const p1Name = document.getElementById('input-p1')?.value?.trim() || 'Penjelajah Nusantara';
      const p1Acc = this.playerHeadgears[0] || 'mahkota';
      const p1Motif = this.playerMotifs[0] || 'megamendung';
      const botAcc = exp.id === 'papua' ? 'cendrawasih' : (exp.id === 'bali' ? 'udeng' : 'helm');
      const botMotif = exp.id === 'papua' ? 'tenun' : (exp.id === 'bali' ? 'songket' : 'kawung');

      const configs = [
        { name: p1Name, isAI: false, accessory: p1Acc, motif: p1Motif },
        { name: `Penjaga ${exp.name} (AI)`, isAI: true, accessory: botAcc, motif: botMotif }
      ];

      const modal = document.getElementById('modal-setup');
      if (modal) modal.classList.remove('open');
      this.setupPlayers(configs);
      this.showToast(`Memulai Ekspedisi: ${exp.name} ${exp.icon}!`);
      return;
    }

    this.isExpeditionMode = false;
    this.isTournamentMode = false;
    const configs = [];
    if (mode === '1') {
      const p1Name = document.getElementById('input-p1')?.value?.trim() || 'Pemain 1';
      const p1Acc = this.playerHeadgears[0] || 'mahkota';
      const p1Motif = this.playerMotifs[0] || 'megamendung';
      const botAcc = this.playerHeadgears[1] || 'caping';
      const botMotif = this.playerMotifs[1] || 'kawung';
      configs.push({ name: p1Name, isAI: false, accessory: p1Acc, motif: p1Motif });
      configs.push({ name: 'Si Bot Pintar', isAI: true, accessory: botAcc, motif: botMotif });
    } else {
      const count = parseInt(mode, 10) || 2;
      for (let i = 1; i <= count; i++) {
        const nameInput = document.getElementById(`input-p${i}`);
        const name = nameInput?.value?.trim() || `Pemain ${i}`;
        const acc = this.playerHeadgears[i - 1] || HEADGEARS[(i - 1) % HEADGEARS.length].id;
        const motif = this.playerMotifs[i - 1] || BATIK_MOTIFS[(i - 1) % BATIK_MOTIFS.length].id;
        configs.push({ name, isAI: false, accessory: acc, motif });
      }
    }

    const modal = document.getElementById('modal-setup');
    if (modal) modal.classList.remove('open');
    this.setupPlayers(configs);
  }

  // ------------------------------------------
  // Turnamen Mini Knockout Bracket (Piala Raja Nusantara)
  // ------------------------------------------
  initTournament(p1Name, p1Acc, p1Motif) {
    this.isTournamentMode = true;
    this.isExpeditionMode = false;
    this.tournamentRound = 'semifinal';
    this.tournamentPlayer = { name: p1Name, accessory: p1Acc, motif: p1Motif };
    
    const shuffledBots = [...TOURNAMENT_BOTS].sort(() => 0.5 - Math.random());
    this.tourBots = [shuffledBots[0], shuffledBots[1], shuffledBots[2]];

    this.tournamentBracket = {
      sf1: { p1: p1Name, p2: this.tourBots[0].name, winner: null, status: 'active' },
      sf2: { p1: this.tourBots[1].name, p2: this.tourBots[2].name, winner: null, status: 'waiting' },
      final: { p1: 'Pemenang SF1', p2: 'Pemenang SF2', winner: null, status: 'waiting' }
    };
    this.startTournamentMatch('semifinal');
  }

  startTournamentMatch(round) {
    this.tournamentRound = round;
    const modal = document.getElementById('modal-setup');
    if (modal) modal.classList.remove('open');
    const bracketModal = document.getElementById('modal-tournament-bracket');
    if (bracketModal) bracketModal.classList.remove('open');
    const winnerModal = document.getElementById('modal-winner');
    if (winnerModal) winnerModal.classList.remove('open');

    if (round === 'semifinal') {
      this.setBoardTheme('candi');
      this.setWeather('cerah');
      audio.setSoundpack('pelog');
      audio.playGongStrike();

      const configs = [
        { name: this.tournamentPlayer.name, isAI: false, accessory: this.tournamentPlayer.accessory, motif: this.tournamentPlayer.motif },
        { name: this.tourBots[0].name, isAI: true, accessory: this.tourBots[0].accessory, motif: this.tourBots[0].motif }
      ];
      this.setupPlayers(configs);
      this.showToast(`🏆 Semifinal Piala Raja: Hadapi ${this.tourBots[0].name}!`);
      this.addHistoryLog(`⚔️ <strong>Babak Semifinal Piala Raja Dimulai!</strong>`);
    } else if (round === 'final') {
      this.setBoardTheme('candi');
      this.setWeather('daun');
      audio.setSoundpack('gamelan');
      audio.playRoyalFanfare();

      const configs = [
        { name: this.tournamentPlayer.name, isAI: false, accessory: this.tournamentPlayer.accessory, motif: this.tournamentPlayer.motif },
        { name: this.tournamentBracket.sf2.winner, isAI: true, accessory: this.tourBots[1].accessory, motif: this.tourBots[1].motif }
      ];
      this.setupPlayers(configs);
      this.showToast(`👑 GRAND FINAL PIALA RAJA: Hadapi ${this.tournamentBracket.sf2.winner}!`);
      this.addHistoryLog(`👑 <strong>PARTAI PUNCAK GRAND FINAL PIALA RAJA DIMULAI!</strong>`);
    }
  }

  renderTournamentBracket(stateKey = 'normal') {
    const container = document.getElementById('bracket-tree-container');
    const statusBox = document.getElementById('bracket-status-box');
    const actionBtn = document.getElementById('btn-bracket-action');
    const subtitle = document.getElementById('bracket-subtitle');
    if (!container) return;

    const b = this.tournamentBracket;
    const isSF1Active = b.sf1.status === 'active';
    const isFinalActive = b.final.status === 'active';
    const isFinalDone = b.final.status === 'champion';

    subtitle.innerText = isFinalDone ? '🏆 Pemenang Piala Raja Dinobatkan!' : (b.final.status === 'ready' || isFinalActive ? '👑 Partai Puncak Grand Final' : '⚔️ Babak Semifinal Knockout');

    container.innerHTML = `
      <div class="bracket-column">
        <div class="bracket-col-title">Semifinal A</div>
        <div class="bracket-match ${isSF1Active ? 'current-active' : ''}">
          <div class="bracket-slot ${b.sf1.winner === b.sf1.p1 ? 'winner' : (b.sf1.winner ? 'loser' : '')}">
            <span>👤 ${b.sf1.p1}</span>
            <span class="bracket-slot-tag ${b.sf1.winner === b.sf1.p1 ? 'tag-winner' : (isSF1Active ? 'tag-active' : '')}">
              ${b.sf1.winner === b.sf1.p1 ? '✓ MENANG' : (isSF1Active ? 'BERTANDING' : '')}
            </span>
          </div>
          <div class="bracket-slot ${b.sf1.winner === b.sf1.p2 ? 'winner' : (b.sf1.winner ? 'loser' : '')}">
            <span>🐅 ${b.sf1.p2}</span>
            <span class="bracket-slot-tag ${b.sf1.winner === b.sf1.p2 ? 'tag-winner' : ''}">
              ${b.sf1.winner === b.sf1.p2 ? '✓ MENANG' : (b.sf1.winner ? 'GUGUR' : '')}
            </span>
          </div>
        </div>

        <div class="bracket-col-title" style="margin-top: 10px;">Semifinal B</div>
        <div class="bracket-match">
          <div class="bracket-slot ${b.sf2.winner === b.sf2.p1 ? 'winner' : (b.sf2.winner ? 'loser' : '')}">
            <span>⚔️ ${b.sf2.p1}</span>
            <span class="bracket-slot-tag ${b.sf2.winner === b.sf2.p1 ? 'tag-winner' : ''}">
              ${b.sf2.winner === b.sf2.p1 ? '✓ MENANG' : ''}
            </span>
          </div>
          <div class="bracket-slot ${b.sf2.winner === b.sf2.p2 ? 'winner' : (b.sf2.winner ? 'loser' : '')}">
            <span>🌺 ${b.sf2.p2}</span>
            <span class="bracket-slot-tag ${b.sf2.winner === b.sf2.p2 ? 'tag-winner' : ''}">
              ${b.sf2.winner === b.sf2.p2 ? '✓ MENANG' : (b.sf2.winner ? 'GUGUR' : '')}
            </span>
          </div>
        </div>
      </div>

      <div class="bracket-connector-col">➔</div>

      <div class="bracket-column">
        <div class="bracket-col-title">Grand Final 👑</div>
        <div class="bracket-match ${isFinalActive ? 'current-active' : ''}">
          <div class="bracket-slot ${b.final.winner === b.final.p1 ? 'winner' : (b.final.winner ? 'loser' : '')}">
            <span>${b.final.p1 === this.tournamentPlayer.name ? '👑' : '⚔️'} ${b.final.p1}</span>
            <span class="bracket-slot-tag ${b.final.winner === b.final.p1 ? 'tag-winner' : (isFinalActive ? 'tag-active' : '')}">
              ${b.final.winner === b.final.p1 ? '🏆 JUARA 1' : (isFinalActive ? 'BERTANDING' : '')}
            </span>
          </div>
          <div class="bracket-slot ${b.final.winner === b.final.p2 ? 'winner' : (b.final.winner ? 'loser' : '')}">
            <span>⚔️ ${b.final.p2}</span>
            <span class="bracket-slot-tag ${b.final.winner === b.final.p2 ? 'tag-winner' : ''}">
              ${b.final.winner === b.final.p2 ? '🏆 JUARA 1' : (b.final.winner ? 'RUNNER-UP' : '')}
            </span>
          </div>
        </div>

        <div class="bracket-trophy-display">
          <div style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(245,158,11,0.6));">🏆</div>
          <span style="font-size: 0.75rem; font-weight: 800; color: #fbbf24;">PIALA RAJA NUSANTARA</span>
        </div>
      </div>
    `;

    if (stateKey === 'sf_win') {
      statusBox.innerHTML = `
        <span style="color: #34d399; font-weight: 700;">🎉 Luar Biasa! Anda memenangkan Semifinal 1!</span><br>
        <span style="color: #cbd5e1; font-size: 0.8rem;">Di Semifinal 2: <strong>Gajah Mada ⚔️</strong> berhasil menundukkan I Gusti Ngurah 🌺!</span>
      `;
      actionBtn.innerText = 'Lanjut ke Grand Final ⚔️';
      actionBtn.onclick = () => this.startTournamentMatch('final');
    } else if (stateKey === 'sf_lost') {
      statusBox.innerHTML = `
        <span style="color: #f87171; font-weight: 700;">💔 Anda gugur di Babak Semifinal.</span><br>
        <span style="color: #cbd5e1; font-size: 0.8rem;">Tuanku Imam 🐅 melaju ke babak puncak perebutan piala.</span>
      `;
      actionBtn.innerText = 'Ulangi Turnamen 🔄';
      actionBtn.onclick = () => this.initTournament(this.tournamentPlayer.name, this.tournamentPlayer.accessory, this.tournamentPlayer.motif);
    } else if (stateKey === 'final_win') {
      statusBox.innerHTML = `
        <span style="color: #fbbf24; font-weight: 800; font-size: 1rem;">👑 SELAMAT! ANDA JUARA PIALA RAJA NUSANTARA! 🏆</span><br>
        <span style="color: #34d399; font-size: 0.82rem;">Mengalahkan Gajah Mada di partai puncak dan dinobatkan sebagai Maharaja Nusantara!</span>
      `;
      actionBtn.innerText = 'Main Turnamen Baru 🏆';
      actionBtn.onclick = () => {
        document.getElementById('modal-tournament-bracket').classList.remove('open');
        document.getElementById('modal-setup').classList.add('open');
      };
    } else if (stateKey === 'final_lost') {
      statusBox.innerHTML = `
        <span style="color: #fbbf24; font-weight: 700;">🥈 Anda meraih posisi Runner-Up (Juara 2).</span><br>
        <span style="color: #cbd5e1; font-size: 0.8rem;">Gajah Mada ⚔️ berhasil mempertahankan supremasi takhta Majapahit.</span>
      `;
      actionBtn.innerText = 'Tantang Lagi 🔄';
      actionBtn.onclick = () => this.initTournament(this.tournamentPlayer.name, this.tournamentPlayer.accessory, this.tournamentPlayer.motif);
    }
  }

  showTournamentBracketModal(stateKey) {
    this.renderTournamentBracket(stateKey);
    const bracketModal = document.getElementById('modal-tournament-bracket');
    if (bracketModal) bracketModal.classList.add('open');
  }

  renderPlayerForm(count) {
    const container = document.getElementById('setup-player-inputs');
    container.innerHTML = '';

    const getGear = (id) => HEADGEARS.find(h => h.id === id) || HEADGEARS[0];
    const getMotif = (id) => BATIK_MOTIFS.find(m => m.id === id) || BATIK_MOTIFS[0];

    if (count === 1) {
      const g1 = getGear(this.playerHeadgears[0] || 'mahkota');
      const m1 = getMotif(this.playerMotifs[0] || 'megamendung');
      const gBot = getGear(this.playerHeadgears[1] || 'caping');
      const mBot = getMotif(this.playerMotifs[1] || 'kawung');
      container.innerHTML = `
        <div class="player-input-row" style="flex-wrap: wrap; gap: 8px;">
          <div class="player-avatar" style="background: ${PLAYER_COLORS[0].hex};">1</div>
          <input type="text" id="input-p1" value="Pemain Anda" maxlength="16" placeholder="Nama Pemain" style="flex: 1; min-width: 105px;">
          <button type="button" class="btn-headgear-cycle" data-pindex="0" title="Klik untuk ganti aksesori">
            <span>${g1.icon}</span> <span>${g1.name}</span>
          </button>
          <button type="button" class="btn-motif-cycle" data-pindex="0" title="Klik untuk ganti motif batik pion">
            <span>${m1.icon}</span> <span>${m1.name}</span>
          </button>
        </div>
        <div class="player-input-row" style="opacity: 0.85; flex-wrap: wrap; gap: 8px;">
          <div class="player-avatar" style="background: ${PLAYER_COLORS[1].hex};">🤖</div>
          <input type="text" value="Si Bot Pintar (AI)" disabled style="flex: 1; min-width: 105px;">
          <button type="button" class="btn-headgear-cycle" data-pindex="1" title="Klik untuk ganti aksesori Bot">
            <span>${gBot.icon}</span> <span>${gBot.name}</span>
          </button>
          <button type="button" class="btn-motif-cycle" data-pindex="1" title="Klik untuk ganti motif batik Bot">
            <span>${mBot.icon}</span> <span>${mBot.name}</span>
          </button>
        </div>
      `;
    } else {
      for (let i = 1; i <= count; i++) {
        const g = getGear(this.playerHeadgears[i - 1] || HEADGEARS[(i - 1) % HEADGEARS.length].id);
        const m = getMotif(this.playerMotifs[i - 1] || BATIK_MOTIFS[(i - 1) % BATIK_MOTIFS.length].id);
        container.innerHTML += `
          <div class="player-input-row" style="flex-wrap: wrap; gap: 8px;">
            <div class="player-avatar" style="background: ${PLAYER_COLORS[i - 1].hex};">${i}</div>
            <input type="text" id="input-p${i}" value="Pemain ${i}" maxlength="16" placeholder="Nama Pemain ${i}" style="flex: 1; min-width: 105px;">
            <button type="button" class="btn-headgear-cycle" data-pindex="${i - 1}" title="Klik untuk ganti aksesori">
              <span>${g.icon}</span> <span>${g.name}</span>
            </button>
            <button type="button" class="btn-motif-cycle" data-pindex="${i - 1}" title="Klik untuk ganti motif batik pion">
              <span>${m.icon}</span> <span>${m.name}</span>
            </button>
          </div>
        `;
      }
    }

    // Attach cycle event listeners to all headgear buttons
    const hgBtns = container.querySelectorAll('.btn-headgear-cycle');
    hgBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pIdx = parseInt(btn.dataset.pindex, 10);
        const curGearId = this.playerHeadgears[pIdx] || HEADGEARS[pIdx % HEADGEARS.length].id;
        const curIdx = HEADGEARS.findIndex(h => h.id === curGearId);
        const nextIdx = (curIdx + 1) % HEADGEARS.length;
        const nextGear = HEADGEARS[nextIdx];
        this.playerHeadgears[pIdx] = nextGear.id;
        btn.innerHTML = `<span>${nextGear.icon}</span> <span>${nextGear.name}</span>`;
        audio.playPop(580, 0.06);
      });
    });

    // Attach cycle event listeners to all batik motif buttons
    const motifBtns = container.querySelectorAll('.btn-motif-cycle');
    motifBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pIdx = parseInt(btn.dataset.pindex, 10);
        const curMotifId = this.playerMotifs[pIdx] || BATIK_MOTIFS[pIdx % BATIK_MOTIFS.length].id;
        const curIdx = BATIK_MOTIFS.findIndex(m => m.id === curMotifId);
        const nextIdx = (curIdx + 1) % BATIK_MOTIFS.length;
        const nextMotif = BATIK_MOTIFS[nextIdx];
        this.playerMotifs[pIdx] = nextMotif.id;
        btn.innerHTML = `<span>${nextMotif.icon}</span> <span>${nextMotif.name}</span>`;
        audio.playPop(520, 0.06);
      });
    });
  }

  updateHUD() {
    if (this.players.length === 0) return;
    const current = this.players[this.currentTurn];

    // Turn Card
    const nameEl = document.getElementById('current-player-name');
    nameEl.innerText = current.name;
    nameEl.style.color = current.colorHex;

    const dotEl = document.getElementById('turn-indicator-dot');
    dotEl.style.background = current.colorHex;
    dotEl.style.boxShadow = `0 0 12px ${current.colorHex}`;

    // Leaderboard Tracker
    const tracker = document.getElementById('player-list-tracker');
    tracker.innerHTML = '';
    this.players.forEach(p => {
      const isTurn = p.id === current.id;
      const gear = HEADGEARS.find(h => h.id === p.accessory) || HEADGEARS[0];
      tracker.innerHTML += `
        <div class="player-item ${isTurn ? 'active-turn' : ''}">
          <div class="player-avatar" style="background: ${p.colorHex};">${p.isAI ? '🤖' : p.id + 1}</div>
          <div class="player-info">
            <div class="player-name">${gear.icon} ${p.name}</div>
            <div class="player-meta">${p.isAI ? 'Komputer AI' : 'Pemain'} • ${gear.name}</div>
          </div>
          <div class="player-tile-badge">${p.tile}</div>
        </div>
      `;
    });
  }

  showToast(message) {
    const toast = document.getElementById('event-toast');
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  createLandingSparks(position, color) {
    const sparkCount = 8;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y + 0.1;
      positions[i * 3 + 2] = position.z;
      
      const angle = (Math.PI * 2 / sparkCount) * i;
      const speed = 0.05 + Math.random() * 0.05;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 0.1,
        Math.sin(angle) * speed
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.25,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    if (!this.activeSparks) this.activeSparks = [];
    this.activeSparks.push({
      mesh: points,
      velocities: velocities,
      age: 0,
      maxAge: 20
    });
  }

  // ------------------------------------------
  // Main Animation Loop
  // ------------------------------------------
  animate() {
    requestAnimationFrame(() => this.animate());

    // Update Landing Sparks
    if (this.activeSparks) {
      for (let i = this.activeSparks.length - 1; i >= 0; i--) {
        const spark = this.activeSparks[i];
        const positions = spark.mesh.geometry.attributes.position.array;
        
        for (let j = 0; j < spark.velocities.length; j++) {
          positions[j * 3] += spark.velocities[j].x;
          positions[j * 3 + 1] += spark.velocities[j].y;
          positions[j * 3 + 2] += spark.velocities[j].z;
          spark.velocities[j].y -= 0.005; // Gravity
        }
        
        spark.mesh.geometry.attributes.position.needsUpdate = true;
        spark.mesh.material.opacity = 1.0 - (spark.age / spark.maxAge);
        spark.age++;
        
        if (spark.age >= spark.maxAge) {
          this.scene.remove(spark.mesh);
          spark.mesh.geometry.dispose();
          spark.mesh.material.dispose();
          this.activeSparks.splice(i, 1);
        }
      }
    }

    // Idle Animation for pawns
    if (!this.isMoving && !this.isRolling && this.players.length > 0) {
      const time = Date.now() * 0.003;
      
      this.players.forEach((p, idx) => {
        if (!p.mesh) return;
        if (idx === this.currentTurn) {
          // Active pawn breathes/bobs
          p.mesh.scale.y = 1.0 + Math.sin(time * 2) * 0.04;
          p.mesh.scale.x = 1.0 - Math.sin(time * 2) * 0.02;
          p.mesh.scale.z = 1.0 - Math.sin(time * 2) * 0.02;
        } else {
          // Reset others
          p.mesh.scale.set(1, 1, 1);
        }
      });
    }

    // Update Confetti
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.position.add(p.velocity);
      p.rotation.x += p.rotSpeed.x;
      p.rotation.y += p.rotSpeed.y;
      if (p.position.y < 0.2) {
        this.scene.remove(p);
        this.confettiParticles.splice(i, 1);
      }
    }

    // Pulse and update Active Tile Halo
    if (this.haloMesh && this.players.length > 0) {
      const activePlayer = this.players[this.currentTurn];
      if (activePlayer) {
        const targetTilePos = this.getTilePosition(activePlayer.tile);
        this.haloMesh.position.x = THREE.MathUtils.lerp(this.haloMesh.position.x, targetTilePos.x, 0.08);
        this.haloMesh.position.z = THREE.MathUtils.lerp(this.haloMesh.position.z, targetTilePos.z, 0.08);
        this.haloMesh.rotation.z += 0.02;
        const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.15;
        this.haloMesh.scale.set(pulse, pulse, 1);
        this.haloMesh.material.color.set(activePlayer.colorHex);
      }
    }

    // Update Active 3D Emote & Speech Bubbles
    const now = performance.now();
    for (let i = this.activeEmotes.length - 1; i >= 0; i--) {
      const e = this.activeEmotes[i];
      const elapsed = now - e.startTime;
      const progress = elapsed / e.duration;

      if (progress >= 1) {
        e.player.mesh.remove(e.sprite);
        if (e.sprite.material.map) e.sprite.material.map.dispose();
        e.sprite.material.dispose();
        this.activeEmotes.splice(i, 1);
      } else {
        // Elastic pop-in during first 220ms
        let s = 1.0;
        if (elapsed < 220) {
          const p = elapsed / 220;
          // Spring overshoot
          s = Math.sin(p * Math.PI * 0.5) * 1.15;
          e.sprite.material.opacity = Math.min(1, p * 1.5);
        } else if (progress > 0.8) {
          // Fade out in final 20%
          const fadeP = (progress - 0.8) / 0.2;
          e.sprite.material.opacity = Math.max(0, 1 - fadeP);
          s = 1.0;
        } else {
          e.sprite.material.opacity = 1.0;
          s = 1.0;
        }

        e.sprite.scale.set(e.baseWidth * s, e.baseHeight * s, 1);
        // Floating drift upwards
        e.sprite.position.y = e.baseY + progress * 0.35 + Math.sin(elapsed * 0.006) * 0.05;
      }
    }
    // Update Rain Particles (if visible)
    if (this.rainParticles && this.rainParticles.visible) {
      const posAttr = this.rainParticles.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let y = posAttr.getY(i) - this.rainVelocities[i];
        let x = posAttr.getX(i) + 0.05; // Gentle wind tilt
        if (y < 0.2) {
          y = 28 + Math.random() * 4;
          x = (Math.random() - 0.5) * 45;
        }
        posAttr.setY(i, y);
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;
    }

    // Update Swirling Leaves (if visible)
    if (this.leafGroup && this.leafGroup.visible) {
      const time = performance.now() * 0.001;
      this.leafData.forEach(ld => {
        ld.mesh.position.y -= ld.fallSpeed;
        ld.mesh.position.x += Math.sin(time + ld.driftPhase) * 0.03;
        ld.mesh.position.z += Math.cos(time + ld.driftPhase) * 0.02;
        ld.mesh.rotation.x += ld.rotSpeed.x;
        ld.mesh.rotation.y += ld.rotSpeed.y;
        ld.mesh.rotation.z += ld.rotSpeed.z;
        if (ld.mesh.position.y < 0.2) {
          ld.mesh.position.y = 22 + Math.random() * 5;
          ld.mesh.position.x = (Math.random() - 0.5) * 35;
          ld.mesh.position.z = (Math.random() - 0.5) * 35;
        }
      });
    }

    // Drift ambient magical sparks
    if (this.sparks && this.sparks.visible) {
      this.sparks.rotation.y += 0.001;
    }

    // Rotate Active 3D Bamboo Shield rings
    this.players.forEach(p => {
      if (p.shieldMesh) {
        p.shieldMesh.rotation.z += 0.04;
      }
    });

    // Auto Camera Follows Active Pawn smoothly
    if (this.autoCamera && this.players.length > 0 && !this.controls.state) {
      const activePawn = this.players[this.currentTurn]?.mesh;
      if (activePawn) {
        this.controls.target.lerp(activePawn.position, 0.04);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ------------------------------------------
  // Online Room Multiplayer Engine (Supabase Realtime)
  // ------------------------------------------
  async createOnlineRoom(playerName, accessory) {
    if (!this.supabase) {
      alert('Supabase tidak terkonfigurasi. Pastikan config.js sudah diset.');
      return;
    }
    this.showToast('Membuat Ruangan Mabar Online...');
    this.isOnlineGame = true;
    this.roomId = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
    this.myPlayerIndex = 0;
    
    // Simpan data player lokal
    this.localPlayerConfig = { name: playerName, isAI: false, accessory, motif: 'polos' };

    const codeDisplay = document.getElementById('display-room-code');
    const statusDisplay = document.getElementById('display-room-status');
    if (codeDisplay) codeDisplay.innerText = this.roomId;
    if (statusDisplay) {
      statusDisplay.innerHTML = `🟢 Ruangan aktif! Bagikan kode <strong>${this.roomId}</strong> ke teman.<br>Menunggu teman bergabung...`;
    }

    this.initSupabaseChannel(this.roomId, 'host');
  }

  async joinOnlineRoom(roomId, playerName, accessory) {
    if (!this.supabase || !roomId) {
      alert('Silakan masukkan Kode Ruangan dan pastikan Supabase terkonfigurasi!');
      return;
    }
    this.showToast(`Menghubungkan ke Ruangan ${roomId}...`);
    this.isOnlineGame = true;
    this.roomId = roomId.toUpperCase();
    this.myPlayerIndex = 1;
    
    this.localPlayerConfig = { name: playerName, isAI: false, accessory, motif: 'polos' };

    this.initSupabaseChannel(this.roomId, 'client');
  }

  initSupabaseChannel(roomId, role) {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
    
    this.channel = this.supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { ack: false }
      }
    });

    this.channel.on('broadcast', { event: 'game_action' }, ({ payload }) => {
      this.handleRoomAction(payload);
    });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        if (role === 'client') {
          // Client joined, broadcast presence to host
          this.sendRoomAction({
            type: 'PLAYER_JOINED',
            player: this.localPlayerConfig
          });
        }
      }
    });
  }

  handleRoomAction(payload) {
    if (payload.type === 'PLAYER_JOINED') {
      if (this.myPlayerIndex === 0) { // Host
        const statusDisplay = document.getElementById('display-room-status');
        if (statusDisplay) {
          statusDisplay.innerHTML = `🎉 <strong>${payload.player.name}</strong> telah bergabung! Memulai permainan...`;
        }
        const players = [this.localPlayerConfig, payload.player];
        
        // Host broadcast start game
        setTimeout(() => {
          this.sendRoomAction({ type: 'START_GAME', players });
          document.getElementById('modal-setup').classList.remove('open');
          this.setupPlayers(players);
          this.syncOnlineTurnButtons();
        }, 1200);
      }
    } else if (payload.type === 'START_GAME') {
      if (this.myPlayerIndex === 1) { // Client
        this.showToast(`Berhasil bergabung ke Ruangan ${this.roomId}!`);
        document.getElementById('modal-setup').classList.remove('open');
        this.setupPlayers(payload.players);
        this.syncOnlineTurnButtons();
      }
    } else if (payload.type === 'DICE_ROLL') {
      if (payload.playerIndex !== this.myPlayerIndex) {
        this.onRemoteDiceLanded(payload.playerIndex, payload.rollValue);
      }
    } else if (payload.type === 'EMOTE') {
      if (payload.playerIndex !== this.myPlayerIndex) {
        const player = this.players[payload.playerIndex];
        if (player) {
          this.triggerPawnEmote(player, payload.text, player.colorHex);
          this.addHistoryLog(`💬 <span style="color:${player.colorHex}">${player.name}</span>: "${payload.text}"`);
        }
      }
    }
  }

  sendRoomAction(action) {
    if (!this.isOnlineGame || !this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'game_action',
      payload: action
    });
  }

  syncOnlineTurnButtons() {
    if (!this.isOnlineGame) return;
    const rollBtn = document.getElementById('btn-roll');
    if (this.currentTurn === this.myPlayerIndex) {
      rollBtn.disabled = false;
      this.showToast('Giliran ANDA! Silakan kocok dadu.');
    } else {
      rollBtn.disabled = true;
      const other = this.players[this.currentTurn];
      this.showToast(`Giliran ${other ? other.name : 'Lawan'}... Menunggu lemparan.`);
    }
  }

  onRemoteDiceLanded(playerIndex, rollValue) {
    this.isRolling = false;
    document.getElementById('dice-value-display').innerText = rollValue;
    const player = this.players[playerIndex];
    if (!player) return;

    if (rollValue === 6) {
      this.recordStat('sixRolls', 1);
      this.triggerPawnEmote(player, 'Hoki 6! 🔥', '#ef4444');
    }

    this.showToast(`${player.name} melempar angka ${rollValue}!`);
    this.addHistoryLog(`🎲 <span style="color:${player.colorHex};font-weight:700;">${player.name}</span> melempar <strong>${rollValue}</strong>`);
    this.movePlayer(player, rollValue);
  }
}

// Start Game Instance reliably across all browser execution modes
function startApp() {
  if (!window.gameInstance) {
    console.log("Initializing SnakeAndLadderGame 3D Engine...");
    window.gameInstance = new SnakeAndLadderGame();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

