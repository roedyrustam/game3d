import { SOUNDPACKS } from './constants.js';

// ==========================================
// PROCEDURAL AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
export class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.soundpack = 'gamelan'; // 'gamelan' | 'angklung' | 'chiptune'
    this.bgmRunning = false;
    this.bgmInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else if (this.bgmRunning) {
      this.startBGM();
    }
    return this.enabled;
  }

  setSoundpack(packId) {
    this.soundpack = packId;
    if (this.bgmRunning) {
      this.stopBGM();
      this.startBGM();
    }
    this.playPop(520, 0.1);
  }

  cycleSoundpack() {
    const idx = SOUNDPACKS.findIndex(s => s.id === this.soundpack);
    const nextIdx = (idx + 1) % SOUNDPACKS.length;
    this.setSoundpack(SOUNDPACKS[nextIdx].id);
    return SOUNDPACKS[nextIdx];
  }

  playTone(freq, duration = 0.2, type = 'sine', volume = 0.3) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playPop(freq = 480, duration = 0.08) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const count = 5;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playPop(200 + Math.random() * 250, 0.05);
      }, i * 70);
    }
  }

  playLadderClimb() {
    if (!this.enabled) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'triangle', 0.25);
      }, idx * 100);
    });
  }

  playSnakeSlide() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {}
  }

  playBounceBack() {
    if (!this.enabled) return;
    this.init();
    this.playTone(320, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(220, 0.15, 'sine', 0.3), 100);
  }

  playWinFanfare() {
    if (!this.enabled) return;
    this.init();
    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.2 },
      { f: 1046.50, d: 0.5 }
    ];
    let time = 0;
    melody.forEach(item => {
      setTimeout(() => {
        this.playTone(item.f, item.d, 'triangle', 0.4);
      }, time * 1000);
      time += item.d + 0.05;
    });
  }

  playRoyalFanfare() {
    if (!this.enabled) return;
    this.init();
    const chords = [
      { f: 392.00, d: 0.18 }, // G4
      { f: 523.25, d: 0.18 }, // C5
      { f: 659.25, d: 0.18 }, // E5
      { f: 783.99, d: 0.35 }, // G5
      { f: 1046.50, d: 0.65 } // C6
    ];
    let time = 0;
    chords.forEach(item => {
      setTimeout(() => {
        this.playTone(item.f, item.d, 'triangle', 0.45);
        this.playTone(item.f * 0.5, item.d, 'sine', 0.3);
      }, time * 1000);
      time += item.d + 0.04;
    });
  }

  playGongStrike() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3 deep gong
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4 overtone
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc2.start();
      osc.stop(this.ctx.currentTime + 1.8);
      osc2.stop(this.ctx.currentTime + 1.8);
    } catch (e) {}
  }

  startBGM() {
    if (!this.enabled || this.bgmRunning) return;
    this.init();
    if (!this.ctx) return;
    this.bgmRunning = true;

    if (this.soundpack === 'angklung') {
      // Sundanese Degung Bamboo Scale
      const scale = [277.18, 311.13, 349.23, 415.30, 466.16, 554.37];
      const pattern = [0, 1, 2, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 1];
      let step = 0;
      this.bgmInterval = setInterval(() => {
        if (!this.enabled || !this.bgmRunning) return;
        const freq = scale[pattern[step % pattern.length]];
        // Bamboo dual hollow pulse
        this.playMarimbaTone(freq, 0.28, 0.04, 'sine');
        setTimeout(() => this.playMarimbaTone(freq * 1.5, 0.18, 0.015, 'triangle'), 60);
        step++;
      }, 360);
    } else if (this.soundpack === 'chiptune') {
      // Retro 8-bit Chiptune Arpeggio
      const scale = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 392.00, 523.25];
      let step = 0;
      this.bgmInterval = setInterval(() => {
        if (!this.enabled || !this.bgmRunning) return;
        const freq = scale[step % scale.length];
        this.playMarimbaTone(freq, 0.18, 0.025, 'square');
        if (step % 4 === 0) {
          this.playMarimbaTone(freq / 2, 0.35, 0.03, 'triangle');
        }
        step++;
      }, 240);
    } else {
      // Gamelan Pelog (Default)
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
      const pattern = [0, 2, 3, 4, 2, 3, 1, 0, 3, 4, 5, 4, 2, 3, 1, 0];
      const bassPattern = [0, 3, 1, 4];
      let step = 0;

      this.bgmInterval = setInterval(() => {
        if (!this.enabled || !this.bgmRunning) return;
        const freq = scale[pattern[step % pattern.length]];
        this.playMarimbaTone(freq, 0.45, 0.035, 'sine');

        // Deep mellow gong bass every 4 steps
        if (step % 4 === 0) {
          const bassFreq = scale[bassPattern[(step / 4) % bassPattern.length]] / 2;
          this.playMarimbaTone(bassFreq, 0.9, 0.045, 'triangle');
        }
        step++;
      }, 420);
    }
  }

  stopBGM() {
    this.bgmRunning = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  playMarimbaTone(freq, duration = 0.5, volume = 0.04, type = 'sine') {
    if (!this.ctx || !this.enabled) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playMysterySound() {
    if (!this.enabled) return;
    this.init();
    const chords = [440, 554.37, 659.25, 880];
    chords.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, 'triangle', 0.25), i * 80);
    });
  }

  playZonkSound() {
    if (!this.enabled) return;
    this.init();
    this.playTone(280, 0.15, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(180, 0.3, 'sawtooth', 0.25), 120);
  }

  playEmotePop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(540, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(820, 0.12, 'sine', 0.22), 60);
  }

  playShieldBlock() {
    if (!this.enabled) return;
    this.init();
    // Resonant metallic gong / shield block
    this.playTone(440, 0.3, 'triangle', 0.4);
    setTimeout(() => this.playTone(660, 0.4, 'sine', 0.3), 80);
  }

  playTriviaCorrect() {
    if (!this.enabled) return;
    this.init();
    const melody = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    melody.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.16, 'triangle', 0.3), i * 90);
    });
  }

  playTriviaWrong() {
    if (!this.enabled) return;
    this.init();
    this.playTone(260, 0.2, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.25), 140);
  }

  playThunder() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      // Sub-Bass Thunder Rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 1.4);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.4);

      // Thunder crackle burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();
    } catch(e) {}
  }

  // ------------------------------------------
  // TTS (Text-to-Speech) Web Speech API
  // ------------------------------------------
  speakBanter(text, dialectId) {
    // Only proceed if AudioSynthesizer is enabled and TTS is supported
    if (!this.enabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';

    if (dialectId === 'jawa') {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
    } else if (dialectId === 'sunda') {
      utterance.pitch = 1.2;
      utterance.rate = 1.1;
    } else if (dialectId === 'batak') {
      utterance.pitch = 0.7;
      utterance.rate = 1.2;
    } else if (dialectId === 'minang') {
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
    } else if (dialectId === 'bugis') {
      utterance.pitch = 1.0;
      utterance.rate = 1.1;
    } else if (dialectId === 'betawi') {
      utterance.pitch = 1.3;
      utterance.rate = 1.2;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const audio = new AudioSynthesizer();
