import { SoundscapeMode } from '../types/study';

class CozyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeMode: SoundscapeMode = 'off';
  private activeNodes: AudioNode[] = [];
  private timers: number[] = [];
  private currentVolume = 0.45;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.currentVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.08);
    }
  }

  public playChime(kind: 'start' | 'complete' | 'click' = 'complete') {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.16;
    out.connect(ctx.destination);

    // Gentle GBA-inspired warm triangle/sine notes
    const notes =
      kind === 'start'
        ? [523.25, 659.25] // C5 -> E5
        : kind === 'click'
          ? [440]
          : [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6

    const step = kind === 'click' ? 0.05 : 0.14;
    const dur = kind === 'click' ? 0.08 : 0.55;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = kind === 'click' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * step);

      noteGain.gain.setValueAtTime(0.0001, now + idx * step);
      noteGain.gain.exponentialRampToValueAtTime(0.35, now + idx * step + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * step + dur);

      osc.connect(noteGain);
      noteGain.connect(out);
      osc.start(now + idx * step);
      osc.stop(now + idx * step + dur + 0.04);
    });
  }

  public setSoundscape(mode: SoundscapeMode, volume?: number) {
    if (typeof volume === 'number') {
      this.currentVolume = Math.max(0, Math.min(1, volume));
    }
    if (this.activeMode === mode) {
      this.setVolume(this.currentVolume);
      return;
    }

    this.stopSoundscape();
    this.activeMode = mode;
    if (mode === 'off') return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.masterGain.gain.setValueAtTime(this.currentVolume, ctx.currentTime);

    if (mode === 'rain') {
      this.startRain(ctx, this.masterGain);
    } else if (mode === 'vinyl') {
      this.startVinyl(ctx, this.masterGain);
    } else if (mode === 'crickets') {
      this.startCrickets(ctx, this.masterGain);
    }
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRain(ctx: AudioContext, dest: AudioNode) {
    const src = ctx.createBufferSource();
    src.buffer = this.createPinkNoiseBuffer(ctx, 5);
    src.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1150;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 220;

    const gain = ctx.createGain();
    gain.gain.value = 0.45;

    src.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(dest);
    src.start();

    this.activeNodes.push(src, lowpass, highpass, gain);

    // Subtle raindrop plinks
    const scheduleDrop = () => {
      if (this.activeMode !== 'rain' || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 650 + Math.random() * 900;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.045);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.025, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.07);

      const nextMs = 180 + Math.random() * 520;
      const id = window.setTimeout(scheduleDrop, nextMs);
      this.timers.push(id);
    };
    const id = window.setTimeout(scheduleDrop, 300);
    this.timers.push(id);
  }

  private startVinyl(ctx: AudioContext, dest: AudioNode) {
    // Warm soft room hum + subtle vinyl crackles
    const src = ctx.createBufferSource();
    src.buffer = this.createPinkNoiseBuffer(ctx, 4);
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;

    const humGain = ctx.createGain();
    humGain.gain.value = 0.25;

    src.connect(lp);
    lp.connect(humGain);
    humGain.connect(dest);
    src.start();

    // Very soft warm Rhodes-like drone chord (Fmaj7 low)
    const freqs = [174.61, 220.0, 261.63];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.value = 0.018;
      osc.connect(g);
      g.connect(dest);
      osc.start();
      this.activeNodes.push(osc, g);
    });

    this.activeNodes.push(src, lp, humGain);

    const schedulePop = () => {
      if (this.activeMode !== 'vinyl' || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.015);
      const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const pop = this.ctx.createBufferSource();
      pop.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800 + Math.random() * 1400;
      const g = this.ctx.createGain();
      g.gain.value = 0.04 + Math.random() * 0.04;
      pop.connect(bp);
      bp.connect(g);
      g.connect(this.masterGain);
      pop.start(t);

      const id = window.setTimeout(schedulePop, 120 + Math.random() * 680);
      this.timers.push(id);
    };
    const id = window.setTimeout(schedulePop, 200);
    this.timers.push(id);
  }

  private startCrickets(ctx: AudioContext, dest: AudioNode) {
    // Gentle night air breeze
    const src = ctx.createBufferSource();
    src.buffer = this.createPinkNoiseBuffer(ctx, 5);
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;

    const g = ctx.createGain();
    g.gain.value = 0.22;

    src.connect(lp);
    lp.connect(g);
    g.connect(dest);
    src.start();
    this.activeNodes.push(src, lp, g);

    const scheduleChirp = () => {
      if (this.activeMode !== 'crickets' || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const pulses = 3 + Math.floor(Math.random() * 2);
      const freq = 3600 + Math.random() * 350;

      for (let i = 0; i < pulses; i++) {
        const start = t + i * 0.055;
        const osc = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        cg.gain.setValueAtTime(0.0001, start);
        cg.gain.exponentialRampToValueAtTime(0.022, start + 0.012);
        cg.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
        osc.connect(cg);
        cg.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.045);
      }

      const id = window.setTimeout(scheduleChirp, 900 + Math.random() * 2100);
      this.timers.push(id);
    };
    const id = window.setTimeout(scheduleChirp, 400);
    this.timers.push(id);
  }

  public stopSoundscape() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already-stopped nodes
      }
    });
    this.activeNodes = [];
    this.activeMode = 'off';
  }
}

export const cozyAudio = new CozyAudioEngine();
