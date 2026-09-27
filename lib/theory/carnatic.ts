/**
 * Carnatic Music Theory Bridge for D3 MusiQ
 * 
 * Provides pure, deterministic functions bridging Western music theory (MIDI, note names, modes)
 * and Carnatic / Indian Classical raagas, starting with Raag Yaman (Kalyani Mela / Western Lydian).
 * 
 * Swaras in Raag Yaman:
 * S   - Shadjam (Tonic / Root)
 * R2  - Chatusruti Rishabham (Major 2nd, +2 semitones)
 * G3  - Antara Gandharam (Major 3rd, +4 semitones)
 * M2  - Prati Madhyamam / Teevra Madhyam (Augmented 4th / Tritone, +6 semitones)
 * P   - Panchamam (Perfect 5th, +7 semitones)
 * D2  - Chatusruti Dhaivatam (Major 6th, +9 semitones)
 * N3  - Kakali Nishadam (Major 7th, +11 semitones)
 * S'  - Tara Shadjam (Higher Octave Tonic, +12 semitones)
 */

import { Note } from "tonal";

/** Canonical Raag Yaman swara identifiers */
export type CanonicalYamanSwara = "S" | "R2" | "G3" | "M2" | "P" | "D2" | "N3" | "S'";

/** Semitone offset relative to tonic for Raag Yaman (Canonical) */
export const YAMAN_SWARA_INTERVALS: Record<CanonicalYamanSwara, number> = {
  "S": 0,
  "R2": 2,
  "G3": 4,
  "M2": 6,
  "P": 7,
  "D2": 9,
  "N3": 11,
  "S'": 12,
};

/** Order of swaras ascending in an octave */
export const YAMAN_SWARA_ORDER: readonly CanonicalYamanSwara[] = [
  "S",
  "R2",
  "G3",
  "M2",
  "P",
  "D2",
  "N3",
  "S'",
] as const;

/** Complete Carnatic 16-Swara interval map for comprehensive cross-raaga safety */
export const CARNATIC_16_SWARA_INTERVALS: Readonly<Record<string, number>> = {
  "S": 0,
  "R1": 1,
  "R2": 2, "G1": 2,
  "R3": 3, "G2": 3,
  "G3": 4,
  "M1": 5,
  "M2": 6,
  "P": 7,
  "D1": 8,
  "D2": 9, "N1": 9,
  "D3": 10, "N2": 10,
  "N3": 11,
  "S'": 12,
};

/**
 * Explicit mapping from human-friendly descriptive display names,
 * solfège syllables, and notation variants to the canonical Yaman swara.
 */
export const SWARA_DISPLAY_TO_CANONICAL: Readonly<Record<string, CanonicalYamanSwara>> = {
  // Identity
  "S": "S",
  "R2": "R2",
  "G3": "G3",
  "M2": "M2",
  "P": "P",
  "D2": "D2",
  "N3": "N3",
  "S'": "S'",

  // Solfège / Syllabic display labels
  "Sa": "S",
  "SA": "S",
  "sa": "S",
  "Ri": "R2",
  "RI": "R2",
  "ri": "R2",
  "Re": "R2",
  "RE": "R2",
  "re": "R2",
  "R": "R2",
  "Ga": "G3",
  "GA": "G3",
  "ga": "G3",
  "G": "G3",
  "Ma": "M2",
  "MA": "M2",
  "ma": "M2",
  "M": "M2",
  "Teevra Ma": "M2",
  "TEEVRA MA": "M2",
  "Prati Madhyamam": "M2",
  "PRATI MADHYAMAM": "M2",
  "Pa": "P",
  "PA": "P",
  "pa": "P",
  "Dha": "D2",
  "DHA": "D2",
  "dha": "D2",
  "D": "D2",
  "Ni": "N3",
  "NI": "N3",
  "ni": "N3",
  "N": "N3",

  // Octave notation variants for Tara Shadjam
  "Sa'": "S'",
  "SA'": "S'",
  "sa'": "S'",
  "Taara Sa": "S'",
  "TAARA SA": "S'",
  "Tara Sa": "S'",
  "High Sa": "S'",
  "S2": "S'",
  "s'": "S'",
};

