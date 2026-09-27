/**
 * Open Library Taxonomy & Types for D3 MusiQ
 * 
 * Provides structured categories, styles, instrument definitions,
 * loops, phrases, notes catalog, and sample mappings for the open music creation library.
 * Enforces strict honesty regarding real samples vs synthesized models.
 * Backed by validated SoundAssetSchema for Library Foundation Alpha.
 */

import { z } from "zod";
import { type CanonicalYamanSwara, isCanonicalYamanSwara } from "@/lib/theory/carnatic";

// Canonical swara Zod schema with boundary validation
export const CanonicalYamanSwaraSchema = z.custom<CanonicalYamanSwara>(
  (val) => isCanonicalYamanSwara(val),
  {
    message: "Expected a valid CanonicalYamanSwara ('S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3', 'S'')",
  }
);

export const SoundAssetSchema = z.object({
  // Identity
  id: z.string().min(3),
  name: z.string().min(2),
  description: z.string(),
  slug: z.string(),

  // Classification
  instrumentId: z.string(),
  instrumentFamily: z.enum([
    "plucked_string",
    "bowed_string",
    "woodwind",
    "percussion_tuned",
    "percussion_untuned",
    "keyboard",
    "voice",
    "synthetic",
  ]),
  tradition: z.enum([
    "carnatic",
    "hindustani",
    "western_classical",
    "ambient",
    "electronic",
    "global_folk",
    "hybrid",
  ]),
  materialType: z.enum([
    "phrase",
    "loop",
    "texture",
    "one_shot",
    "drone",
    "pattern",
  ]),

  // Musical Attributes
  musicalInfo: z.object({
    tonic: z.string(),
    raagaId: z.string().optional(),
    raagaName: z.string().optional(),
    scale: z.string().optional(),
    tempoBpm: z.number().int().min(30).max(300),
    timeSignature: z.tuple([z.number().int(), z.number().int()]),
    durationBars: z.number().positive(),
    stepCount: z.number().int().positive(),
    swaraNotes: z.array(CanonicalYamanSwaraSchema).optional(),
    bols: z.array(z.string()).optional(),
    stepNotes: z.array(
      z.object({
        step: z.number().int().min(0),
        note: z.string().optional(),
        swara: CanonicalYamanSwaraSchema.optional(),
        bol: z.string().optional(),
        duration: z.union([z.string(), z.number()]).optional(),
        velocity: z.number().min(0).max(1).optional(),
      })
    ),
    isTonicAgnostic: z.boolean().default(false),
    playableRange: z
      .object({
        lowest: z.string(),
        highest: z.string(),
      })
      .optional(),
  }),

  // Discovery
  tags: z.object({
    moods: z.array(z.string()),
    genres: z.array(z.string()),
    complexity: z.enum(["beginner", "intermediate", "advanced"]),
    energy: z.enum(["low", "medium", "high"]),
    character: z.array(z.string()),
    keywords: z.array(z.string()),
  }),

  // Source & Engine Backing
  source: z.object({
    type: z.enum(["synth_preset", "audio_sample", "hybrid"]),
    synthPresetId: z.string().optional(),
    audioUrl: z.string().url().optional(),
    label: z.string(),
    isAcousticRecording: z.boolean(),
  }),

  // Usage & Provenance
  provenance: z.object({
    creator: z.string(),
    license: z.string(),
    notes: z.string().optional(),
  }),
});

export type SoundAsset = z.infer<typeof SoundAssetSchema>;
export type SoundAssetFamily = z.infer<typeof SoundAssetSchema.shape.instrumentFamily>;
export type SoundAssetTradition = z.infer<typeof SoundAssetSchema.shape.tradition>;
export type SoundAssetMaterialType = z.infer<typeof SoundAssetSchema.shape.materialType>;

/**
 * Validates unknown data against the SoundAssetSchema.
 */
export function validateSoundAsset(data: unknown): SoundAsset {
  return SoundAssetSchema.parse(data);
}

/* ======================================================================
   LEGACY INTERFACES FOR BACKWARD COMPATIBILITY
   ====================================================================== */

