// Pure WebAudio 8-Bit Chiptune & Retro SFX Engine

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private noteIndex: number = 0;

  // Romantic 8-bit Canon / JRPG Village Wedding Melody (frequencies in Hz)
  private melodyNotes: { freq: number; bass: number; dur: number }[] = [
    // Bar 1 (D major -> A major)
    { freq: 587.33, bass: 146.83, dur: 0.28 }, // D5
    { freq: 440.0, bass: 146.83, dur: 0.28 },  // A4
    { freq: 587.33, bass: 146.83, dur: 0.28 }, // D5
    { freq: 739.99, bass: 146.83, dur: 0.28 }, // F#5
    { freq: 659.25, bass: 110.0, dur: 0.28 },  // E5
    { freq: 440.0, bass: 110.0, dur: 0.28 },   // A4
    { freq: 554.37, bass: 110.0, dur: 0.28 },  // C#5
    { freq: 659.25, bass: 110.0, dur: 0.28 },  // E5
    // Bar 2 (B minor -> F# minor)
    { freq: 587.33, bass: 123.47, dur: 0.28 }, // D5
    { freq: 493.88, bass: 123.47, dur: 0.28 }, // B4
    { freq: 587.33, bass: 123.47, dur: 0.28 }, // D5
    { freq: 493.88, bass: 123.47, dur: 0.28 }, // B4
    { freq: 554.37, bass: 185.0, dur: 0.28 },  // C#5
    { freq: 369.99, bass: 185.0, dur: 0.28 },  // F#4
    { freq: 440.0, bass: 185.0, dur: 0.28 },   // A4
    { freq: 554.37, bass: 185.0, dur: 0.28 },  // C#5
    // Bar 3 (G major -> D major)
    { freq: 493.88, bass: 196.0, dur: 0.28 },  // B4
    { freq: 392.0, bass: 196.0, dur: 0.28 },   // G4
    { freq: 493.88, bass: 196.0, dur: 0.28 },  // B4
    { freq: 587.33, bass: 196.0, dur: 0.28 },  // D5
    { freq: 440.0, bass: 146.83, dur: 0.28 },  // A4
    { freq: 369.99, bass: 146.83, dur: 0.28 }, // F#4
    { freq: 440.0, bass: 146.83, dur: 0.28 },  // A4
    { freq: 587.33, bass: 146.83, dur: 0.28 }, // D5
    // Bar 4 (G major -> A major resolution)
    { freq: 493.88, bass: 196.0, dur: 0.28 },  // B4
    { freq: 587.33, bass: 196.0, dur: 0.28 },  // D5
    { freq: 659.25, bass: 196.0, dur: 0.28 },  // E5
    { freq: 587.33, bass: 196.0, dur: 0.28 },  // D5
    { freq: 554.37, bass: 220.0, dur: 0.28 },  // C#5
    { freq: 659.25, bass: 220.0, dur: 0.28 },  // E5
    { freq: 739.99, bass: 220.0, dur: 0.28 },  // F#5
    { freq: 659.25, bass: 220.0, dur: 0.28 },  // E5
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBgm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.isMuted = false;
      this.startBgm();
      return true;
    }
  }

  public startBgm() {
    if (this.isBgmPlaying || this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.isBgmPlaying = true;
    this.scheduleNextNote();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextNote() {
    if (!this.isBgmPlaying || this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const note = this.melodyNotes[this.noteIndex % this.melodyNotes.length];
    this.noteIndex++;

    const now = ctx.currentTime;

    // Lead square wave (soft chiptune)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(note.freq, now);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.dur * 0.92);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + note.dur);

    // Bass triangle wave
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(note.bass, now);
    bassGain.gain.setValueAtTime(0.04, now);
    bassGain.gain.exponentialRampToValueAtTime(0.002, now + note.dur * 0.95);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + note.dur);

    this.bgmTimer = window.setTimeout(() => {
      this.scheduleNextNote();
    }, note.dur * 1000);
  }

  public playBlip(pitch = 680) {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playStep() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.045);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playSelect() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + idx * 0.055);
      gain.gain.setValueAtTime(0.04, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.1);
    });
  }

  public playCoin() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.075); // E6
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playDamage() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.18);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playFanfare() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0, d: 0.11 },     // C5
      { f: 659.25, t: 0.11, d: 0.11 },  // E5
      { f: 783.99, t: 0.22, d: 0.11 },  // G5
      { f: 1046.5, t: 0.33, d: 0.35 },  // C6
    ];
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.055, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }
}

export const soundEngine = new RetroSoundEngine();