/**
 * Checks whether an input value is a valid canonical Yaman swara identifier.
 */
export function isCanonicalYamanSwara(val: unknown): val is CanonicalYamanSwara {
  return typeof val === "string" && (YAMAN_SWARA_ORDER as readonly string[]).includes(val);
}

/**
 * Normalizes a swara display name or syllable to its canonical Yaman theory identifier.
 * Throws a descriptive error if the input cannot be resolved to a canonical Yaman swara.
 * (One source of truth boundary - Task 4).
 */
export function normalizeSwara(input: string): CanonicalYamanSwara {
  if (!input || typeof input !== "string") {
    throw new Error(`Invalid swara input: expected string, received ${typeof input}`);
  }
  const trimmed = input.trim();
  if (isCanonicalYamanSwara(trimmed)) {
    return trimmed;
  }
  const canonical = SWARA_DISPLAY_TO_CANONICAL[trimmed];
  if (canonical) {
    return canonical;
  }
  throw new Error(
    `Cannot normalize swara: "${input}". Valid canonical swaras are: ${YAMAN_SWARA_ORDER.join(", ")}`
  );
}

/**
 * Safely attempts to normalize an unknown string to a CanonicalYamanSwara.
 * Returns null if the value is not a swara (e.g. percussion strokes "Dhin", "Kick", "Snare", or undefined).
 */
export function tryNormalizeSwara(input: unknown): CanonicalYamanSwara | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const trimmed = input.trim();
  if (isCanonicalYamanSwara(trimmed)) return trimmed;
  return SWARA_DISPLAY_TO_CANONICAL[trimmed] ?? null;
}

/** Swara metadata for educational tooltips & library explorer */
export interface SwaraInfo {
  swara: CanonicalYamanSwara;
  name: string;
  carnaticName: string;
  intervalName: string;
  semitones: number;
}

export const SWARA_DETAILS: Record<CanonicalYamanSwara, SwaraInfo> = {
  "S": { swara: "S", name: "Sa", carnaticName: "Shadjam", intervalName: "Root (Unison)", semitones: 0 },
  "R2": { swara: "R2", name: "Ri (R2)", carnaticName: "Chatusruti Rishabham", intervalName: "Major 2nd", semitones: 2 },
  "G3": { swara: "G3", name: "Ga (G3)", carnaticName: "Antara Gandharam", intervalName: "Major 3rd", semitones: 4 },
  "M2": { swara: "M2", name: "Ma (M2)", carnaticName: "Prati Madhyamam", intervalName: "Augmented 4th (#4)", semitones: 6 },
  "P": { swara: "P", name: "Pa", carnaticName: "Panchamam", intervalName: "Perfect 5th", semitones: 7 },
  "D2": { swara: "D2", name: "Dha (D2)", carnaticName: "Chatusruti Dhaivatam", intervalName: "Major 6th", semitones: 9 },
  "N3": { swara: "N3", name: "Ni (N3)", carnaticName: "Kakali Nishadam", intervalName: "Major 7th", semitones: 11 },
  "S'": { swara: "S'", name: "Taara Sa", carnaticName: "Tara Shadjam", intervalName: "Octave (+12)", semitones: 12 },
};

/**
 * Standardizes a tonic input into a pitch with octave (defaults to octave 4 if omitted).
 * E.g. "C" -> "C4", "D" -> "D4", "F#" -> "F#4"
 */