export type MusicalStyle = 
  | "Carnatic / Indian Classical"
  | "Western Classical"
  | "Modern Electronic";

export type InstrumentCategory = 
  | "String"
  | "Keyboard"
  | "Percussion"
  | "Electronic"
  | "Woodwind"
  | "Brass";

export type InstrumentEngineType = "synth" | "sampler" | "percussion";

export type SoundSourceType = 
  | "real_sample"          // Verified multi-sampled acoustic recordings
  | "synthesized_model"    // Algorithmic physical / subtractive modeling
  | "analog_synth"         // Classic subtractive synthesizer
  | "digital_fm";          // Frequency modulation synthesis

export interface InstrumentNoteItem {
  pitch: string;           // Western pitch name, e.g. "C4"
  swara?: CanonicalYamanSwara; // Canonical Yaman swara, e.g. "S", "G3", "M2"
  bol?: string;            // Percussion stroke name, e.g. "Dha", "Dhin", "Kick", "Snare"
  degree?: string;         // Modal scale degree, e.g. "1", "3", "♯4"
  octave: number;          // 3, 4, 5
}

export interface InstrumentArticulation {
  id: string;
  name: string;            // e.g. "Sustain", "Pluck", "Meend Glide", "Jhala"
  description: string;
  isSimulated: boolean;    // true if generated via envelope/pitch modulation
}

export interface InstrumentPhrase {
  id: string;
  name: string;
  description: string;
  tempoBpm?: number;
  swaras?: CanonicalYamanSwara[];
  bols?: string[];
  notes: Array<{
    step: number;          // 0..15
    pitch: string;
    swara?: CanonicalYamanSwara;
    bol?: string;
    duration?: number;
    velocity?: number;
  }>;
}

export interface LibraryInstrument {
  id: string;
  name: string;
  shortName: string;
  category: InstrumentCategory;
  style: MusicalStyle;
  engineType: InstrumentEngineType;
  
  // Strict Honesty & Provenance Metadata
  soundSourceType: SoundSourceType;
  sourceLabel: string;          // "Real Acoustic Multi-Sample" vs "Synthesized Model"
  sourceDetails: string;        // Detailed explanation of the audio generation
  provenance: string;           // Provenance or author (e.g. "Salamander / Alexander Holm")
  license: string;              // "CC BY 3.0", "MIT", "D3 Synthetic Engine"
  
  description: string;
  tags: string[];
  defaultOctave: number;
  previewPitch: string;
  icon: string;

  // Rich Collection Content
  notesCatalog: InstrumentNoteItem[];
  articulations: InstrumentArticulation[];
  phrases: InstrumentPhrase[];
  
  // Sampler configuration (for acoustic sample-based instruments)
  samplerConfig?: {
    baseUrl: string;
    sampleMap: Record<string, string>;
  };
  
  // Percussion one-shot mappings (e.g. Tabla bols)
  percussionPads?: Array<{
    id: string;
    name: string;
    strokeName: string;
    description: string;
    pitchMapping: string; // Associated pitch on grid (e.g. "C4", "D4")
  }>;
}

export interface LibraryStyleFilter {
  id: string;
  name: string;
  style: MusicalStyle | "all";
  description: string;
}

export type LoopCategory = "rhythm" | "melody" | "bass" | "atmosphere";

export interface LibraryLoop {
  id: string;
  name: string;
  category: LoopCategory;
  instrumentId: string;
  instrumentName: string;
  tempoBpm: number;
  description: string;
  previewPitch: string;
  notes: Array<{ step: number; pitch: string; swara?: CanonicalYamanSwara; bol?: string; duration?: number; velocity?: number }>;
}

export interface LibraryRaaga {
  id: string;
  name: string;
  carnaticName: string;
  westernEquivalent: string;
  description: string;
  swaras: string[];
  previewPitch: string;
  characteristicPhrase: Array<{ step: number; pitch: string; swara?: string; bol?: string; duration?: number; velocity?: number }>;
}
