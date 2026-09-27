/**
 * Metadata-Driven Musical Compatibility Engine for D3 MusiQ
 * 
 * Inspects active project tracks to identify arrangement roles:
 * [Melody, Rhythm, Atmosphere, Vocal]
 * and generates non-intrusive contextual suggestions (Hear / Add / Ignore)
 * based on tonic, scale, tempo, and arrangement balance.
 */

import { SoundAsset } from "./types";
import { SOUND_ASSETS, getSoundAssetById } from "./assets-catalog";
import type { ProjectTrack } from "@/store/useProjectStore";

export interface CompatibleSuggestion {
  id: string;
  asset: SoundAsset;
  title: string;
  reason: string;
}

/**
 * Computes compatible suggestions based on current tracks and musical context.
 */
export function getCompatibleSuggestions(
  tracks: ProjectTrack[],
  currentTonic = "C",
  currentScale = "yaman",
  catalog: SoundAsset[] = SOUND_ASSETS
): CompatibleSuggestion[] {
  const activeTracks = tracks.filter((t) => !t.muted && (t.isAudioTrack ? !!t.audioBlobUrl : t.notes.length > 0));

  const hasMelody = activeTracks.some((t) =>
    ["flute", "pluck", "piano", "violin", "guitar"].includes(t.instrument)
  );
  const hasRhythm = activeTracks.some((t) => ["tabla", "beats"].includes(t.instrument));
  const hasAtmosphere = activeTracks.some((t) => ["poly", "fm"].includes(t.instrument));
  const hasVocal = activeTracks.some((t) => t.isAudioTrack && !!t.audioBlobUrl);

  const existingInstrumentIds = new Set(activeTracks.map((t) => t.instrument));

  const suggestions: CompatibleSuggestion[] = [];

  // 1. Vocal take exists without atmospheric drone/tanpura
  if (hasVocal && !hasAtmosphere) {
    const drone = getSoundAssetById("asset-tanpura-sa-pa-drone");
    if (drone) {
      suggestions.push({
        id: "sug-vocal-drone",
        asset: drone,
        title: "GROUND VOCALS WITH TANPURA",
        reason: "A peaceful Sa-Pa Tanpura Drone anchors your vocal performance in pitch and harmonic depth.",
      });
    }
  }

  // 2. Melody exists, but missing Rhythm (Tabla or Beats)
  if (hasMelody && !hasRhythm) {
    const tabla = getSoundAssetById("asset-tabla-keherwa-groove") || getSoundAssetById("asset-tabla-teental-theka");
    if (tabla) {
      suggestions.push({
        id: "sug-melody-rhythm",
        asset: tabla,
        title: "GROUND WITH TABLA RHYTHM",
        reason: "A relaxed 16-step Classical Tabla groove will lock your melodic phrases in steady time.",
      });
    }
  }

  // 3. Melody exists (and rhythm is either present or being built), but missing Atmosphere
  if (hasMelody && !hasAtmosphere) {
    const pad = getSoundAssetById("asset-pad-warm-meditative-bed") || getSoundAssetById("asset-tanpura-sa-pa-drone");
    if (pad) {
      suggestions.push({
        id: "sug-melody-atmosphere",
        asset: pad,
        title: "ADD MEDITATIVE ATMOSPHERE",
        reason: "A warm ambient bed fills the background space between flute notes without cluttering the mix.",
      });
    }
  }

  // 4. Rhythm and Atmosphere present, but missing melodic lead
  if (hasRhythm && hasAtmosphere && !hasMelody) {
    const bansuri = getSoundAssetById("asset-bansuri-peaceful-morning");
    if (bansuri) {
      suggestions.push({
        id: "sug-lead-bansuri",
        asset: bansuri,
        title: "ADD PEACEFUL BANSURI LEAD",
        reason: "Your groove and drone are ready. Add an expressive breathy bamboo flute motif on top.",
      });
    }
  }

  // 5. Melody has Bansuri, but missing complementary plucked string (Veena counterpoint)
  const hasBansuri = activeTracks.some((t) => t.instrument === "flute");
  const hasVeena = activeTracks.some((t) => t.instrument === "pluck");
  if (hasBansuri && !hasVeena && hasRhythm) {
    const veena = getSoundAssetById("asset-veena-teevra-ma-cadence");
    if (veena) {
      suggestions.push({
        id: "sug-veena-counterpoint",
        asset: veena,
        title: "ADD CRISP VEENA COUNTERPOINT",
        reason: "Plucked Saraswati Veena notes highlight Yaman's Teevra Ma against the breathy flute.",
      });
    }
  }

  // 6. Complete trio (Melody + Rhythm + Atmosphere) -> suggest piano harmonic layer
  if (hasMelody && hasRhythm && hasAtmosphere && !existingInstrumentIds.has("piano")) {
    const piano = getSoundAssetById("asset-piano-gentle-arpeggio");
    if (piano) {
      suggestions.push({
        id: "sug-piano-harmony",
        asset: piano,
        title: "ENRICH WITH PIANO ARPEGGIO",
        reason: "Acoustic grand piano arpeggios add gentle Western harmonic clarity to the arrangement.",
      });
    }
  }

  return suggestions;
}
