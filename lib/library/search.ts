/**
 * Semantic Plain-Language Search Engine for D3 MusiQ Open Library
 * 
 * Supports queries like:
 * - "peaceful flute"
 * - "slow tabla"
 * - "meditative drone"
 * - "warm atmosphere"
 * - "veena pluck"
 * 
 * Expands musical synonyms, matches mood tags, instrument families, and keywords,
 * and provides relevance-ranked results.
 */

import { SoundAsset } from "./types";
import { SOUND_ASSETS } from "./assets-catalog";

// Synonyms and aliases mapping
const ALIAS_MAP: Record<string, string[]> = {
  flute: ["bansuri", "woodwind", "bamboo", "wind", "aerophone"],
  bansuri: ["flute", "woodwind", "bamboo"],
  tabla: ["percussion", "drum", "drums", "rhythm", "theka", "bol"],
  drum: ["tabla", "beats", "percussion", "rhythm"],
  drums: ["tabla", "beats", "percussion", "rhythm"],
  beat: ["tabla", "beats", "groove", "rhythm"],
  beats: ["tabla", "beats", "groove", "rhythm"],
  drone: ["tanpura", "pad", "atmosphere", "sustained", "bed"],
  tanpura: ["drone", "atmosphere", "anchor", "sa-pa"],
  pad: ["drone", "atmosphere", "ambient", "texture", "bed", "poly"],
  atmosphere: ["drone", "pad", "tanpura", "texture", "ambient"],
  veena: ["pluck", "plucked_string", "string", "carnatic"],
  pluck: ["veena", "plucked_string", "string"],
  string: ["veena", "pluck", "plucked_string"],
  piano: ["keyboard", "grand", "acoustic", "arpeggio"],
  peaceful: ["calm", "meditative", "soothing", "serene", "gentle", "morning"],
  calm: ["peaceful", "meditative", "soothing", "gentle"],
  meditative: ["peaceful", "drone", "calm", "soothing", "still"],
  slow: ["laid-back", "gentle", "meditative", "75"],
  fast: ["energetic", "jhala", "driving"],
  groove: ["rhythm", "loop", "keherwa", "theka"],
};

/**
 * Searches sound assets by query string with synonym expansion and weighted scoring.
 */
export function searchSoundAssets(
  query: string,
  catalog: SoundAsset[] = SOUND_ASSETS
): SoundAsset[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return catalog;
  }

  // Tokenize query words
  const rawTokens = trimmed.split(/[\s,+-]+/).filter(Boolean);
  
  // Expand tokens with synonyms
  const searchTokens: string[] = [];
  rawTokens.forEach((tok) => {
    searchTokens.push(tok);
    if (ALIAS_MAP[tok]) {
      searchTokens.push(...ALIAS_MAP[tok]);
    }
  });

  const uniqueTokens = Array.from(new Set(searchTokens));

  interface ScoredAsset {
    asset: SoundAsset;
    score: number;
  }

  const scored: ScoredAsset[] = [];

  for (const asset of catalog) {
    let score = 0;
    const nameLower = asset.name.toLowerCase();
    const descLower = asset.description.toLowerCase();
    const instIdLower = asset.instrumentId.toLowerCase();
    const familyLower = asset.instrumentFamily.toLowerCase();
    const matTypeLower = asset.materialType.toLowerCase();
    const moodsLower = asset.tags.moods.map((m) => m.toLowerCase());
    const keywordsLower = asset.tags.keywords.map((k) => k.toLowerCase());
    const characterLower = asset.tags.character.map((c) => c.toLowerCase());

    // Exact full query match in title gets maximum boost
    if (nameLower.includes(trimmed)) {
      score += 40;
    }

    // Check each raw token and expanded token
    for (const rawTok of rawTokens) {
      if (nameLower.includes(rawTok)) score += 25;
      if (moodsLower.some((m) => m.includes(rawTok))) score += 20;
      if (keywordsLower.some((k) => k.includes(rawTok))) score += 15;
      if (instIdLower.includes(rawTok) || familyLower.includes(rawTok)) score += 15;
      if (matTypeLower.includes(rawTok)) score += 10;
      if (descLower.includes(rawTok)) score += 10;
    }

    // Expanded alias matches receive moderate weight
    for (const expTok of uniqueTokens) {
      if (!rawTokens.includes(expTok)) {
        if (nameLower.includes(expTok)) score += 10;
        if (moodsLower.some((m) => m.includes(expTok))) score += 8;
        if (keywordsLower.some((k) => k.includes(expTok))) score += 8;
        if (instIdLower.includes(expTok) || familyLower.includes(expTok)) score += 8;
        if (characterLower.some((c) => c.includes(expTok))) score += 5;
      }
    }

    if (score > 0) {
      scored.push({ asset, score });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.asset);
}

/**
 * Filter sound assets by active library category tab:
 * - "all"
 * - "phrases": melodic phrases (flute, veena, piano)
 * - "rhythms": rhythm loops & patterns (tabla, beats)
 * - "atmospheres": drones & textures (tanpura, pad)
 */
export function filterSoundAssetsByCategory(
  category: "all" | "phrases" | "rhythms" | "atmospheres",
  catalog: SoundAsset[] = SOUND_ASSETS
): SoundAsset[] {
  switch (category) {
    case "phrases":
      return catalog.filter(
        (a) => a.materialType === "phrase" || a.instrumentFamily === "woodwind" || a.instrumentFamily === "plucked_string" || a.instrumentFamily === "keyboard"
      );
    case "rhythms":
      return catalog.filter(
        (a) =>
          a.materialType === "pattern" ||
          a.materialType === "loop" ||
          a.instrumentFamily === "percussion_tuned" ||
          a.instrumentFamily === "percussion_untuned"
      );
    case "atmospheres":
      return catalog.filter(
        (a) => a.materialType === "drone" || a.materialType === "texture" || a.instrumentId === "poly"
      );
    default:
      return catalog;
  }
}
