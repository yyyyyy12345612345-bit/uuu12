'use client';

import * as THREE from 'three';

class WorldCupAudioSynth {
  private ctx: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private crowdPanner: PannerNode | null = null;
  private initialized = false;
  private noiseNode: AudioBufferSourceNode | null = null;
  private breathingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {}

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;

      // Setup initial Listener positioning
      const t = this.ctx.currentTime;
      const listener = this.ctx.listener;
      if (listener.positionX) {
        listener.positionX.setValueAtTime(0, 5, t);
        listener.positionY.setValueAtTime(5, t);
        listener.positionZ.setValueAtTime(13.5, t);
      } else {
        listener.setPosition(0, 5, 13.5);
      }

      this.setupCrowd();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  updateListener(pos: THREE.Vector3, quaternion: THREE.Quaternion) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const listener = this.ctx.listener;

    // Update position
    if (listener.positionX) {
      listener.positionX.setValueAtTime(pos.x, t);
      listener.positionY.setValueAtTime(pos.y, t);
      listener.positionZ.setValueAtTime(pos.z, t);
    } else {
      listener.setPosition(pos.x, pos.y, pos.z);
    }

    // Calculate forward/up vectors from camera orientation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

    if (listener.forwardX) {
      listener.forwardX.setValueAtTime(forward.x, t);
      listener.forwardY.setValueAtTime(forward.y, t);
      listener.forwardZ.setValueAtTime(forward.z, t);
      listener.upX.setValueAtTime(up.x, t);
      listener.upY.setValueAtTime(up.y, t);
      listener.upZ.setValueAtTime(up.z, t);
    } else {
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  createPanner(position: [number, number, number]): PannerNode | null {
    this.init();
    if (!this.ctx) return null;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 50;
    panner.rollOffFactor = 1;

    const t = this.ctx.currentTime;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(position[0], t);
      panner.positionY.setValueAtTime(position[1], t);
      panner.positionZ.setValueAtTime(position[2], t);
    } else {
      panner.setPosition(position[0], position[1], position[2]);
    }
    return panner;
  }

  private setupCrowd() {
    if (!this.ctx) return;

    // Create white noise source
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2.5; // 2.5 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Spatial Panner at center stadium pitch
    this.crowdPanner = this.createPanner([0, 0, 0])!;

    // Bandpass to muffle frequencies representing roar
    this.crowdFilter = this.ctx.createBiquadFilter();
    this.crowdFilter.type = 'bandpass';
    this.crowdFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.crowdFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(750, this.ctx.currentTime);

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    // Chain
    this.noiseNode.connect(this.crowdFilter);
    this.crowdFilter.connect(lowpass);
    lowpass.connect(this.crowdPanner);
    this.crowdPanner.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);

    this.noiseNode.start(0);

    const modulate = () => {
      if (!this.ctx || !this.crowdFilter) return;
      const t = this.ctx.currentTime;
      // Roar modulation wave simulation
      this.crowdFilter.frequency.setValueAtTime(280 + Math.sin(t * 0.45) * 60, t);
      this.crowdFilter.Q.setValueAtTime(0.7 + Math.sin(t * 0.8) * 0.2, t);
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
    const panner = this.createPanner([0, 1.6, -4]); // tick localized inside preloader tunnel

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);

    gainNode.gain.setValueAtTime(0.12, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gainNode);
    if (panner) {
      gainNode.connect(panner);
      panner.connect(this.ctx.destination);
    } else {
      gainNode.connect(this.ctx.destination);
    }

