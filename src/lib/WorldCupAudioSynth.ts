'use client';

class WorldCupAudioSynth {
  private ctx: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private initialized = false;
  private noiseNode: AudioBufferSourceNode | null = null;

  constructor() {}

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;
      this.setupCrowd();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  private setupCrowd() {
    if (!this.ctx) return;
    
    // Create white noise source buffer
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Bandpass filter to isolate the roar frequencies (approx 250-450Hz)
    this.crowdFilter = this.ctx.createBiquadFilter();
    this.crowdFilter.type = 'bandpass';
    this.crowdFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.crowdFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    // Lowpass filter to make it sound muffled, deep, and stadium-like
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(800, this.ctx.currentTime);

    // Gain node for volume control
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.noiseNode.connect(this.crowdFilter);
    this.crowdFilter.connect(lowpass);
    lowpass.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);

    this.noiseNode.start(0);

    // Slow amplitude and frequency modulation to simulate crowd waves/chants
    const modulate = () => {
      if (!this.ctx || !this.crowdFilter || !this.crowdGain) return;
      const t = this.ctx.currentTime;
      // Modulate central bandpass frequency between 270Hz and 370Hz
      this.crowdFilter.frequency.setValueAtTime(320 + Math.sin(t * 0.4) * 50, t);
      // Modulate Q slightly
      this.crowdFilter.Q.setValueAtTime(0.8 + Math.sin(t * 0.7) * 0.25, t);
      
      // Keep modulation ticking
      setTimeout(modulate, 100);
    };
    modulate();
  }

  playTick() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t); // clear tick at A5 note

    gainNode.gain.setValueAtTime(0.12, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playKick() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    
    // Pitch-dropped sine wave for the heavy ball strike sub-bass impact
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    oscGain.gain.setValueAtTime(0.85, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);

    // Filtered noise pop for the leather kick sound
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(280, t);
    noiseFilter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noiseSrc.start(t);
    noiseSrc.stop(t + 0.1);
  }

  startCrowdRoar() {
    this.init();
    if (!this.ctx || !this.crowdGain) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.18, t + 3.0); // Ambient stadium roar
  }

  boostCrowdRoar() {
    if (!this.ctx || !this.crowdGain) return;
    const t = this.ctx.currentTime;
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.55, t + 0.4); // Stadium swell on reveal/kick
  }

  fadeCrowdRoar() {
    if (!this.ctx || !this.crowdGain) return;
    const t = this.ctx.currentTime;
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.0001, t + 2.5); // Fades out over 2.5s
  }
}

export const audioSynth = new WorldCupAudioSynth();
