// Warm Music-Box Chiptune & Gentle Retro SFX Engine (Sine & Triangle Waves)

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private noteIndex: number = 0;

  // Romantic Music-Box Canon in D (gentle, warm wedding melody)
  private melodyNotes: { freq: number; bass: number; dur: number }[] = [
    { freq: 739.99, bass: 293.66, dur: 0.42 }, // F#5 / D4
    { freq: 880.0, bass: 293.66, dur: 0.42 },  // A5
    { freq: 659.25, bass: 220.0, dur: 0.42 },  // E5 / A3
    { freq: 880.0, bass: 220.0, dur: 0.42 },   // A5
    { freq: 587.33, bass: 246.94, dur: 0.42 }, // D5 / B3
    { freq: 739.99, bass: 246.94, dur: 0.42 }, // F#5
    { freq: 554.37, bass: 185.0, dur: 0.42 },  // C#5 / F#3
    { freq: 659.25, bass: 185.0, dur: 0.42 },  // E5
    { freq: 493.88, bass: 196.0, dur: 0.42 },  // B4 / G3
    { freq: 587.33, bass: 196.0, dur: 0.42 },  // D5
    { freq: 440.0, bass: 146.83, dur: 0.42 },  // A4 / D3
    { freq: 587.33, bass: 146.83, dur: 0.42 }, // D5
    { freq: 493.88, bass: 196.0, dur: 0.42 },  // B4 / G3
    { freq: 659.25, bass: 196.0, dur: 0.42 },  // E5
    { freq: 554.37, bass: 220.0, dur: 0.42 },  // C#5 / A3
    { freq: 659.25, bass: 220.0, dur: 0.42 },  // E5
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

    // Gentle Music Box Bell (sine wave with soft decay)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.dur * 1.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + note.dur * 1.2);

    // Warm Harp Accompaniment (triangle wave)
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(note.bass, now);
    bassGain.gain.setValueAtTime(0.025, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + note.dur * 1.1);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + note.dur * 1.15);

    this.bgmTimer = window.setTimeout(() => {
      this.scheduleNextNote();
    }, note.dur * 1000);
  }

  public playBlip(pitch = 660) {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playStep() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playSelect() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [587.33, 739.99, 880.0];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.055);
      gain.gain.setValueAtTime(0.03, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.12);
    });
  }

  public playCoin() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880.0, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.075);
    gain.gain.setValueAtTime(0.04, now);
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
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.16);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playFanfare() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { f: 587.33, t: 0, d: 0.12 },    // D5
      { f: 739.99, t: 0.11, d: 0.12 }, // F#5
      { f: 880.0, t: 0.22, d: 0.12 },  // A5
      { f: 1174.66, t: 0.33, d: 0.4 }, // D6
    ];
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.045, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }
}

export const soundEngine = new RetroSoundEngine();
