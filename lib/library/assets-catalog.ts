/**
 * Sound Asset Catalog for D3 MusiQ — Library Foundation Alpha
 * 
 * Defines validated SoundAsset entries for the 4 hero sound families:
 * 1. Bansuri (Bamboo Flute)
 * 2. Saraswati Veena
 * 3. Classical Tabla
 * 4. Atmospheric Pad / Tanpura Drone
 * Plus essential foundations (Concert Grand Piano & 808 Minimal Rhythm).
 * 
 * All assets conform to SoundAssetSchema and respect canonical swara boundaries.
 */

import { SoundAsset, validateSoundAsset } from "./types";

export const SOUND_ASSETS: SoundAsset[] = [
  /* ======================================================================
     1. BANSURI (BAMBOO FLUTE) — Hero Woodwind Family
     ====================================================================== */
  {
    id: "asset-bansuri-peaceful-morning",
    name: "Peaceful Morning Bansuri",
    description: "Gentle breathy bamboo flute phrase weaving calmly between Gandhara and Panchama.",
    slug: "peaceful-morning-bansuri",
    instrumentId: "flute",
    instrumentFamily: "woodwind",
    tradition: "hindustani",
    materialType: "phrase",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["G3", "M2", "P", "G3"],
      stepNotes: [
        { step: 2, note: "E4", swara: "G3", duration: "4n", velocity: 0.8 },
        { step: 6, note: "F#4", swara: "M2", duration: "4n", velocity: 0.85 },
        { step: 10, note: "G4", swara: "P", duration: "2n", velocity: 0.9 },
        { step: 14, note: "E4", swara: "G3", duration: "4n", velocity: 0.75 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "C5" },
    },
    tags: {
      moods: ["peaceful", "calm", "morning", "soothing", "meditative", "gentle"],
      genres: ["classical", "ambient", "devotional", "acoustic"],
      complexity: "beginner",
      energy: "low",
      character: ["breathy", "warm", "flowing", "organic"],
      keywords: ["flute", "bansuri", "woodwind", "peaceful flute", "morning", "wind"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "flute",
      label: "Synthesized Physical Model (Dual-Oscillator FM + Breathy Filter)",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Aerophone Synthesis",
      license: "MIT",
      notes: "Sinusoidal physical modeling approximating Indian bamboo flute embouchure.",
    },
  },
  {
    id: "asset-bansuri-yaman-contour",
    name: "Emotional Yaman Bansuri Contour",
    description: "Expressive melodic contour emphasizing Yaman's signature Teevra Ma and high Sa.",
    slug: "emotional-yaman-bansuri-contour",
    instrumentId: "flute",
    instrumentFamily: "woodwind",
    tradition: "hindustani",
    materialType: "phrase",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["S", "G3", "M2", "P", "D2", "N3", "S'"],
      stepNotes: [
        { step: 0, note: "C4", swara: "S", duration: "4n", velocity: 0.8 },
        { step: 4, note: "E4", swara: "G3", duration: "4n", velocity: 0.85 },
        { step: 6, note: "F#4", swara: "M2", duration: "4n", velocity: 0.9 },
        { step: 8, note: "G4", swara: "P", duration: "4n", velocity: 0.85 },
        { step: 12, note: "B4", swara: "N3", duration: "4n", velocity: 0.9 },
        { step: 14, note: "C5", swara: "S'", duration: "4n", velocity: 0.95 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "C5" },
    },
    tags: {
      moods: ["emotional", "peaceful", "expressive", "lyrical", "serene"],
      genres: ["classical", "cinematic", "raga"],
      complexity: "intermediate",
      energy: "medium",
      character: ["ornamented", "dynamic", "expressive"],
      keywords: ["flute", "bansuri", "contour", "yaman", "melody", "swara"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "flute",
      label: "Synthesized Physical Model (Dual-Oscillator FM + Breathy Filter)",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Aerophone Synthesis",
      license: "MIT",
    },
  },
  {
    id: "asset-bansuri-sustained-drone",
    name: "Meditative Bansuri Drone",
    description: "Sustained peaceful root Sa and fifth Pa breathy tone providing acoustic tranquility.",
    slug: "meditative-bansuri-drone",
    instrumentId: "flute",
    instrumentFamily: "woodwind",
    tradition: "hindustani",
    materialType: "drone",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["S", "P"],
      stepNotes: [
        { step: 0, note: "C4", swara: "S", duration: "2n", velocity: 0.75 },
        { step: 8, note: "G4", swara: "P", duration: "2n", velocity: 0.75 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "G4" },
    },
    tags: {
      moods: ["meditative", "peaceful", "drone", "calm", "spacious"],
      genres: ["ambient", "meditation", "drone"],
      complexity: "beginner",
      energy: "low",
      character: ["sustained", "still", "deep"],
      keywords: ["flute", "drone", "meditation", "peaceful flute", "sustained"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "flute",
      label: "Synthesized Physical Model (Dual-Oscillator FM + Breathy Filter)",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Aerophone Synthesis",
      license: "MIT",
    },
  },
  {
    id: "asset-bansuri-gamak-motif",
    name: "Airy Flute Gamak Motif",
    description: "Light ornament oscillations across Panchama and Dhaivat with rapid breath release.",
    slug: "airy-flute-gamak-motif",
    instrumentId: "flute",
    instrumentFamily: "woodwind",
    tradition: "hindustani",
    materialType: "phrase",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["P", "D2", "P", "M2"],
      stepNotes: [
        { step: 4, note: "G4", swara: "P", duration: "8n", velocity: 0.8 },
        { step: 6, note: "A4", swara: "D2", duration: "8n", velocity: 0.85 },
        { step: 8, note: "G4", swara: "P", duration: "4n", velocity: 0.8 },
        { step: 12, note: "F#4", swara: "M2", duration: "4n", velocity: 0.75 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "F#4", highest: "A4" },
    },
    tags: {
      moods: ["peaceful", "airy", "lyrical", "ornamented"],
      genres: ["classical", "folk", "world"],
      complexity: "intermediate",
      energy: "low",
      character: ["airy", "delicate", "ornamented"],
      keywords: ["flute", "gamak", "ornament", "airy flute", "bansuri"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "flute",
      label: "Synthesized Physical Model (Dual-Oscillator FM + Breathy Filter)",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Aerophone Synthesis",
      license: "MIT",
    },
  },

  /* ======================================================================
     2. SARASWATI VEENA — Hero Plucked String Family
     ====================================================================== */
  {
    id: "asset-veena-yaman-sanchara",
    name: "Yaman Sanchara Veena Phrase",
    description: "Classic plucked Carnatic phrase moving through Gandhara and Teevra Ma with sympathetic resonance.",
    slug: "yaman-sanchara-veena-phrase",
    instrumentId: "pluck",
    instrumentFamily: "plucked_string",
    tradition: "carnatic",
    materialType: "phrase",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman (Mechakalyani)",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["G3", "M2", "P", "D2", "N3", "S'"],
      stepNotes: [
        { step: 2, note: "E4", swara: "G3", duration: "4n", velocity: 0.85 },
        { step: 4, note: "F#4", swara: "M2", duration: "4n", velocity: 0.95 },
        { step: 6, note: "G4", swara: "P", duration: "4n", velocity: 0.85 },
        { step: 10, note: "A4", swara: "D2", duration: "4n", velocity: 0.8 },
        { step: 12, note: "B4", swara: "N3", duration: "4n", velocity: 0.9 },
        { step: 14, note: "C5", swara: "S'", duration: "4n", velocity: 0.95 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "E4", highest: "C5" },
    },
    tags: {
      moods: ["classical", "bright", "plucked", "meditative", "devotional"],
      genres: ["carnatic", "classical", "acoustic"],
      complexity: "intermediate",
      energy: "medium",
      character: ["metallic", "resonant", "articulate"],
      keywords: ["veena", "saraswati veena", "pluck", "string", "carnatic", "yaman"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "pluck",
      label: "Synthesized Physical Pluck Model",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Chordophone Modeling",
      license: "MIT",
    },
  },
  {
    id: "asset-veena-teevra-ma-cadence",
    name: "Teevra Ma Signature Pluck",
    description: "Bold pluck cadence highlighting Yaman's defining sharp-fourth color.",
    slug: "teevra-ma-signature-pluck",
    instrumentId: "pluck",
    instrumentFamily: "plucked_string",
    tradition: "carnatic",
    materialType: "phrase",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman (Mechakalyani)",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["G3", "M2", "P"],
      stepNotes: [
        { step: 4, note: "E4", swara: "G3", duration: "4n", velocity: 0.85 },
        { step: 6, note: "F#4", swara: "M2", duration: "4n", velocity: 0.95 },
        { step: 8, note: "G4", swara: "P", duration: "2n", velocity: 0.9 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "E4", highest: "G4" },
    },
    tags: {
      moods: ["classical", "resonant", "intricate", "peaceful"],
      genres: ["carnatic", "raga", "acoustic"],
      complexity: "beginner",
      energy: "low",
      character: ["plucked", "resonant", "focused"],
      keywords: ["veena", "teevra ma", "pluck", "cadence", "yaman"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "pluck",
      label: "Synthesized Physical Pluck Model",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Chordophone Modeling",
      license: "MIT",
    },
  },
  {
    id: "asset-veena-jhala-groove",
    name: "Veena Jhala Pluck Groove",
    description: "Rapid chikari drone string rhythmic plucks creating high acoustic momentum.",
    slug: "veena-jhala-pluck-groove",
    instrumentId: "pluck",
    instrumentFamily: "plucked_string",
    tradition: "carnatic",
    materialType: "pattern",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["S", "P", "S'"],
      stepNotes: [
        { step: 0, note: "C4", swara: "S", duration: "8n", velocity: 0.9 },
        { step: 2, note: "G4", swara: "P", duration: "8n", velocity: 0.8 },
        { step: 4, note: "C4", swara: "S", duration: "8n", velocity: 0.85 },
        { step: 6, note: "C5", swara: "S'", duration: "8n", velocity: 0.9 },
        { step: 8, note: "C4", swara: "S", duration: "8n", velocity: 0.9 },
        { step: 10, note: "G4", swara: "P", duration: "8n", velocity: 0.8 },
        { step: 12, note: "C4", swara: "S", duration: "8n", velocity: 0.85 },
        { step: 14, note: "G4", swara: "P", duration: "8n", velocity: 0.8 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "C5" },
    },
    tags: {
      moods: ["energetic", "rhythmic", "classical", "bright"],
      genres: ["carnatic", "acoustic"],
      complexity: "intermediate",
      energy: "high",
      character: ["percussive", "strummed", "driving"],
      keywords: ["veena", "jhala", "strum", "chikari", "rhythm"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "pluck",
      label: "Synthesized Physical Pluck Model",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Chordophone Modeling",
      license: "MIT",
    },
  },

  /* ======================================================================
     3. CLASSICAL TABLA — Hero Percussion Family
     ====================================================================== */
  {
    id: "asset-tabla-teental-theka",
    name: "Slow Classical Teental 16-Beat",
    description: "Standard 16-beat Hindustani cycle (Dha Dhin Dhin Dha) with deep Bayan modulation.",
    slug: "slow-classical-teental-16-beat",
    instrumentId: "tabla",
    instrumentFamily: "percussion_tuned",
    tradition: "hindustani",
    materialType: "loop",
    musicalInfo: {
      tonic: "C4",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      bols: ["Dha", "Dhin", "Ge", "Na", "Tin", "Ta"],
      stepNotes: [
        { step: 0, note: "C4", bol: "Dha", duration: "4n", velocity: 0.9 },
        { step: 2, note: "D4", bol: "Dhin", duration: "4n", velocity: 0.8 },
        { step: 4, note: "D4", bol: "Dhin", duration: "4n", velocity: 0.8 },
        { step: 6, note: "C4", bol: "Dha", duration: "4n", velocity: 0.9 },
        { step: 8, note: "C4", bol: "Dha", duration: "4n", velocity: 0.9 },
        { step: 10, note: "D4", bol: "Dhin", duration: "4n", velocity: 0.8 },
        { step: 12, note: "D4", bol: "Dhin", duration: "4n", velocity: 0.8 },
        { step: 14, note: "C4", bol: "Dha", duration: "4n", velocity: 0.9 },
      ],
      isTonicAgnostic: true,
      playableRange: { lowest: "C4", highest: "G4" },
    },
    tags: {
      moods: ["steady", "rhythmic", "grounding", "acoustic", "slow", "meditative"],
      genres: ["hindustani", "classical", "acoustic", "world"],
      complexity: "beginner",
      energy: "medium",
      character: ["grounded", "resonant", "percussive"],
      keywords: ["tabla", "teental", "theka", "percussion", "rhythm", "slow tabla", "drums"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "tabla",
      label: "Synthesized Percussion Model with Bayan Modulation",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Percussion Synthesis",
      license: "MIT",
    },
  },
  {
    id: "asset-tabla-keherwa-groove",
    name: "Slow Keherwa 8-Beat Groove",
    description: "Relaxed 8-beat syncopated Indian rhythm loop that locks effortlessly under melodic phrases.",
    slug: "slow-keherwa-8-beat-groove",
    instrumentId: "tabla",
    instrumentFamily: "percussion_tuned",
    tradition: "hindustani",
    materialType: "loop",
    musicalInfo: {
      tonic: "C4",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      bols: ["Dha", "Ge", "Na", "Tin"],
      stepNotes: [
        { step: 0, note: "C4", bol: "Dha", duration: "4n", velocity: 0.9 },
        { step: 4, note: "E4", bol: "Ge", duration: "4n", velocity: 0.8 },
        { step: 8, note: "F#4", bol: "Na", duration: "4n", velocity: 0.85 },
        { step: 12, note: "G4", bol: "Tin", duration: "4n", velocity: 0.75 },
      ],
      isTonicAgnostic: true,
      playableRange: { lowest: "C4", highest: "G4" },
    },
    tags: {
      moods: ["peaceful", "slow", "groove", "meditative", "steady"],
      genres: ["ghazal", "folk", "acoustic", "fusion"],
      complexity: "beginner",
      energy: "low",
      character: ["laid-back", "syncopated", "warm"],
      keywords: ["tabla", "keherwa", "slow tabla", "groove", "rhythm", "beat"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "tabla",
      label: "Synthesized Percussion Model with Bayan Modulation",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Percussion Synthesis",
      license: "MIT",
    },
  },
  {
    id: "asset-tabla-rupak-flow",
    name: "Meditative Rupak 7-Beat Flow",
    description: "Intricate 7-beat asymmetrical rhythmic cadence with gentle Bayan bass glide.",
    slug: "meditative-rupak-7-beat-flow",
    instrumentId: "tabla",
    instrumentFamily: "percussion_tuned",
    tradition: "hindustani",
    materialType: "pattern",
    musicalInfo: {
      tonic: "C4",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      bols: ["Tin", "Na", "Dhin"],
      stepNotes: [
        { step: 0, note: "G4", bol: "Tin", duration: "4n", velocity: 0.8 },
        { step: 3, note: "G4", bol: "Tin", duration: "4n", velocity: 0.75 },
        { step: 6, note: "F#4", bol: "Na", duration: "4n", velocity: 0.85 },
        { step: 9, note: "D4", bol: "Dhin", duration: "4n", velocity: 0.9 },
        { step: 12, note: "F#4", bol: "Na", duration: "4n", velocity: 0.8 },
      ],
      isTonicAgnostic: true,
      playableRange: { lowest: "D4", highest: "G4" },
    },
    tags: {
      moods: ["meditative", "slow", "intricate", "contemplative"],
      genres: ["classical", "devotional", "ambient"],
      complexity: "intermediate",
      energy: "low",
      character: ["asymmetrical", "gentle", "resonant"],
      keywords: ["tabla", "rupak", "meditative", "flow", "rhythm"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "tabla",
      label: "Synthesized Percussion Model with Bayan Modulation",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Percussion Synthesis",
      license: "MIT",
    },
  },

  /* ======================================================================
     4. ATMOSPHERIC PAD / TANPURA DRONE — Hero Atmosphere Family
     ====================================================================== */
  {
    id: "asset-tanpura-sa-pa-drone",
    name: "Peaceful Sa-Pa Tanpura Drone",
    description: "Traditional continuous Sa-Pa harmonic grounding bed establishing pitch and meditative stillness.",
    slug: "peaceful-sa-pa-tanpura-drone",
    instrumentId: "poly",
    instrumentFamily: "synthetic",
    tradition: "hindustani",
    materialType: "drone",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["S", "P"],
      stepNotes: [
        { step: 0, note: "C4", swara: "S", duration: "1m", velocity: 0.65 },
        { step: 0, note: "G4", swara: "P", duration: "1m", velocity: 0.6 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "G4" },
    },
    tags: {
      moods: ["peaceful", "drone", "meditative", "background", "anchor", "calm"],
      genres: ["classical", "ambient", "meditation"],
      complexity: "beginner",
      energy: "low",
      character: ["harmonic", "still", "grounding", "rich"],
      keywords: ["drone", "tanpura", "pad", "peaceful", "atmosphere", "background", "sa-pa"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "poly",
      label: "Polyphonic Harmonic Resonance Synth Model",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Harmonic Engine",
      license: "MIT",
      notes: "Sustained dual-oscillator acoustic bed tuned to Sa-Pa fifth interval.",
    },
  },
  {
    id: "asset-pad-warm-meditative-bed",
    name: "Warm Meditative Bed",
    description: "Lush warm polyphonic analog pad with soft filter roll-off and spacious stereo resonance.",
    slug: "warm-meditative-bed",
    instrumentId: "poly",
    instrumentFamily: "synthetic",
    tradition: "ambient",
    materialType: "texture",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["S", "G3", "P"],
      stepNotes: [
        { step: 0, note: "C4", swara: "S", duration: "1m", velocity: 0.6 },
        { step: 0, note: "E4", swara: "G3", duration: "1m", velocity: 0.55 },
        { step: 0, note: "G4", swara: "P", duration: "1m", velocity: 0.55 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "G4" },
    },
    tags: {
      moods: ["peaceful", "warm", "atmospheric", "meditative", "cinematic"],
      genres: ["ambient", "soundtrack", "downtempo"],
      complexity: "beginner",
      energy: "low",
      character: ["enveloping", "lush", "warm"],
      keywords: ["pad", "warm", "atmosphere", "bed", "peaceful", "meditative"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "poly",
      label: "Polyphonic Harmonic Resonance Synth Model",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Harmonic Engine",
      license: "MIT",
    },
  },
  {
    id: "asset-pad-mystic-shimmer",
    name: "Mystic Shimmer Pad",
    description: "High harmonic shimmer texture with gentle pulse that floats softly behind melodies.",
    slug: "mystic-shimmer-pad",
    instrumentId: "poly",
    instrumentFamily: "synthetic",
    tradition: "ambient",
    materialType: "texture",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["M2", "N3", "S'"],
      stepNotes: [
        { step: 0, note: "F#4", swara: "M2", duration: "2n", velocity: 0.5 },
        { step: 8, note: "B4", swara: "N3", duration: "2n", velocity: 0.5 },
        { step: 12, note: "C5", swara: "S'", duration: "4n", velocity: 0.55 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "F#4", highest: "C5" },
    },
    tags: {
      moods: ["mystic", "peaceful", "space", "texture", "reflective"],
      genres: ["ambient", "cinematic"],
      complexity: "intermediate",
      energy: "low",
      character: ["shimmering", "ethereal", "delicate"],
      keywords: ["shimmer", "pad", "mystic", "atmosphere", "space"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "poly",
      label: "Polyphonic Harmonic Resonance Synth Model",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Harmonic Engine",
      license: "MIT",
    },
  },

  /* ======================================================================
     5. ESSENTIAL FOUNDATIONS — Grand Piano & 808 Minimal Rhythm
     ====================================================================== */
  {
    id: "asset-piano-gentle-arpeggio",
    name: "Gentle Classical Piano Arpeggio",
    description: "Acoustic concert grand piano rolling arpeggio establishing sweet Yaman harmonies.",
    slug: "gentle-classical-piano-arpeggio",
    instrumentId: "piano",
    instrumentFamily: "keyboard",
    tradition: "western_classical",
    materialType: "phrase",
    musicalInfo: {
      tonic: "C4",
      raagaId: "yaman",
      raagaName: "Raag Yaman",
      scale: "yaman",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      swaraNotes: ["S", "G3", "P", "N3"],
      stepNotes: [
        { step: 0, note: "C4", swara: "S", duration: "4n", velocity: 0.8 },
        { step: 4, note: "E4", swara: "G3", duration: "4n", velocity: 0.85 },
        { step: 8, note: "G4", swara: "P", duration: "4n", velocity: 0.9 },
        { step: 12, note: "B4", swara: "N3", duration: "4n", velocity: 0.85 },
      ],
      isTonicAgnostic: false,
      playableRange: { lowest: "C4", highest: "B4" },
    },
    tags: {
      moods: ["peaceful", "gentle", "cinematic", "classical", "calm"],
      genres: ["western_classical", "neoclassical", "acoustic"],
      complexity: "beginner",
      energy: "low",
      character: ["acoustic", "dynamic", "crystalline"],
      keywords: ["piano", "grand piano", "arpeggio", "classical", "gentle", "acoustic"],
    },
    source: {
      type: "audio_sample",
      label: "Acoustic Multi-Sample (Salamander Grand Piano)",
      isAcousticRecording: true,
    },
    provenance: {
      creator: "Alexander Holm / Salamander Grand Piano",
      license: "CC BY 3.0",
      notes: "Recorded from Yamaha C5 grand piano across velocity layers.",
    },
  },
  {
    id: "asset-beats-808-minimal-groove",
    name: "808 Minimal Pulse Groove",
    description: "Subtle electronic sub-bass kick and rim click providing modern hybrid rhythm.",
    slug: "808-minimal-pulse-groove",
    instrumentId: "beats",
    instrumentFamily: "percussion_untuned",
    tradition: "electronic",
    materialType: "loop",
    musicalInfo: {
      tonic: "C4",
      tempoBpm: 75,
      timeSignature: [4, 4],
      durationBars: 1,
      stepCount: 16,
      bols: ["Kick", "Snare", "Rim"],
      stepNotes: [
        { step: 0, note: "C4", bol: "Kick", duration: "4n", velocity: 0.95 },
        { step: 4, note: "D4", bol: "Rim", duration: "4n", velocity: 0.75 },
        { step: 8, note: "C4", bol: "Kick", duration: "4n", velocity: 0.9 },
        { step: 12, note: "D4", bol: "Snare", duration: "4n", velocity: 0.85 },
      ],
      isTonicAgnostic: true,
      playableRange: { lowest: "C4", highest: "D4" },
    },
    tags: {
      moods: ["modern", "minimal", "low-energy", "steady"],
      genres: ["electronic", "lo-fi", "downtempo"],
      complexity: "beginner",
      energy: "medium",
      character: ["punchy", "sub-bass", "tight"],
      keywords: ["808", "beats", "drums", "pulse", "electronic", "kick"],
    },
    source: {
      type: "synth_preset",
      synthPresetId: "beats",
      label: "Synthesized Drum Machine Engine",
      isAcousticRecording: false,
    },
    provenance: {
      creator: "D3 MusiQ Electronic Rhythms",
      license: "MIT",
    },
  },
];

// Validate all assets at module load time to guarantee schema compliance
SOUND_ASSETS.forEach((asset) => {
  validateSoundAsset(asset);
});

/**
 * Quick helper to get an asset by its ID or slug.
 */
export function getSoundAssetById(id: string): SoundAsset | undefined {
  return SOUND_ASSETS.find((a) => a.id === id || a.slug === id);
}

/**
 * Filter sound assets by instrument family.
 */
export function getSoundAssetsByFamily(family: SoundAsset["instrumentFamily"]): SoundAsset[] {
  return SOUND_ASSETS.filter((a) => a.instrumentFamily === family);
}

/**
 * Filter sound assets by material type.
 */
export function getSoundAssetsByMaterialType(type: SoundAsset["materialType"]): SoundAsset[] {
  return SOUND_ASSETS.filter((a) => a.materialType === type);
}
