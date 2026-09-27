/**
 * SoundAsset Schema, Search & Compatibility Engine Tests
 */

import { SOUND_ASSETS, getSoundAssetById } from "../lib/library/assets-catalog";
import { SoundAssetSchema } from "../lib/library/types";
import { searchSoundAssets, filterSoundAssetsByCategory } from "../lib/library/search";
import { getCompatibleSuggestions } from "../lib/library/compatibility";
import type { ProjectTrack } from "../store/useProjectStore";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
}

console.log("=== Testing SoundAsset Schema Validation ===");

assert(SOUND_ASSETS.length >= 10, `Expected at least 10 sound assets, found ${SOUND_ASSETS.length}`);

for (const asset of SOUND_ASSETS) {
  try {
    SoundAssetSchema.parse(asset);
    console.log(`  ✓ Validated schema for: ${asset.name} (${asset.id})`);
  } catch (err) {
    console.error(`❌ Validation failed for asset: ${asset.name}`, err);
    process.exit(1);
  }
}

console.log("\n=== Testing Plain-Language Semantic Search ===");

// 1. Search "peaceful flute"
const fluteResults = searchSoundAssets("peaceful flute");
assert(fluteResults.length > 0, "Expected results for 'peaceful flute'");
assert(
  fluteResults[0].id === "asset-bansuri-peaceful-morning",
  `Expected top result to be 'Peaceful Morning Bansuri', got '${fluteResults[0].name}'`
);
console.log(`  ✓ Search 'peaceful flute' -> Top match: ${fluteResults[0].name}`);

// 2. Search "slow tabla"
const tablaResults = searchSoundAssets("slow tabla");
assert(tablaResults.length > 0, "Expected results for 'slow tabla'");
assert(
  tablaResults[0].instrumentId === "tabla",
  `Expected top result to be a Tabla asset, got '${tablaResults[0].name}'`
);
console.log(`  ✓ Search 'slow tabla' -> Top match: ${tablaResults[0].name}`);

// 3. Search "drone"
const droneResults = searchSoundAssets("drone");
assert(droneResults.length > 0, "Expected results for 'drone'");
assert(
  droneResults[0].materialType === "drone" || droneResults[0].instrumentFamily === "synthetic",
  `Expected top result to be drone/atmosphere, got '${droneResults[0].name}'`
);
console.log(`  ✓ Search 'drone' -> Top match: ${droneResults[0].name}`);

// 4. Search "veena"
const veenaResults = searchSoundAssets("veena");
assert(veenaResults.length > 0, "Expected results for 'veena'");
assert(
  veenaResults[0].instrumentId === "pluck",
  `Expected top result to be Veena, got '${veenaResults[0].name}'`
);
console.log(`  ✓ Search 'veena' -> Top match: ${veenaResults[0].name}`);

console.log("\n=== Testing Category Filtering ===");
const phrases = filterSoundAssetsByCategory("phrases");
assert(phrases.length >= 4, "Expected at least 4 melodic phrases");
const rhythms = filterSoundAssetsByCategory("rhythms");
assert(rhythms.length >= 3, "Expected at least 3 rhythm patterns");
const atmospheres = filterSoundAssetsByCategory("atmospheres");
assert(atmospheres.length >= 3, "Expected at least 3 atmospheres/drones");
console.log(`  ✓ Filtered: ${phrases.length} phrases, ${rhythms.length} rhythms, ${atmospheres.length} atmospheres`);

console.log("\n=== Testing Metadata Compatibility Engine ===");

// Scenario A: User has only a Bansuri melody track
const melodyOnlyTracks: ProjectTrack[] = [
  {
    id: "track-1",
    name: "Bansuri Flute",
    type: "Melody",
    instrument: "flute",
    volume: 0.8,
    muted: false,
    solo: false,
    notes: [
      { id: "n1", pitch: "E4", swara: "G3", step: 4, duration: 2, velocity: 0.8 },
      { id: "n2", pitch: "F#4", swara: "M2", step: 6, duration: 2, velocity: 0.85 },
      { id: "n3", pitch: "G4", swara: "P", step: 8, duration: 4, velocity: 0.9 },
    ],
  },
];

const sugA = getCompatibleSuggestions(melodyOnlyTracks);
assert(sugA.length > 0, "Expected suggestions for melody-only tracks");
assert(
  sugA[0].asset.instrumentId === "tabla",
  `Expected first suggestion to ground with Tabla, got ${sugA[0].asset.name}`
);
console.log(`  ✓ Melody-only suggests: ${sugA[0].title} (${sugA[0].asset.name})`);

// Scenario B: User adds Tabla rhythm, now has Melody + Rhythm -> should suggest Atmosphere
const melodyAndRhythmTracks: ProjectTrack[] = [
  ...melodyOnlyTracks,
  {
    id: "track-2",
    name: "Classical Tabla",
    type: "Rhythm",
    instrument: "tabla",
    volume: 0.8,
    muted: false,
    solo: false,
    notes: [
      { id: "t1", pitch: "C4", bol: "Dha", step: 0, duration: 1, velocity: 0.9 },
      { id: "t2", pitch: "D4", bol: "Dhin", step: 4, duration: 1, velocity: 0.8 },
    ],
  },
];

const sugB = getCompatibleSuggestions(melodyAndRhythmTracks);
assert(sugB.length > 0, "Expected suggestions for melody + rhythm");
assert(
  sugB[0].asset.instrumentId === "poly",
  `Expected atmosphere suggestion, got ${sugB[0].asset.name}`
);
console.log(`  ✓ Melody + Rhythm suggests: ${sugB[0].title} (${sugB[0].asset.name})`);

console.log("\n✅ ALL SOUND ASSET, SEARCH & COMPATIBILITY TESTS PASSED!\n");
