/**
 * Open Library Catalog for D3 MusiQ
 * 
 * Provides predefined scales, raagas, note sets, loops, and phrases
 * for manual discovery, auditioning, layering, and composition.
 */

import { LibraryLoop, LibraryRaaga } from "./types";
export * from "./types";
export * from "./instruments";

export interface InstrumentPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: "piano",
    name: "Concert Grand Piano",
    category: "Keyboard",
    description: "Acoustic multi-sampled grand piano (Salamander)",
    icon: "Piano",
  },
  {
    id: "pluck",
    name: "Saraswati Veena",
    category: "String",
    description: "Snappy metallic pluck with acoustic sympathetic resonance",
    icon: "Zap",
  },
  {
    id: "tabla",
    name: "Classical Tabla",
    category: "Percussion",
    description: "Traditional Indian drum pair (Bayan & Dayan) with bols",
    icon: "Disc",
  },
  {
    id: "flute",
    name: "Bansuri Flute",
    category: "Woodwind",
    description: "Breathy bamboo flute with warm harmonic contour",
    icon: "Wind",
  },
  {
    id: "poly",
    name: "Atmospheric Pad",
    category: "Electronic",
    description: "Analog warmth with soft envelope and smooth resonance",
    icon: "Layers",
  },
  {
    id: "fm",
    name: "FM Bell Chime",
    category: "Electronic",
    description: "Bright, crystalline frequency modulation chime",
    icon: "Bell",
  },
  {
    id: "violin",
    name: "Acoustic Violin",
    category: "String",
    description: "Expressive bowed violin string tone with natural vibrato",
    icon: "Music",
  },
  {
    id: "guitar",
    name: "Acoustic Guitar",
    category: "String",
    description: "Warm nylon string acoustic guitar with fingerstyle attack",
    icon: "Zap",
  },
  {
    id: "beats",
    name: "808 Rhythm Kit",
    category: "Percussion",
    description: "Punchy electronic drum machine kit with sub-bass kick",
    icon: "Radio",
  },
];

export interface ScaleDefinition {
  id: "yaman" | "chromatic";
  name: string;
  tradition: "Carnatic / Hindustani" | "Western";
  description: string;
  swaras?: string[];
  intervals: number[];
}