export function normalizeTonic(tonic: string): string {
  const trimmed = tonic.trim();
  const match = trimmed.match(/^([A-Ga-g][#b]?)(?:(\d+))?$/);
  if (!match) {
    return "C4"; // Default fallback
  }
  const root = match[1].toUpperCase();
  const octave = match[2] !== undefined ? parseInt(match[2], 10) : 4;
  return `${root}${octave}`;
}

/**
 * Calculates the MIDI number of a tonic string (e.g. "C4" -> 60, "D4" -> 62).
 */
export function getTonicMidi(tonic: string): number {
  const normalized = normalizeTonic(tonic);
  const midi = Note.midi(normalized);
  if (midi === null || midi === undefined) {
    return 60; // Default C4
  }
  return midi;
}

/**
 * Converts a MIDI number to a standard Western pitch name using sharp notation for consistency
 * (e.g. 66 -> "F#4").
 */
export function midiToPitchName(midi: number): string {
  // Use Tonal's fromMidiSharps if present, otherwise calculate cleanly
  const noteName = Note.fromMidiSharps ? Note.fromMidiSharps(midi) : Note.fromMidi(midi);
  if (noteName) return noteName;

  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${notes[noteIndex]}${octave}`;
}

/**
 * Converts a Raag Yaman swara (e.g. "S", "R2", "M2", "S'") to its MIDI number
 * given a specific tonic (e.g. "C4").
 * Strictly enforces canonical validity via normalizeSwara.
 */
export function yamanToMidi(tonic: string, swara: CanonicalYamanSwara | string): number {
  const tonicMidi = getTonicMidi(tonic);
  const canonical = isCanonicalYamanSwara(swara) ? swara : normalizeSwara(swara);
  const interval = YAMAN_SWARA_INTERVALS[canonical];
  if (interval === undefined) {
    throw new Error(
      `Unknown Yaman swara: "${swara}". Valid swaras are: ${YAMAN_SWARA_ORDER.join(", ")}`
    );
  }
  return tonicMidi + interval;
}

/**
 * Converts a MIDI number back to its Raag Yaman swara name relative to a tonic,
 * or returns null if the note does not belong to Raag Yaman.
 */
export function midiToYaman(tonic: string, midi: number): string | null {
  const tonicMidi = getTonicMidi(tonic);
  const diff = midi - tonicMidi;

  // Handle explicit octave boundary
  if (diff === 12) return "S'";
  if (diff === 0) return "S";

  // Check modulo for any octave transposition
  const semitoneOffset = ((diff % 12) + 12) % 12;

  for (const [swara, interval] of Object.entries(YAMAN_SWARA_INTERVALS)) {
    if (swara === "S'") continue; // S' is handled specifically for diff === 12 or diff % 12 === 0
    if (interval === semitoneOffset) {
      // If it's a higher octave Sa, label as S'
      if (semitoneOffset === 0 && diff > 0) return "S'";
      return swara;
    }
  }

  return null;
}

/**
 * Generates an array of Western pitch names for Raag Yaman in the chosen octave.
 * E.g. for "C4" -> ["C4", "D4", "E4", "F#4", "G4", "A4", "B4", "C5"]
 */
export function getYamanScale(tonic: string): string[] {
  return YAMAN_SWARA_ORDER.map((swara) => {
    const midi = yamanToMidi(tonic, swara);
    return midiToPitchName(midi);
  });
}

/**
 * Detailed representation of notes in Raag Yaman with both Western and Carnatic tags
 */
export interface RaagNoteItem {
  swara: CanonicalYamanSwara;
  pitch: string;
  midi: number;
  interval: number;
  info: SwaraInfo;
}

export function getYamanScaleDetails(tonic: string): RaagNoteItem[] {
  return YAMAN_SWARA_ORDER.map((swara) => {
    const midi = yamanToMidi(tonic, swara);
    const pitch = midiToPitchName(midi);
    const interval = YAMAN_SWARA_INTERVALS[swara];
    const info = SWARA_DETAILS[swara];
    return {
      swara,
      pitch,
      midi,
      interval,
      info,
    };
  });
}

/**
 * Converts a Western pitch (e.g. "F#4") to its Yaman swara relative to a tonic.
 */
export function westernToYaman(tonic: string, pitch: string): string | null {
  const midi = Note.midi(pitch);
  if (midi === null || midi === undefined) return null;
  return midiToYaman(tonic, midi);
}
