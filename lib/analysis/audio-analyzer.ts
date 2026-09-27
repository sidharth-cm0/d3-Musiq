/**
 * Browser-First Audio Analysis & Reverse Engineering Pipeline for D3 MusiQ
 * 
 * Provides client-side extraction of:
 * 1. Pitch & Melody Tracking using the YIN / Difference Function algorithm
 * 2. Onset Detection & Note Segmentation
 * 3. Raaga & Western Key/Mode Correlation (Raag Yaman / Lydian / Major)
 * 4. Spectral Feature Estimation (Centroid, Clarity, Timbre)
 * 5. 16-Step Production Quantizer
 */

import { Note } from "tonal";
import { midiToYaman, yamanToMidi, midiToPitchName, YAMAN_SWARA_INTERVALS } from "@/lib/theory/carnatic";
import { InstrumentType } from "@/lib/audio/engine";

export interface DetectedNote {
  id: string;
  pitch: string; // e.g. "C4", "F#4"
  midi: number; // e.g. 60, 66
  frequency: number; // in Hz
  startTime: number; // in seconds
  duration: number; // in seconds
  confidence: number; // 0 to 1
  swara?: string; // e.g. "S", "M2" if matching Yaman
  isYamanNote?: boolean;
  step?: number; // quantized 16-step index (0-15)
}

export interface MusicalSection {
  id: string;
  name: string; // e.g. "Intro / Alap", "Theme / Sthayi", "Climax / Antara", "Resolution / Sam"
  label: "intro" | "verse" | "chorus" | "interlude" | "outro";
  startTime: number;
  endTime: number;
  duration: number;
  energyPercent: number; // 0 to 100
  noteCount: number;
  description: string;
}

export interface InstrumentSuggestion {
  instrument: InstrumentType;
  name: string;
  family: string;
  reason: string;
  role: "lead" | "accompaniment" | "rhythm" | "pad";
  sampleOrSynth: "real_sample" | "synthesized_model" | "analog_synth";
}

export interface AnalysisResult {
  duration: number;
  sampleRate: number;
  detectedNotes: DetectedNote[];
  estimatedBpm: number;
  bpmConfidence: number; // 0 to 100%
  estimatedKey: string;
  estimatedTonic: string;
  estimatedRaaga: string;
  raagaConfidence: number; // 0 to 100%
  suggestedInstrument: InstrumentType;
  suggestedCompanionInstruments: InstrumentSuggestion[];
  roughStructure: MusicalSection[];
  suggestedStyleTags: string[];
  spectralCentroidHz: number;
  averagePitchClarity: number;
  waveformPoints: number[];
  detectedCharacteristics: {
    pitchRange: string;
    brightnessLabel: string;
    harmonicClarity: string;
  };
}

/**
 * Main audio analyzer running fully in the browser via Web Audio API
 */
export class AudioAnalyzer {
  /**
   * Decodes an ArrayBuffer (from file or blob) into an AudioBuffer
   */
  public static async decodeAudio(
    audioData: ArrayBuffer | Blob
  ): Promise<AudioBuffer> {
    const arrayBuffer =
      audioData instanceof Blob ? await audioData.arrayBuffer() : audioData;

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    try {
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      return buffer;
    } finally {
      if (ctx.state !== "closed") {
        ctx.close();
      }
    }
  }

  /**
   * Generates a normalized downsampled waveform array (for display)
   */
  public static extractWaveform(
    audioBuffer: AudioBuffer,
    pointsCount = 120
  ): number[] {
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / pointsCount);
    const waveform: number[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      waveform.push(sum / blockSize);
    }

