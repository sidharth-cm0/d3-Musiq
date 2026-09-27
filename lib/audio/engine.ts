/**
 * D3 MusiQ Tone.js Audio Engine Wrapper (Step 2)
 * 
 * Provides a robust, browser-first interface to the Web Audio API via Tone.js.
 * Features:
 * - Explicit user-gesture unlock (browser autoplay compliance)
 * - Master Gain -> Limiter chain to protect speakers and prevent digital clipping
 * - 16th-note loop sequencer driving audio triggers and visual playheads
 * - Multi-Instrument support:
 *    1. Warm PolySynth / Atmosphere (Subtractive)
 *    2. FM Bell Chime (Frequency Modulation)
 *    3. Saraswati Veena Pluck (Acoustic modeling with snappy pluck envelope)
 *    4. Bansuri Flute (Breathy acoustic woodwind modeling)
 *    5. Concert Grand Piano (Lazy-loaded multi-sampled Tone.Sampler)
 *    6. Classical Tabla Ensemble (Bayan & Dayan physical percussion modeling)
 *    7. 808 Electronic Rhythm Kit (Sub kick, snappy snare, crisp hats)
 * - Multi-track layer scheduling (each note routes to its own instrument voice)
 * - Audition preview without modifying project state
 * - Velocity-sensitive note triggering
 * - Real-time active-note dispatch for responsive UI animations
 */

import * as Tone from "tone";

export type InstrumentType = "poly" | "fm" | "pluck" | "piano" | "tabla" | "beats" | "flute" | "violin" | "guitar";

export interface ScheduledNote {
  id?: string;
  pitch: string;
  step: number;
  duration: number; // in 16th notes (e.g. 1 = 16n, 2 = 8n)
  velocity?: number; // 0.1 to 1.0
  swara?: string;
  instrument?: InstrumentType;
  trackId?: string;
  muted?: boolean;
}

export type StepCallback = (step: number, activeNotes: ScheduledNote[]) => void;
export type LoadingCallback = (instrument: string, isLoading: boolean) => void;

class AudioEngine {
  private isInitialized = false;
  private isRunning = false;
  private masterGain: Tone.Gain | null = null;
  private masterLimiter: Tone.Limiter | null = null;

  // Synths & Samplers
  private synths: Record<string, Tone.PolySynth | null> = {
    poly: null,
    fm: null,
    pluck: null,
    flute: null,
    violin: null,
    guitar: null,
  };

  private pianoSampler: Tone.Sampler | null = null;
  private isPianoLoading = false;
  private isPianoLoaded = false;

  // Percussion Engines
  private tablaBayan: Tone.MembraneSynth | null = null;
  private tablaDayan: Tone.MetalSynth | null = null;
  private tablaSlap: Tone.NoiseSynth | null = null;

  private drumKick: Tone.MembraneSynth | null = null;
  private drumSnare: Tone.NoiseSynth | null = null;
  private drumHat: Tone.MetalSynth | null = null;

  private currentInstrument: InstrumentType = "poly";

  // Vocal Track Player (Phase 3)
  private vocalPlayer: Tone.Player | null = null;
  private vocalUrl: string | null = null;
  private vocalVolume = 0.8;
  private isVocalMuted = false;

  // Sequence & Scheduler
  private sequence: Tone.Sequence | null = null;
  private notes: ScheduledNote[] = [];
  private stepCallback: StepCallback | null = null;
  private loadingCallback: LoadingCallback | null = null;

  /**
   * Initializes the Web Audio context on an explicit user gesture.
   */
  public async init(): Promise<boolean> {
    if (
      typeof window === "undefined" ||
      (typeof window.AudioContext === "undefined" &&
        typeof (window as any).webkitAudioContext === "undefined")
    ) {
      return false;
    }

    if (this.isInitialized) {
      if (Tone.context.state !== "running") {
        await Tone.context.resume();
      }
      return true;
    }

    try {
      await Tone.start();

      // Master Chain: Master Gain -> Master Limiter -> Destination
      this.masterLimiter = new Tone.Limiter(-0.5).toDestination();
      this.masterGain = new Tone.Gain(0.85).connect(this.masterLimiter);

      // 1. Warm PolySynth (Atmospheric Pad)
      this.synths.poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle8" },
        envelope: {
          attack: 0.02,
          decay: 0.25,
          sustain: 0.4,
          release: 0.6,
        },
      }).connect(this.masterGain);

