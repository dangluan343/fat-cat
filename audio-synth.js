/**
 * Meow 2D - Procedural Web Audio Synthesizer
 * Generates cozy, retro, and realistic pet audio effects dynamically
 * No external audio files needed!
 */

class CatAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.purrSource = null;
    this.purrGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopPurr();
      this.stopBGM();
    }
    return this.isMuted;
  }

  // Cute Meow sound (frequency sweep with expressive formant)
  meow(type = 'normal') {
    if (this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.Q.value = 3.5;

    let startFreq = 480;
    let peakFreq = 720;
    let endFreq = 380;
    let duration = 0.45;

    if (type === 'happy') {
      // Shorter chirp
      startFreq = 600;
      peakFreq = 950;
      endFreq = 700;
      duration = 0.3;
    } else if (type === 'hungry') {
      // Long pleading meow
      startFreq = 440;
      peakFreq = 880;
      endFreq = 340;
      duration = 0.65;
    } else if (type === 'purr-chirp') {
      // Trill / mrrp
      startFreq = 520;
      peakFreq = 680;
      endFreq = 540;
      duration = 0.25;
    }

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.35);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    filter.frequency.setValueAtTime(startFreq * 1.5, now);
    filter.frequency.exponentialRampToValueAtTime(peakFreq * 1.6, now + duration * 0.35);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 1.2, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // Realistic cat purring loop using modulated filtered noise
  startPurr() {
    if (this.isMuted || this.purrGain) return;
    this.init();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to cat purr resonance (approx 25-50Hz rumble with overtones)
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(65, now);

    // LFO for the breathing/purring pulse (approx 22-26 Hz)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, now);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.6, now);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(0.18, now + 0.3);

    whiteNoise.connect(lowpass);
    lowpass.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    this.purrSource = whiteNoise;
    this.purrGain = mainGain;
  }

  stopPurr() {
    if (this.purrGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.purrGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      setTimeout(() => {
        if (this.purrSource) {
          try { this.purrSource.stop(); } catch (e) {}
          this.purrSource = null;
        }
        this.purrGain = null;
      }, 250);
    }
  }

  // Crunchy chewing sound when eating
  crunch() {
    if (this.isMuted) return;
    this.init();

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.06;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          output[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200 + Math.random() * 600, now);
        filter.Q.value = 2;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      }, i * 110);
    }
  }

  // Lapping milk sound
  slurp() {
    if (this.isMuted) return;
    this.init();

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }, i * 120);
    }
  }

  // Cute pop / heart burst
  pop() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Coin collect retro chime
  coin() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.36);
  }

  // Level Up fanfare chord
  levelUp() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
      }, idx * 90);
    });
  }

  // Gentle sleepy yawn
  yawn() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(280, now + 1.1);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.15);
  }

  // Play toy squeak
  squeak() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2100, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Hiss: high-passed white noise burst, fast attack and slow fade
  hiss() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const duration = 0.7;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(2500, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }

  // Cozy procedural Lo-fi chord BGM (warm Rhodes chords)
  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  startBGM() {
    if (this.isMuted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;

    // Chords: Cmaj9 -> Am9 -> Dm9 -> G13 (warm lofi progression)
    const chords = [
      [261.63, 329.63, 392.00, 493.88, 587.33], // C, E, G, B, D
      [220.00, 261.63, 329.63, 392.00, 493.88], // A, C, E, G, B
      [293.66, 349.23, 440.00, 523.25, 587.33], // D, F, A, C, E
      [196.00, 246.94, 293.66, 370.00, 440.00]  // G, B, D, F#, A
    ];

    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = chords[chordIndex];

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.02);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.02);
        osc.stop(now + 2.9);
      });

      chordIndex = (chordIndex + 1) % chords.length;
      this.bgmTimer = setTimeout(playNextChord, 3000);
    };

    playNextChord();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// Global instance
window.catAudio = new CatAudioEngine();
