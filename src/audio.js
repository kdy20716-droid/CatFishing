/**
 * Web Audio API Lo-Fi & Ambience Synthesizer
 * 100% Pure synthesized audio engine - No external audio assets required!
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 1.0;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;
    this.ambientVolume = 0.35;

    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.ambientGain = null;

    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.currentChordIndex = 0;
    this.timeOfDay = 'day'; // 'day', 'sunset', 'night'
    this.forcedTheme = null; // null, 'day', 'sunset', 'night'

    // Load saved sound settings from localStorage
    this.loadSettings();

    // Lo-Fi Chord Progressions (Frequencies in Hz)
    // Cmaj9 -> Am9 -> Dm9 -> G13 (Day)
    this.dayChords = [
      [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9 (C4, E4, G4, B4, D5)
      [220.00, 261.63, 329.63, 392.00, 493.88], // Am9 (A3, C4, E4, G4, B4)
      [146.83, 220.00, 261.63, 349.23, 440.00], // Dm9 (D3, A3, C4, F4, A4)
      [196.00, 246.94, 293.66, 349.23, 440.00, 659.25] // G13 (G3, B3, D4, F4, A4, E5)
    ];

    // Fmaj7 -> Em7 -> Dm7 -> Cmaj7 (Sunset)
    this.sunsetChords = [
      [174.61, 220.00, 261.63, 329.63, 440.00], // Fmaj9
      [164.81, 196.00, 246.94, 293.66, 392.00], // Em7
      [146.83, 174.61, 220.00, 261.63, 349.23], // Dm7
      [130.81, 164.81, 196.00, 246.94, 329.63]  // Cmaj7
    ];

    // Abmaj7 -> Ebmaj7 -> Fm7 -> Bb9 (Night/Starlight)
    this.nightChords = [
      [207.65, 261.63, 311.13, 392.00, 466.16], // Abmaj9
      [155.56, 196.00, 233.08, 293.66, 349.23], // Ebmaj7
      [174.61, 207.65, 261.63, 311.13, 392.00], // Fm7
      [116.54, 146.83, 174.61, 233.08, 293.66, 440.00] // Bb9
    ];

    this.initContext();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('cozy_cat_sound_settings_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.isMuted === 'boolean') this.isMuted = data.isMuted;
        if (typeof data.masterVolume === 'number') this.masterVolume = Math.max(0, Math.min(1, data.masterVolume));
        if (typeof data.bgmVolume === 'number') this.bgmVolume = Math.max(0, Math.min(1, data.bgmVolume));
        if (typeof data.sfxVolume === 'number') this.sfxVolume = Math.max(0, Math.min(1, data.sfxVolume));
        if (typeof data.ambientVolume === 'number') this.ambientVolume = Math.max(0, Math.min(1, data.ambientVolume));
        if (typeof data.forcedTheme === 'string') this.forcedTheme = data.forcedTheme;
      }
    } catch (e) {
      console.warn("Failed to load sound settings:", e);
    }
  }

  saveSettings() {
    try {
      const data = {
        isMuted: this.isMuted,
        masterVolume: this.masterVolume,
        bgmVolume: this.bgmVolume,
        sfxVolume: this.sfxVolume,
        ambientVolume: this.ambientVolume,
        forcedTheme: this.forcedTheme
      };
      localStorage.setItem('cozy_cat_sound_settings_v1', JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save sound settings:", e);
    }
  }

  initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      const initialMaster = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(initialMaster, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Start gentle ambient ocean waves
      this.startOceanWaves();
    } catch (e) {
      console.warn("AudioContext could not be initialized yet:", e);
    }
  }

  ensureRunning() {
    if (!this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute) {
    this.isMuted = mute;
    this.saveSettings();
    if (this.masterGain && this.ctx) {
      const target = mute ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  setBgmVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.05);
    }
  }

  setBgmTheme(theme) {
    this.forcedTheme = (theme === 'auto') ? null : theme;
    this.saveSettings();
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
  }

  // --- Ocean Wave Ambience Synthesizer ---
  startOceanWaves() {
    if (!this.ctx) return;
    try {
      // Pink/Brown noise generator for rolling waves
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.12;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Dynamic Bandpass Filter for wave sound (wash and recede)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      // Low frequency oscillator for wave rhythm (1 cycle per ~6 seconds)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // ~5.5s wave cycle

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(280, this.ctx.currentTime); // modulate filter 120Hz to 400Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const waveGain = this.ctx.createGain();
      waveGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      // LFO modulate volume slightly
      const lfoVol = this.ctx.createGain();
      lfoVol.gain.setValueAtTime(0.12, this.ctx.currentTime);
      lfo.connect(lfoVol);
      lfoVol.connect(waveGain.gain);

      whiteNoise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(this.ambientGain);

      lfo.start();
      whiteNoise.start();
    } catch (e) {
      console.warn("Wave synth failed:", e);
    }
  }

  // --- Lo-Fi Chill Music Generator ---
  startBgm() {
    this.ensureRunning();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.currentChordIndex = 0;
    this.playNextLofiChord();
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playTestSfx(type) {
    this.ensureRunning();
    switch (type) {
      case 'cast': this.playCast(); break;
      case 'bite': this.playBite(); break;
      case 'coin': this.playCoin(); break;
      case 'bubble': this.playBubble(); break;
      case 'levelUp': this.playLevelUp(); break;
      case 'splash': this.playSplash(); break;
      default: this.playClick(); break;
    }
  }

  playNextLofiChord() {
    if (!this.isBgmPlaying || !this.ctx) return;

    const activeTheme = this.forcedTheme || this.timeOfDay;
    let chords = this.dayChords;
    if (activeTheme === 'sunset') chords = this.sunsetChords;
    if (activeTheme === 'night') chords = this.nightChords;

    const chord = chords[this.currentChordIndex % chords.length];
    this.currentChordIndex++;

    const now = this.ctx.currentTime;
    const chordDuration = 3.6; // Seconds per chord bar

    // Play electric piano / warm keys voicing
    chord.forEach((freq, i) => {
      // Slight strum delay per note for warmth
      const noteDelay = i * 0.045;
      this.playLofiNote(freq, now + noteDelay, chordDuration - noteDelay);
    });

    // Occasional gentle high sparkle note / melodic arpeggio
    if (Math.random() < 0.65) {
      const topNote = chord[Math.floor(Math.random() * chord.length)] * 2;
      const sparkleDelay = 1.4 + Math.random() * 1.2;
      this.playSparkleNote(topNote, now + sparkleDelay);
    }

    // Schedule next bar
    this.bgmTimer = setTimeout(() => {
      this.playNextLofiChord();
    }, chordDuration * 1000);
  }

  playLofiNote(freq, startTime, duration) {
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Rhodes-like tone: warm triangle + soft sine sub/overtone
    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 2, startTime); // 1 octave overtone

    // Soft low pass filter with warmth
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, startTime);
    filter.frequency.exponentialRampToValueAtTime(320, startTime + duration);

    // Warm envelope
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(0.09, startTime + 0.08); // soft attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.bgmGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);
  }

  playSparkleNote(freq, startTime) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, startTime);
    filter.Q.setValueAtTime(4.0, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.035, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(startTime);
    osc.stop(startTime + 1.3);
  }

  playCast() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 1. Fast Whip Swoosh (바람을 가르는 시원한 채찍 소리)
    const whipOsc = this.ctx.createOscillator();
    const whipGain = this.ctx.createGain();
    const whipFilter = this.ctx.createBiquadFilter();

    whipOsc.type = 'sawtooth';
    whipOsc.frequency.setValueAtTime(450, now);
    whipOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    whipOsc.frequency.exponentialRampToValueAtTime(120, now + 0.28);

    whipFilter.type = 'bandpass';
    whipFilter.frequency.setValueAtTime(600, now);
    whipFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
    whipFilter.frequency.exponentialRampToValueAtTime(250, now + 0.28);
    whipFilter.Q.setValueAtTime(2.5, now);

    whipGain.gain.setValueAtTime(0.001, now);
    whipGain.gain.linearRampToValueAtTime(0.35, now + 0.06);
    whipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    whipOsc.connect(whipFilter);
    whipFilter.connect(whipGain);
    whipGain.connect(this.sfxGain);

    whipOsc.start(now);
    whipOsc.stop(now + 0.3);

    // 2. Line Reel Zip (낚싯줄이 촤르륵 풀려나가는 회전 마찰음)
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Rapid intermittent flutter
      const flutter = Math.sin(i * 0.05) > 0 ? 1 : -0.8;
      data[i] = (Math.random() * 2 - 1) * flutter * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }

    const lineNoise = this.ctx.createBufferSource();
    lineNoise.buffer = buffer;

    const lineFilter = this.ctx.createBiquadFilter();
    lineFilter.type = 'highpass';
    lineFilter.frequency.setValueAtTime(2200, now);
    lineFilter.frequency.exponentialRampToValueAtTime(800, now + 0.32);

    const lineGain = this.ctx.createGain();
    lineGain.gain.setValueAtTime(0.001, now);
    lineGain.gain.linearRampToValueAtTime(0.22, now + 0.05);
    lineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    lineNoise.connect(lineFilter);
    lineFilter.connect(lineGain);
    lineGain.connect(this.sfxGain);

    lineNoise.start(now + 0.04);
  }

  playCruiseHorn() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep, warm nautical ship horn (Bb2 + F3 + D4 harmony)
    const freqs = [116.54, 174.61, 233.08];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.015, now + 1.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + 0.15);
      gain.gain.setValueAtTime(0.15 / (idx + 1), now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.85);
    });
  }

  playSplash(intensity = 1.0) {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Low Thud (water displacement)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    oscGain.gain.setValueAtTime(0.3 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);

    // 2. Water Plop Noise (퐁당~)
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.28);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
  }

  playReelClick() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  playBite() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Alert ping + water splash
    [523.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.18, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.21);
    });

    this.playSplash(0.6);
  }

  playMeow(variant = 0) {
    this.playCatMeow(variant);
  }

  playCatMeow(variant = 0) {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pick random cute pitch contour variation
    const meowTypes = [
      { startPitch: 460, peakPitch: 780, endPitch: 420, duration: 0.48, f1: 850, f2: 2100 }, // Nyaaang~! (Joyful)
      { startPitch: 520, peakPitch: 860, endPitch: 480, duration: 0.42, f1: 950, f2: 2300 }, // Nyaa-ong! (High & Bright)
      { startPitch: 430, peakPitch: 720, endPitch: 360, duration: 0.54, f1: 800, f2: 1900 }  // Myaang~ (Sweet & Purry)
    ];
    const m = meowTypes[Math.floor(Math.random() * meowTypes.length)];

    // 1. Dual Vocal Cord Oscillators (Sawtooth + Pulse/Triangle for rich feline vocal timbre)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const voiceGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Pitch contour: natural smooth vocal arc
    osc1.frequency.setValueAtTime(m.startPitch, now);
    osc1.frequency.exponentialRampToValueAtTime(m.peakPitch, now + m.duration * 0.35);
    osc1.frequency.exponentialRampToValueAtTime(m.endPitch, now + m.duration);

    osc2.frequency.setValueAtTime(m.startPitch * 1.005, now);
    osc2.frequency.exponentialRampToValueAtTime(m.peakPitch * 1.005, now + m.duration * 0.35);
    osc2.frequency.exponentialRampToValueAtTime(m.endPitch * 1.005, now + m.duration);

    // Natural Vibrato LFO
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.8, now); // ~5.8 Hz natural feline vibrato
    vibratoGain.gain.setValueAtTime(14, now);
    vibrato.connect(osc1.frequency);
    vibrato.connect(osc2.frequency);
    vibrato.start(now);
    vibrato.stop(now + m.duration + 0.1);

    // 2. Formant Filters (F1: Throat pharyngeal vowel, F2: Nasal mouth resonance for 'nya')
    const formant1 = this.ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(m.f1 * 0.85, now);
    formant1.frequency.exponentialRampToValueAtTime(m.f1 * 1.35, now + m.duration * 0.35);
    formant1.frequency.exponentialRampToValueAtTime(m.f1 * 0.75, now + m.duration);
    formant1.Q.setValueAtTime(3.8, now);

    const formant2 = this.ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.frequency.setValueAtTime(m.f2 * 0.9, now);
    formant2.frequency.exponentialRampToValueAtTime(m.f2 * 1.25, now + m.duration * 0.35);
    formant2.frequency.exponentialRampToValueAtTime(m.f2 * 0.8, now + m.duration);
    formant2.Q.setValueAtTime(5.5, now);

    // 3. Amplitude Envelope (Soft nasal attack -> expressive body -> soft vocal tail)
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(0.24, now + 0.07);
    voiceGain.gain.exponentialRampToValueAtTime(0.18, now + m.duration * 0.6);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + m.duration);

    // Connect audio graph
    osc1.connect(voiceGain);
    osc2.connect(voiceGain);
    voiceGain.connect(formant1);
    voiceGain.connect(formant2);
    formant1.connect(this.sfxGain);
    formant2.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + m.duration + 0.05);
    osc2.stop(now + m.duration + 0.05);
  }

  playCatch(rarity = 'common') {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.playCatMeow();

    // Fanfare Notes
    let notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (Common)
    if (rarity === 'rare') {
      notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    } else if (rarity === 'epic') {
      notes = [440.00, 554.37, 659.25, 880.00, 1108.73, 1318.51];
    } else if (rarity === 'legendary' || rarity === 'mythic') {
      notes = [392.00, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98];
    }

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = (rarity === 'legendary' || rarity === 'mythic') ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  playBubble() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 300 + Math.random() * 200;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.12);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playCoin() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [987.77, 1318.51].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.36);
    });
  }

  playClick() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playRocket() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Rocket Whoosh Whistle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.65);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.65);
    filter.Q.setValueAtTime(3.0, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.72);

    // 2. Fire cracker fizzle pop
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(600, t);
      popOsc.frequency.exponentialRampToValueAtTime(150, t + 0.15);
      popGain.gain.setValueAtTime(0.25, t);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      popOsc.connect(popGain);
      popGain.connect(this.sfxGain);
      popOsc.start(t);
      popOsc.stop(t + 0.16);
    }, 280);
  }

  playBombExplosion() {
    this.ensureRunning();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Heavy Underwater Sub-bass Thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);

    // 2. Underwater Muffled Noise Blast
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }
}