      // 2. FM Bell Chime
      this.synths.fm = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2.5,
        modulationIndex: 8,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.005,
          decay: 0.6,
          sustain: 0.1,
          release: 1.0,
        },
        modulation: { type: "triangle" },
        modulationEnvelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.05,
          release: 0.4,
        },
      }).connect(this.masterGain);

      // 3. Saraswati Veena Pluck (Acoustic Modeling)
      this.synths.pluck = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth8" },
        envelope: {
          attack: 0.003,
          decay: 0.35,
          sustain: 0.04,
          release: 0.4,
        },
      }).connect(this.masterGain);

      // 4. Bansuri Flute (Breathy Wind Modeling)
      this.synths.flute = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.035,
          decay: 0.3,
          sustain: 0.7,
          release: 0.45,
        },
        portamento: 0.02,
      }).connect(this.masterGain);

      // 5. Acoustic Violin (Bowed String Modeling)
      this.synths.violin = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: {
          attack: 0.08,
          decay: 0.3,
          sustain: 0.75,
          release: 0.5,
        },
        portamento: 0.015,
      }).connect(this.masterGain);

      // 6. Acoustic Guitar (Nylon Pluck Modeling)
      this.synths.guitar = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle4" },
        envelope: {
          attack: 0.005,
          decay: 0.45,
          sustain: 0.08,
          release: 0.4,
        },
      }).connect(this.masterGain);

      // 5. Classical Tabla Percussion Engines
      this.tablaBayan = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 4,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.5 },
      }).connect(this.masterGain);

      this.tablaDayan = new Tone.MetalSynth({
        harmonicity: 3.2,
        modulationIndex: 16,
        resonance: 2800,
        envelope: { attack: 0.002, decay: 0.3, release: 0.2 },
      }).connect(this.masterGain);

      this.tablaSlap = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
      }).connect(this.masterGain);

      // 6. 808 Electronic Rhythm Kit
      this.drumKick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      }).connect(this.masterGain);

      this.drumSnare = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
      }).connect(this.masterGain);

      this.drumHat = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        envelope: { attack: 0.001, decay: 0.08, release: 0.05 },
      }).connect(this.masterGain);

      // 16-Step Sequence (0 to 15)
      const steps = Array.from({ length: 16 }, (_, i) => i);
      this.sequence = new Tone.Sequence(
        (time, step) => {
          // Restart vocal track at beginning of loop cycle in sample-accurate sync
          if (step === 0 && this.vocalPlayer && this.vocalPlayer.loaded && !this.isVocalMuted) {
            try {
              this.vocalPlayer.stop(time);
              this.vocalPlayer.start(time, 0);
            } catch {
              // ignore overlap
            }
          }

          const notesAtStep = this.triggerStepNotes(step as number, time);

          // Synchronize visual playhead & active notes using Tone.Draw
          Tone.Draw.schedule(() => {
            if (this.stepCallback) {
              this.stepCallback(step as number, notesAtStep);
            }
          }, time);
        },
        steps,
        "16n"
      );

      Tone.Transport.loop = true;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = "1m";

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error("Failed to initialize Tone.js AudioEngine:", err);
      return false;
    }
  }

  /**
   * Lazy-loads the multi-sampled Grand Piano
   */
  public async loadPianoSampler(): Promise<void> {
    if (this.isPianoLoaded || this.isPianoLoading || !this.masterGain) return;

    this.isPianoLoading = true;
    this.loadingCallback?.("piano", true);

    try {
      this.pianoSampler = new Tone.Sampler({
        urls: {
          A1: "A1.mp3",
          A2: "A2.mp3",
          C3: "C3.mp3",
          "D#3": "Ds3.mp3",
          "F#3": "Fs3.mp3",
          A3: "A3.mp3",
          C4: "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          A4: "A4.mp3",
          C5: "C5.mp3",
          "D#5": "Ds5.mp3",
          "F#5": "Fs5.mp3",
          A5: "A5.mp3",
          C6: "C6.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        onload: () => {
          this.isPianoLoaded = true;
          this.isPianoLoading = false;
          this.loadingCallback?.("piano", false);
        },
        onerror: (err) => {
          console.warn("Piano sample loading warning (fallback synth will be used):", err);
          this.isPianoLoading = false;
          this.loadingCallback?.("piano", false);
        },
      }).connect(this.masterGain);
    } catch (err) {
      console.error("Failed to instantiate piano sampler:", err);
      this.isPianoLoading = false;
      this.loadingCallback?.("piano", false);
    }
  }

  /**
   * Triggers active notes on a given step across all active layers
   */
  private triggerStepNotes(step: number, time: number): ScheduledNote[] {
    const notesAtStep = this.notes.filter((n) => n.step === step && !n.muted);
    if (notesAtStep.length === 0) return [];

    const secondsPer16th = Tone.Time("16n").toSeconds();

    for (const note of notesAtStep) {
      const durSeconds = Math.max(0.05, (note.duration || 1) * secondsPer16th * 0.9);
      const velocity = note.velocity ?? 0.85;
      const inst: InstrumentType = note.instrument || this.currentInstrument;

      try {
        if (inst === "piano") {
          if (this.pianoSampler && this.pianoSampler.loaded) {
            this.pianoSampler.triggerAttackRelease(note.pitch, durSeconds, time, velocity);
          } else {
            // Warm synth fallback while samples are downloading
            this.synths.poly?.triggerAttackRelease(note.pitch, durSeconds, time, velocity * 0.8);
          }
        } else if (inst === "tabla") {
          this.triggerTablaStroke(note.pitch, time, velocity);
        } else if (inst === "beats") {
          this.trigger808Drum(note.pitch, time, velocity);
        } else if (this.synths[inst]) {
          const synth = this.synths[inst];
          synth?.triggerAttackRelease(note.pitch, durSeconds, time, velocity);
        } else {
          this.synths.poly?.triggerAttackRelease(note.pitch, durSeconds, time, velocity);
        }
      } catch (err) {
        console.warn(`Error triggering note ${note.pitch} for ${inst} at step ${step}:`, err);
      }
    }

    return notesAtStep;
  }

  /**
   * Triggers authentic Indian classical Tabla bols based on pitch mapping
   */
  private triggerTablaStroke(pitch: string, time?: number, velocity = 0.85) {
    const t = time ?? Tone.now();
    // Pitch mappings:
    // C4 -> Dha (Bayan bass + Dayan ring)
    // D4 -> Dhin (Bayan + Dayan ring)
    // E4 -> Ge / Ghe (Deep Bayan pitch bend)
    // F#4 -> Na / Ta (Dayan metallic rim)
    // G4 -> Tin (Dayan center ring)
    // A4 -> Ka / Kat (Flat slap)
    if (pitch.startsWith("C") || pitch.startsWith("D")) {
      // Dha / Dhin
      this.tablaBayan?.triggerAttackRelease("G1", "8n", t, velocity * 0.9);
      this.tablaDayan?.triggerAttackRelease("8n", t, velocity * 0.8);
    } else if (pitch.startsWith("E")) {
      // Ge (Bayan bass glide)
      this.tablaBayan?.triggerAttackRelease("E1", "4n", t, velocity);
    } else if (pitch.startsWith("F")) {
      // Na / Ta (Dayan rim stroke)
      this.tablaDayan?.triggerAttackRelease("16n", t, velocity);
    } else if (pitch.startsWith("G")) {
      // Tin (Dayan center ring)
      this.tablaDayan?.triggerAttackRelease("8n", t, velocity * 0.85);
    } else {
      // Ka (Flat palm slap)
      this.tablaSlap?.triggerAttackRelease("32n", t, velocity * 0.9);
    }
  }

  /**
   * Triggers 808 electronic rhythm kit sounds based on pitch mapping
   */
  private trigger808Drum(pitch: string, time?: number, velocity = 0.85) {
    const t = time ?? Tone.now();
    if (pitch.startsWith("C")) {
      // Kick
      this.drumKick?.triggerAttackRelease("C1", "8n", t, velocity);
    } else if (pitch.startsWith("D")) {
      // Snare
      this.drumSnare?.triggerAttackRelease("16n", t, velocity);
      this.drumKick?.triggerAttackRelease("G1", "16n", t, velocity * 0.4);
    } else if (pitch.startsWith("E")) {
      // Closed Hat
      this.drumHat?.triggerAttackRelease("32n", t, velocity * 0.7);
    } else if (pitch.startsWith("F")) {
      // Open Hat
      this.drumHat?.triggerAttackRelease("8n", t, velocity * 0.85);
    } else if (pitch.startsWith("G")) {
      // Clap
      this.drumSnare?.triggerAttackRelease("16n", t, velocity * 0.9);
    } else {
      // Rim
      this.drumHat?.triggerAttackRelease("32n", t, velocity);
    }
  }

  /**
   * Auditions a note or percussion stroke immediately.
   * If an instrument is provided, auditions that specific instrument
   * without mutating the active project state.
   */
  public previewNote(pitch: string, duration = "8n", velocity = 0.85, instrument?: InstrumentType): void {
    if (!this.isInitialized) {
      this.init().then(() => this.previewNote(pitch, duration, velocity, instrument));
      return;
    }

    const inst = instrument || this.currentInstrument;

    try {
      if (inst === "piano") {
        if (!this.isPianoLoaded && !this.isPianoLoading) {
          this.loadPianoSampler();
        }
        if (this.pianoSampler && this.pianoSampler.loaded) {
          this.pianoSampler.triggerAttackRelease(pitch, duration, undefined, velocity);
        } else {
          this.synths.poly?.triggerAttackRelease(pitch, duration, undefined, velocity * 0.8);
        }
      } else if (inst === "tabla") {
        this.triggerTablaStroke(pitch, undefined, velocity);
      } else if (inst === "beats") {
        this.trigger808Drum(pitch, undefined, velocity);
      } else if (this.synths[inst]) {
        const synth = this.synths[inst];
        synth?.triggerAttackRelease(pitch, duration, undefined, velocity);
      } else {
        this.synths.poly?.triggerAttackRelease(pitch, duration, undefined, velocity);
      }
    } catch (err) {
      console.warn(`Failed to preview note ${pitch} on ${inst}:`, err);
    }
  }

  public onStep(callback: StepCallback | null) {
    this.stepCallback = callback;
  }

  public onLoadingState(callback: LoadingCallback | null) {
    this.loadingCallback = callback;
  }

  public async start(): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.init();
      if (!ok) return;
    }

    if (Tone.context.state !== "running") {
      await Tone.context.resume();
    }

    if (this.sequence && this.sequence.state !== "started") {
      this.sequence.start(0);
    }

    Tone.Transport.start();
    this.isRunning = true;
  }

  public pause(): void {
    Tone.Transport.pause();
    this.isRunning = false;
    if (this.vocalPlayer) {
      try {
        this.vocalPlayer.stop();
      } catch {
        // ignore
      }
    }
  }

  public stop(): void {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isRunning = false;
    if (this.vocalPlayer) {
      try {
        this.vocalPlayer.stop();
      } catch {
        // ignore
      }
    }

    if (this.stepCallback) {
      this.stepCallback(0, []);
    }
  }

  /**
   * Synchronizes live recorded vocal audio with the composition loop (Phase 3)
   */
  public syncVocalTrack(url: string | null | undefined, volume = 0.8, muted = false): void {
    this.vocalVolume = volume;
    this.isVocalMuted = muted;

    const calcDb = (vol: number, isMuted: boolean) => {
      if (isMuted) return -Infinity;
      const v = Math.max(0.001, Math.min(1, vol));
      return 20 * Math.log10(v);
    };

    if (!url) {
      if (this.vocalPlayer) {
        try {
          this.vocalPlayer.stop();
          this.vocalPlayer.dispose();
        } catch {
          // ignore
        }
        this.vocalPlayer = null;
      }
      this.vocalUrl = null;
      return;
    }

    if (this.vocalUrl !== url) {
      if (this.vocalPlayer) {
        try {
          this.vocalPlayer.stop();
          this.vocalPlayer.dispose();
        } catch {
          // ignore
        }
      }
      this.vocalUrl = url;
      if (this.masterGain) {
        try {
          this.vocalPlayer = new Tone.Player({
            url,
            autostart: false,
            loop: false,
            onload: () => {
              if (this.vocalPlayer) {
                this.vocalPlayer.volume.value = calcDb(this.vocalVolume, this.isVocalMuted);
              }
            },
          }).connect(this.masterGain);
        } catch (err) {
          console.warn("Failed to initialize vocal player:", err);
        }
      }
    } else if (this.vocalPlayer) {
      this.vocalPlayer.volume.value = calcDb(this.vocalVolume, this.isVocalMuted);
    }
  }

  public setBPM(bpm: number): void {
    if (typeof window === "undefined" || !Tone.Transport?.bpm) return;
    const clamped = Math.max(60, Math.min(180, bpm));
    Tone.Transport.bpm.value = clamped;
  }

  public setVolume(volume: number): void {
    if (!this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.rampTo(clamped, 0.05);
  }

  public setInstrument(type: InstrumentType): void {
    this.currentInstrument = type;

    // Trigger lazy loading if piano is chosen
    if (type === "piano") {
      this.loadPianoSampler();
    }
  }

  public scheduleNotes(notes: ScheduledNote[]): void {
    this.notes = [...notes];
  }

  public isEngineReady(): boolean {
    return this.isInitialized;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public isInstrumentLoaded(instrument: string): boolean {
    if (instrument === "piano") return this.isPianoLoaded;
    return true;
  }
}

export const audioEngine = new AudioEngine();