    const max = Math.max(...waveform, 0.0001);
    return waveform.map((v) => Math.min(1.0, v / max));
  }

  /**
   * Performs frame-by-frame pitch tracking using the YIN algorithm
   */
  private static yinPitch(
    channelData: Float32Array,
    sampleRate: number,
    frameSize = 2048,
    hopSize = 512,
    threshold = 0.15
  ): Array<{ time: number; frequency: number; clarity: number }> {
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
    const pitchTrack: Array<{ time: number; frequency: number; clarity: number }> = [];

    const minFreq = 65; // ~C2
    const maxFreq = 1000; // ~C6
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    const diff = new Float32Array(maxPeriod);
    const cmndf = new Float32Array(maxPeriod);

    for (let f = 0; f < numFrames; f++) {
      const offset = f * hopSize;
      const time = offset / sampleRate;

      // 1. RMS Energy Gate
      let energy = 0;
      for (let i = 0; i < frameSize; i++) {
        const val = channelData[offset + i];
        energy += val * val;
      }
      const rms = Math.sqrt(energy / frameSize);
      if (rms < 0.015) {
        continue; // Silence or noise floor
      }

      // 2. Difference Function
      diff.fill(0);
      for (let tau = minPeriod; tau < maxPeriod; tau++) {
        let sum = 0;
        for (let j = 0; j < frameSize / 2; j++) {
          const delta = channelData[offset + j] - channelData[offset + j + tau];
          sum += delta * delta;
        }
        diff[tau] = sum;
      }

      // 3. Cumulative Mean Normalized Difference Function (CMNDF)
      cmndf[0] = 1;
      let runningSum = 0;
      for (let tau = 1; tau < maxPeriod; tau++) {
        runningSum += diff[tau];
        cmndf[tau] = runningSum > 0 ? (diff[tau] * tau) / runningSum : 1;
      }

      // 4. Absolute thresholding for pitch period tau
      let tauCandidate = -1;
      for (let tau = minPeriod; tau < maxPeriod; tau++) {
        if (cmndf[tau] < threshold) {
          while (tau + 1 < maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
            tau++;
          }
          tauCandidate = tau;
          break;
        }
      }

      if (tauCandidate > 0) {
        // Parabolic Interpolation for sub-sample precision
        const s0 = cmndf[tauCandidate - 1];
        const s1 = cmndf[tauCandidate];
        const s2 = cmndf[tauCandidate + 1] || s1;
        const delta = (s0 - s2) / (2 * (s0 - 2 * s1 + s2) || 1);
        const refinedPeriod = tauCandidate + delta;

        const frequency = sampleRate / refinedPeriod;
        const clarity = Math.max(0, Math.min(1, 1 - cmndf[tauCandidate]));

        if (frequency >= minFreq && frequency <= maxFreq && clarity > 0.5) {
          pitchTrack.push({ time, frequency, clarity });
        }
      }
    }

    return pitchTrack;
  }

  /**
   * Segments continuous pitch points into discrete musical notes
   */
  private static segmentNotes(
    pitchTrack: Array<{ time: number; frequency: number; clarity: number }>,
    sampleDuration: number
  ): DetectedNote[] {
    if (pitchTrack.length === 0) return [];

    const notes: DetectedNote[] = [];
    let currentNotePitches: number[] = [];
    let currentClarity: number[] = [];
    let noteStartTime = pitchTrack[0].time;
    let prevTime = pitchTrack[0].time;

    const flushNote = (endTime: number) => {
      if (currentNotePitches.length < 3) {
        // Filter out micro-glitches (< ~35ms)
        currentNotePitches = [];
        currentClarity = [];
        return;
      }

      // Median frequency to avoid vibrato skew
      const sortedFreqs = [...currentNotePitches].sort((a, b) => a - b);
      const medianFreq = sortedFreqs[Math.floor(sortedFreqs.length / 2)];
      const avgClarity =
        currentClarity.reduce((a, b) => a + b, 0) / currentClarity.length;

      const duration = Math.max(0.08, endTime - noteStartTime);
      const rawMidi = 69 + 12 * Math.log2(medianFreq / 440);
      const midi = Math.round(rawMidi);
      const pitchName = midiToPitchName(midi);

      notes.push({
        id: `detected-${midi}-${Math.round(noteStartTime * 1000)}`,
        pitch: pitchName,
        midi,
        frequency: Math.round(medianFreq),
        startTime: Math.round(noteStartTime * 100) / 100,
        duration: Math.round(duration * 100) / 100,
        confidence: Math.round(avgClarity * 100) / 100,
      });

      currentNotePitches = [];
      currentClarity = [];
    };

    for (let i = 0; i < pitchTrack.length; i++) {
      const { time, frequency, clarity } = pitchTrack[i];
      const timeGap = time - prevTime;

      if (currentNotePitches.length === 0) {
        noteStartTime = time;
        currentNotePitches.push(frequency);
        currentClarity.push(clarity);
      } else {
        const lastFreq = currentNotePitches[currentNotePitches.length - 1];
        const semitoneDiff = Math.abs(12 * Math.log2(frequency / lastFreq));

        // If time gap is large (> 90ms) or pitch jumps > 0.8 semitones, close previous note
        if (timeGap > 0.09 || semitoneDiff > 0.8) {
          flushNote(prevTime + 0.04);
          noteStartTime = time;
          currentNotePitches.push(frequency);
          currentClarity.push(clarity);
        } else {
          currentNotePitches.push(frequency);
          currentClarity.push(clarity);
        }
      }

      prevTime = time;
    }

    if (currentNotePitches.length > 0) {
      flushNote(Math.min(sampleDuration, prevTime + 0.05));
    }

    return notes;
  }

  /**
   * Analyzes an AudioBuffer and produces complete musical breakdown
   */
  public static async analyzeAudioBuffer(
    buffer: AudioBuffer
  ): Promise<AnalysisResult> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const duration = buffer.duration;

    // 1. Extract Waveform Points for UI visualization
    const waveformPoints = this.extractWaveform(buffer, 120);

    // 2. Pitch Track via YIN
    const pitchTrack = this.yinPitch(channelData, sampleRate);

    // 3. Segment into discrete Note Events
    const rawNotes = this.segmentNotes(pitchTrack, duration);

    // 4. Spectral Centroid Estimation (Timbre Brightness)
    let spectralCentroid = 1800; // default mid-range
    try {
      let sumNumerator = 0;
      let sumDenominator = 0;
      const fftSize = 1024;
      for (let i = 0; i < Math.min(channelData.length - fftSize, fftSize * 10); i += fftSize) {
        for (let k = 0; k < fftSize; k++) {
          const mag = Math.abs(channelData[i + k]);
          const freq = (k * sampleRate) / fftSize;
          sumNumerator += freq * mag;
          sumDenominator += mag;
        }
      }
      if (sumDenominator > 0) {
        spectralCentroid = Math.round(sumNumerator / sumDenominator);
      }
    } catch {
      // Fallback
    }

    // 5. Raaga & Tonic Estimation
    // Test candidate tonics against Raag Yaman intervals: [0, 2, 4, 6, 7, 9, 11]
    const yamanSemitoneSet = new Set([0, 2, 4, 6, 7, 9, 11]);
    const candidateTonics = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
    let bestTonic = "C4";
    let highestScore = -1;

    for (const tonic of candidateTonics) {
      const tonicMidi = yamanToMidi(tonic, "S");
      let matches = 0;
      for (const note of rawNotes) {
        const offset = ((note.midi - tonicMidi) % 12 + 12) % 12;
        if (yamanSemitoneSet.has(offset)) {
          matches++;
        }
      }
      if (matches > highestScore) {
        highestScore = matches;
        bestTonic = tonic;
      }
    }

    const raagaRatio = rawNotes.length > 0 ? highestScore / rawNotes.length : 0.85;
    const raagaConfidence = Math.min(98, Math.round(raagaRatio * 100));

    // 6. Map notes to Yaman swaras relative to the bestTonic
    const detectedNotes: DetectedNote[] = rawNotes.map((note) => {
      const swara = midiToYaman(bestTonic, note.midi);
      const isYamanNote = swara !== null;

      // Quantize to 16 steps relative to audio duration (1 bar equivalent)
      const normalizedTime = Math.min(0.99, note.startTime / Math.max(0.1, duration));
      const step = Math.min(15, Math.floor(normalizedTime * 16));

      return {
        ...note,
        swara: swara ?? undefined,
        isYamanNote,
        step,
      };
    });

    // 7. Heuristic Timbre & Instrument Suggestions
    let suggestedInstrument: InstrumentType = "pluck";
    let suggestedStyleTags: string[] = ["#CarnaticClassical", "#PluckedString"];

    if (spectralCentroid > 2800) {
      suggestedInstrument = "fm";
      suggestedStyleTags = ["#ModernElectronic", "#BellChime", "#BrightHarmonics"];
    } else if (spectralCentroid < 1200) {
      suggestedInstrument = "poly";
      suggestedStyleTags = ["#WarmSynth", "#Subtractive", "#Smooth"];
    } else if (detectedNotes.length > 6) {
      suggestedInstrument = "piano";
      suggestedStyleTags = ["#WesternClassical", "#ConcertGrand", "#Acoustic"];
    } else {
      suggestedInstrument = "pluck";
      suggestedStyleTags = ["#CarnaticClassical", "#VeenaPluck", "#Mechakalyani"];
    }

    const averagePitchClarity =
      detectedNotes.length > 0
        ? Math.round(
            (detectedNotes.reduce((acc, n) => acc + n.confidence, 0) /
              detectedNotes.length) *
              100
          ) / 100
        : 0.8;

    // 8. Tempo Estimation via Onset Autocorrelation
    const { bpm: estimatedBpm, confidence: bpmConfidence } = this.estimateBpm(
      channelData,
      sampleRate
    );

    // 9. Rough Musical Structure Segmentation (Intro, Verse, Chorus, Outro)
    const roughStructure = this.estimateRoughStructure(
      channelData,
      sampleRate,
      duration,
      detectedNotes
    );

    // 10. Companion Instruments in D3 Open Sound Library
    const suggestedCompanionInstruments: InstrumentSuggestion[] = [
      {
        instrument: "pluck",
        name: "Saraswati Veena",
        family: "Carnatic Strings",
        reason: "Adds resonant plucks and characteristic meend slides over the melody.",
        role: "lead",
        sampleOrSynth: "synthesized_model",
      },
      {
        instrument: "tabla",
        name: "Classical Tabla",
        family: "Indian Percussion",
        reason: `Provides rhythmic grounding with resonant Dha/Dhin thekas locked to ~${estimatedBpm} BPM.`,
        role: "rhythm",
        sampleOrSynth: "synthesized_model",
      },
      {
        instrument: "flute",
        name: "Bansuri Flute",
        family: "Woodwinds",
        reason: "Airy, breathy counter-melody complementing the vocal frequency range.",
        role: "accompaniment",
        sampleOrSynth: "synthesized_model",
      },
      {
        instrument: "poly",
        name: "Atmospheric Pad",
        family: "Analog Synthesis",
        reason: `Harmonic foundation drone anchored to ${bestTonic} Sa-Pa sustained root.`,
        role: "pad",
        sampleOrSynth: "analog_synth",
      },
    ];

    // 11. Detected Acoustic Characteristics
    let pitchRange = "C4 to C5";
    if (detectedNotes.length > 0) {
      const midis = detectedNotes.map((n) => n.midi).sort((a, b) => a - b);
      pitchRange = `${midiToPitchName(midis[0])} to ${midiToPitchName(midis[midis.length - 1])}`;
    }

    const brightnessLabel =
      spectralCentroid < 1400
        ? "Warm & Deep (Low Acoustic Spectrum)"
        : spectralCentroid < 2600
        ? "Balanced Acoustic (Mid-Range Natural Timbre)"
        : "Bright & Harmonic (High Transient Presence)";

    const harmonicClarity =
      averagePitchClarity > 0.7
        ? "High Monophonic Line (Solo Instrument / Voice)"
        : "Layered or Dynamic Texture (Complex Spectrum)";

    return {
      duration: Math.round(duration * 100) / 100,
      sampleRate,
      detectedNotes,
      estimatedBpm,
      bpmConfidence,
      estimatedKey: `${bestTonic.replace(/\d+/, "")} Lydian / Mechakalyani`,
      estimatedTonic: bestTonic,
      estimatedRaaga: "Raag Yaman (Kalyani)",
      raagaConfidence,
      suggestedInstrument,
      suggestedCompanionInstruments,
      roughStructure,
      suggestedStyleTags,
      spectralCentroidHz: spectralCentroid,
      averagePitchClarity,
      waveformPoints,
      detectedCharacteristics: {
        pitchRange,
        brightnessLabel,
        harmonicClarity,
      },
    };
  }

  /**
   * Estimates tempo (BPM) using energy flux autocorrelation (Phase 4)
   */
  private static estimateBpm(
    channelData: Float32Array,
    sampleRate: number
  ): { bpm: number; confidence: number } {
    const frameSize = 1024;
    const hopSize = 256;
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
    if (numFrames < 20) {
      return { bpm: 110, confidence: 50 };
    }

    // 1. Frame RMS Energy
    const energies = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) {
      const offset = f * hopSize;
      let sum = 0;
      for (let i = 0; i < frameSize; i++) {
        const s = channelData[offset + i];
        sum += s * s;
      }
      energies[f] = Math.sqrt(sum / frameSize);
    }

    // 2. Onset Novelty (First difference, half-wave rectified)
    const onsets = new Float32Array(numFrames);
    for (let f = 1; f < numFrames; f++) {
      const diff = energies[f] - energies[f - 1];
      onsets[f] = diff > 0 ? diff : 0;
    }

    // 3. Autocorrelation over BPM range [65, 175]
    const secondsPerFrame = hopSize / sampleRate;
    const minBpm = 65;
    const maxBpm = 175;
    const minLag = Math.floor((60 / maxBpm) / secondsPerFrame);
    const maxLag = Math.min(numFrames - 1, Math.ceil((60 / minBpm) / secondsPerFrame));

    if (minLag >= maxLag || maxLag >= numFrames) {
      return { bpm: 110, confidence: 50 };
    }

    let peakCorr = -1;
    let peakLag = minLag;
    let totalCorr = 0;
    let count = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < numFrames - lag; i++) {
        sum += onsets[i] * onsets[i + lag];
      }
      totalCorr += sum;
      count++;
      if (sum > peakCorr) {
        peakCorr = sum;
        peakLag = lag;
      }
    }

    const avgCorr = count > 0 ? totalCorr / count : 0.001;
    const ratio = avgCorr > 0 ? peakCorr / avgCorr : 1;
    const confidence = Math.min(95, Math.max(55, Math.round(ratio * 20 + 45)));

    const rawBpm = 60 / (peakLag * secondsPerFrame);
    let bpm = Math.round(rawBpm);
    if (bpm < 60) bpm = bpm * 2;
    if (bpm > 180) bpm = Math.round(bpm / 2);
    bpm = Math.max(65, Math.min(175, bpm));

    return { bpm, confidence };
  }

  /**
   * Estimates rough musical sections (Intro, Verse, Chorus, Outro) (Phase 4)
   */
  private static estimateRoughStructure(
    channelData: Float32Array,
    sampleRate: number,
    duration: number,
    detectedNotes: DetectedNote[]
  ): MusicalSection[] {
    const numSections = duration <= 5 ? 3 : duration <= 14 ? 4 : 5;
    const sectionDur = duration / numSections;
    const sections: MusicalSection[] = [];

    // Calculate energy per section
    const sectionEnergies: number[] = [];
    const samplesPerSec = Math.floor(channelData.length / numSections);

    for (let s = 0; s < numSections; s++) {
      const startSamp = s * samplesPerSec;
      const endSamp = Math.min(channelData.length, (s + 1) * samplesPerSec);
      let sum = 0;
      for (let i = startSamp; i < endSamp; i += 16) {
        sum += channelData[i] * channelData[i];
      }
      sectionEnergies.push(Math.sqrt(sum / Math.max(1, (endSamp - startSamp) / 16)));
    }

    const maxEnergy = Math.max(...sectionEnergies, 0.0001);

    for (let s = 0; s < numSections; s++) {
      const startTime = Math.round(s * sectionDur * 100) / 100;
      const endTime = Math.round(Math.min(duration, (s + 1) * sectionDur) * 100) / 100;
      const secDuration = Math.round((endTime - startTime) * 100) / 100;
      const energyPercent = Math.min(100, Math.round((sectionEnergies[s] / maxEnergy) * 100));

      const secNotes = detectedNotes.filter(
        (n) => n.startTime >= startTime && n.startTime < endTime
      );

      let label: "intro" | "verse" | "chorus" | "interlude" | "outro" = "verse";
      let name = "Theme (Sthayi)";
      let description = "Core melodic foundation and steady swara movement.";

      if (s === 0) {
        label = "intro";
        name = "Intro / Alap";
        description = "Opening acoustic entry establishing the tonic register.";
      } else if (s === numSections - 1 && energyPercent < 70) {
        label = "outro";
        name = "Resolution / Sam";
        description = "Cadential conclusion resolving to root center.";
      } else if (energyPercent >= 80 || secNotes.length >= 4) {
        label = "chorus";
        name = "Climax / Antara";
        description = "Peak acoustic energy with upper octave swaras.";
      } else if (s > 1 && s < numSections - 1) {
        label = "interlude";
        name = "Interlude / Sanchari";
        description = "Transitional bridge exploring intermediate intervals.";
      }

      sections.push({
        id: `sec-${s + 1}`,
        name,
        label,
        startTime,
        endTime,
        duration: secDuration,
        energyPercent,
        noteCount: secNotes.length,
        description,
      });
    }

    return sections;
  }
}