    osc.start(t);
    osc.stop(t + 0.05);
  }

  startBreathing() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Spatial panner in deep tunnel [0, 1.6, -4.5]
    const panner = this.createPanner([0, 1.6, -4.5]);
    const connectionNode = panner ? panner : this.ctx.destination;
    if (panner) panner.connect(this.ctx.destination);

    // Generate white noise buffer for breathing textures
    const sampleRate = this.ctx.sampleRate;
    const breathBuffer = this.ctx.createBuffer(1, sampleRate * 1.0, sampleRate);
    const data = breathBuffer.getChannelData(0);
    for (let i = 0; i < breathBuffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const runBreathing = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Inhale
      const inhaleNode = this.ctx.createBufferSource();
      inhaleNode.buffer = breathBuffer;
      const inhaleFilter = this.ctx.createBiquadFilter();
      inhaleFilter.type = 'bandpass';
      inhaleFilter.frequency.setValueAtTime(240, t);
      inhaleFilter.frequency.exponentialRampToValueAtTime(450, t + 0.45);
      inhaleFilter.Q.setValueAtTime(1.2, t);

      const inhaleGain = this.ctx.createGain();
      inhaleGain.gain.setValueAtTime(0.001, t);
      inhaleGain.gain.linearRampToValueAtTime(0.08, t + 0.35);
      inhaleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      inhaleNode.connect(inhaleFilter);
      inhaleFilter.connect(inhaleGain);
      inhaleGain.connect(connectionNode);
      inhaleNode.start(t);
      inhaleNode.stop(t + 0.6);

      // 2. Exhale
      const exTime = t + 0.85;
      const exhaleNode = this.ctx.createBufferSource();
      exhaleNode.buffer = breathBuffer;
      const exhaleFilter = this.ctx.createBiquadFilter();
      exhaleFilter.type = 'bandpass';
      exhaleFilter.frequency.setValueAtTime(420, exTime);
      exhaleFilter.frequency.exponentialRampToValueAtTime(180, exTime + 0.5);
      exhaleFilter.Q.setValueAtTime(0.9, exTime);

      const exhaleGain = this.ctx.createGain();
      exhaleGain.gain.setValueAtTime(0.001, exTime);
      exhaleGain.gain.linearRampToValueAtTime(0.12, exTime + 0.25);
      exhaleGain.gain.exponentialRampToValueAtTime(0.001, exTime + 0.6);

      exhaleNode.connect(exhaleFilter);
      exhaleFilter.connect(exhaleGain);
      exhaleGain.connect(connectionNode);
      exhaleNode.start(exTime);
      exhaleNode.stop(exTime + 0.65);
    };

    runBreathing();
    this.breathingInterval = setInterval(runBreathing, 1850);
  }

  stopBreathing() {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
  }

  playKick() {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const panner = this.createPanner([0, 0, 0])!; // localized at kickoff center
    panner.connect(this.ctx.destination);

    // Kicking low frequency pitch drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);

    oscGain.gain.setValueAtTime(0.85, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(oscGain);
    oscGain.connect(panner);
    osc.start(t);
    osc.stop(t + 0.25);

    // Cleat crack sound (pop)
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(950, t);
    pop.frequency.exponentialRampToValueAtTime(250, t + 0.04);

    popGain.gain.setValueAtTime(0.4, t);
    popGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    pop.connect(popGain);
    popGain.connect(panner);
    pop.start(t);
    pop.stop(t + 0.06);
  }

  playFirework(position: [number, number, number]) {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const panner = this.createPanner(position);
    const targetNode = panner ? panner : this.ctx.destination;
    if (panner) panner.connect(this.ctx.destination);

    // Low-end firework boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(120, t);
    boomOsc.frequency.linearRampToValueAtTime(25, t + 0.4);

    boomGain.gain.setValueAtTime(0.7, t);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    boomOsc.connect(boomGain);
    boomGain.connect(targetNode);
    boomOsc.start(t);
    boomOsc.stop(t + 0.5);

    // Crackle sizzles (White noise burst)
    const crackleBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
    const data = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleBuffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const crackleSrc = this.ctx.createBufferSource();
    crackleSrc.buffer = crackleBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, t);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.2, t);
    crackleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    crackleSrc.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(targetNode);
    crackleSrc.start(t);
    crackleSrc.stop(t + 0.3);
  }

  startCrowdRoar() {
    this.init();
    if (!this.ctx || !this.crowdGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.2, t + 3.0);
  }

  boostCrowdRoar() {
    if (!this.ctx || !this.crowdGain) return;
    const t = this.ctx.currentTime;
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.65, t + 0.4);
  }

  fadeCrowdRoar() {
    if (!this.ctx || !this.crowdGain) return;
    const t = this.ctx.currentTime;
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.0001, t + 2.5);
  }
}

export const audioSynth = new WorldCupAudioSynth();