export const SCALES_CATALOG: ScaleDefinition[] = [
  {
    id: "yaman",
    name: "Raag Yaman (Kalyani)",
    tradition: "Carnatic / Hindustani",
    description: "65th Melakarta Mechakalyani. Auspicious evening raag equivalent to Western Lydian mode.",
    swaras: ["S", "R2", "G3", "M2", "P", "D2", "N3", "S'"],
    intervals: [0, 2, 4, 6, 7, 9, 11, 12],
  },
  {
    id: "chromatic",
    name: "Chromatic Scale",
    tradition: "Western",
    description: "All 12 equal-tempered semitones across an octave.",
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
];

/**
 * Open Library Raagas with characteristic swaras and phrase previews
 */
export const LIBRARY_RAAGAS: LibraryRaaga[] = [
  {
    id: "yaman",
    name: "Raag Yaman",
    carnaticName: "Mechakalyani (65th Melakarta)",
    westernEquivalent: "Lydian Mode (Teevra Ma ♯4)",
    description: "Peaceful evening raaga emphasizing Gandhara (G3) and Nishada (N3) with characteristic Teevra Ma.",
    swaras: ["S", "R2", "G3", "M2", "P", "D2", "N3", "S'"],
    previewPitch: "F#4",
    characteristicPhrase: [
      { step: 0, pitch: "C4", swara: "S", duration: 2, velocity: 0.8 },
      { step: 2, pitch: "E4", swara: "G3", duration: 2, velocity: 0.85 },
      { step: 4, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.95 },
      { step: 6, pitch: "G4", swara: "P", duration: 2, velocity: 0.85 },
      { step: 8, pitch: "E4", swara: "G3", duration: 2, velocity: 0.8 },
      { step: 10, pitch: "A4", swara: "D2", duration: 2, velocity: 0.85 },
      { step: 12, pitch: "B4", swara: "N3", duration: 2, velocity: 0.9 },
      { step: 14, pitch: "C5", swara: "S'", duration: 2, velocity: 0.95 },
    ],
  },
  {
    id: "bhairavi",
    name: "Raag Bhairavi",
    carnaticName: "Hanumatodi (8th Melakarta)",
    westernEquivalent: "Phrygian Mode",
    description: "Soul-stirring morning / concluding raaga using komal rishabh, gandhar, dhaivat, and nishad.",
    swaras: ["S", "R1", "G2", "M1", "P", "D1", "N2", "S'"],
    previewPitch: "D#4",
    characteristicPhrase: [
      { step: 0, pitch: "C4", swara: "S", duration: 2, velocity: 0.85 },
      { step: 4, pitch: "C#4", swara: "R1", duration: 2, velocity: 0.8 },
      { step: 8, pitch: "D#4", swara: "G2", duration: 2, velocity: 0.85 },
      { step: 12, pitch: "F4", swara: "M1", duration: 4, velocity: 0.9 },
    ],
  },
  {
    id: "mohanam",
    name: "Raag Mohanam",
    carnaticName: "Mohanam / Bhupali",
    westernEquivalent: "Major Pentatonic",
    description: "Auspicious pentatonic scale: S · R2 · G3 · P · D2. Universally resonant and uplifting.",
    swaras: ["S", "R2", "G3", "P", "D2", "S'"],
    previewPitch: "E4",
    characteristicPhrase: [
      { step: 0, pitch: "C4", swara: "S", duration: 2, velocity: 0.8 },
      { step: 4, pitch: "D4", swara: "R2", duration: 2, velocity: 0.85 },
      { step: 8, pitch: "E4", swara: "G3", duration: 2, velocity: 0.9 },
      { step: 12, pitch: "G4", swara: "P", duration: 4, velocity: 0.85 },
    ],
  },
];

/**
 * Curated Loops across 4 core categories: Rhythm, Melody, Bass, Atmosphere
 */
export const LIBRARY_LOOPS: LibraryLoop[] = [
  // Rhythm Loop
  {
    id: "loop-tabla-teental",
    name: "Classical Teental 16-Beat",
    category: "rhythm",
    instrumentId: "tabla",
    instrumentName: "Classical Tabla",
    tempoBpm: 110,
    description: "Traditional 16-beat cycle with open Bayan bass and Dayan ring.",
    previewPitch: "C4",
    notes: [
      { step: 0, pitch: "C4", bol: "Dha", duration: 1, velocity: 0.9 },
      { step: 2, pitch: "D4", bol: "Dhin", duration: 1, velocity: 0.8 },
      { step: 4, pitch: "D4", bol: "Dhin", duration: 1, velocity: 0.8 },
      { step: 6, pitch: "C4", bol: "Dha", duration: 1, velocity: 0.9 },
      { step: 8, pitch: "C4", bol: "Dha", duration: 1, velocity: 0.9 },
      { step: 10, pitch: "D4", bol: "Dhin", duration: 1, velocity: 0.8 },
      { step: 12, pitch: "D4", bol: "Dhin", duration: 1, velocity: 0.8 },
      { step: 14, pitch: "C4", bol: "Dha", duration: 1, velocity: 0.9 },
    ],
  },
  {
    id: "loop-808-sub",
    name: "808 Sub-Bass Groove",
    category: "rhythm",
    instrumentId: "beats",
    instrumentName: "808 Rhythm Kit",
    tempoBpm: 110,
    description: "Modern punchy acoustic kick, crisp clap, and driving rhythmic pulse.",
    previewPitch: "C4",
    notes: [
      { step: 0, pitch: "C4", bol: "Kick", duration: 1, velocity: 0.95 },
      { step: 4, pitch: "D4", bol: "Snare", duration: 1, velocity: 0.85 },
      { step: 8, pitch: "C4", bol: "Kick", duration: 1, velocity: 0.9 },
      { step: 12, pitch: "D4", bol: "Snare", duration: 1, velocity: 0.85 },
    ],
  },
  // Melody Loop
  {
    id: "loop-veena-motif",
    name: "Veena Yaman Sanchara",
    category: "melody",
    instrumentId: "pluck",
    instrumentName: "Saraswati Veena",
    tempoBpm: 110,
    description: "Classic plucked Carnatic phrase moving through Gandhara and Teevra Ma.",
    previewPitch: "F#4",
    notes: [
      { step: 2, pitch: "E4", swara: "G3", duration: 2, velocity: 0.85 },
      { step: 4, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.95 },
      { step: 6, pitch: "G4", swara: "P", duration: 2, velocity: 0.85 },
      { step: 10, pitch: "A4", swara: "D2", duration: 2, velocity: 0.8 },
      { step: 12, pitch: "B4", swara: "N3", duration: 2, velocity: 0.9 },
      { step: 14, pitch: "C5", swara: "S'", duration: 2, velocity: 0.95 },
    ],
  },
  {
    id: "loop-bansuri-contour",
    name: "Bansuri Morning Breeze",
    category: "melody",
    instrumentId: "flute",
    instrumentName: "Bansuri Flute",
    tempoBpm: 110,
    description: "Warm breathy phrase weaving softly between G3 and Panchama.",
    previewPitch: "E4",
    notes: [
      { step: 4, pitch: "E4", swara: "G3", duration: 2, velocity: 0.8 },
      { step: 6, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.85 },
      { step: 8, pitch: "G4", swara: "P", duration: 3, velocity: 0.9 },
      { step: 12, pitch: "E4", swara: "G3", duration: 3, velocity: 0.8 },
    ],
  },
  // Atmosphere Loop
  {
    id: "loop-pad-drone",
    name: "Cinematic Sa-Pa Pad Drone",
    category: "atmosphere",
    instrumentId: "poly",
    instrumentName: "Atmospheric Pad",
    tempoBpm: 110,
    description: "Rich ambient foundation with root Sa (C4) and fifth Pa (G4) harmonic resonance.",
    previewPitch: "C4",
    notes: [
      { step: 0, pitch: "C4", swara: "S", duration: 16, velocity: 0.6 },
      { step: 0, pitch: "G4", swara: "P", duration: 16, velocity: 0.55 },
    ],
  },
  // Bass Loop
  {
    id: "loop-piano-bassline",
    name: "Piano Tonic Bass Anchor",
    category: "bass",
    instrumentId: "piano",
    instrumentName: "Concert Grand Piano",
    tempoBpm: 110,
    description: "Deep low-octave acoustic root notes anchoring the downbeats.",
    previewPitch: "C3",
    notes: [
      { step: 0, pitch: "C3", swara: "S", duration: 4, velocity: 0.9 },
      { step: 8, pitch: "G3", swara: "P", duration: 4, velocity: 0.85 },
    ],
  },
];

/**
 * Recommended Phrases for one-click discovery & audition
 */
export const RECOMMENDED_PHRASES = [
  {
    id: "phrase-teevra-ma",
    title: "Teevra Ma Signature Pluck",
    instrumentId: "pluck",
    instrumentName: "Saraswati Veena",
    description: "Highlighting Yaman's essential ♯4 color (G3 → M2 → P)",
    previewPitch: "F#4",
    notes: [
      { step: 4, pitch: "E4", swara: "G3", duration: 2, velocity: 0.85 },
      { step: 6, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.95 },
      { step: 8, pitch: "G4", swara: "P", duration: 4, velocity: 0.9 },
    ],
  },
  {
    id: "phrase-bansuri-meend",
    title: "Soft Bansuri Glide",
    instrumentId: "flute",
    instrumentName: "Bansuri Flute",
    description: "Gentle breathy glide over steps 4 to 12",
    previewPitch: "E4",
    notes: [
      { step: 4, pitch: "E4", swara: "G3", duration: 2, velocity: 0.8 },
      { step: 6, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.85 },
      { step: 8, pitch: "G4", swara: "P", duration: 4, velocity: 0.9 },
    ],
  },
  {
    id: "phrase-piano-ascent",
    title: "Grand Piano Ascending Cadence",
    instrumentId: "piano",
    instrumentName: "Concert Grand Piano",
    description: "D2 → N3 → S' leading back to the upper octave",
    previewPitch: "B4",
    notes: [
      { step: 10, pitch: "A4", swara: "D2", duration: 2, velocity: 0.8 },
      { step: 12, pitch: "B4", swara: "N3", duration: 2, velocity: 0.9 },
      { step: 14, pitch: "C5", swara: "S'", duration: 2, velocity: 0.95 },
    ],
  },
];

/**
 * Preset musical Yaman melodic phrase (16-step loop)
 */
export const YAMAN_PRESET_MELODY = [
  { step: 0, pitch: "C4", swara: "S", duration: 2, velocity: 0.8 },
  { step: 2, pitch: "E4", swara: "G3", duration: 2, velocity: 0.85 },
  { step: 4, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.9 },
  { step: 6, pitch: "G4", swara: "P", duration: 2, velocity: 0.8 },
  { step: 8, pitch: "E4", swara: "G3", duration: 2, velocity: 0.75 },
  { step: 10, pitch: "A4", swara: "D2", duration: 2, velocity: 0.85 },
  { step: 12, pitch: "B4", swara: "N3", duration: 2, velocity: 0.9 },
  { step: 14, pitch: "C5", swara: "S'", duration: 2, velocity: 0.95 },
];
