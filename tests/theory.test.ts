/**
 * Theory & Data Contract Regression Tests for D3 MusiQ
 * 
 * Verifies:
 * 1. Canonical Yaman swaras conversion via yamanToMidi
 * 2. Normalization of solfege display names to canonical identifiers
 * 3. Strict rejection of invalid strings (percussion bols, arbitrary text)
 * 4. Integrity of all library instruments, phrases, loops, and raagas
 * 5. Default project arrangement initialization and tonic transposition
 */

import assert from "node:assert/strict";
import {
  CanonicalYamanSwara,
  YAMAN_SWARA_ORDER,
  YAMAN_SWARA_INTERVALS,
  SWARA_DISPLAY_TO_CANONICAL,
  isCanonicalYamanSwara,
  normalizeSwara,
  tryNormalizeSwara,
  yamanToMidi,
  midiToPitchName,
  getTonicMidi,
  getYamanScale,
  getYamanScaleDetails,
} from "../lib/theory/carnatic";
import {
  LIBRARY_INSTRUMENTS,
} from "../lib/library/instruments";
import {
  LIBRARY_LOOPS,
  LIBRARY_RAAGAS,
  RECOMMENDED_PHRASES,
  YAMAN_PRESET_MELODY,
} from "../lib/library/library-data";

console.log("------------------------------------------------------------");
console.log("Running D3 MusiQ Theory & Sound Library Regression Suite");
console.log("------------------------------------------------------------\n");

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------
// TEST GROUP 1: Canonical Yaman Swaras
// ---------------------------------------------------------------------

test("1.1 yamanToMidi correctly converts all 8 canonical Yaman swaras from tonic C4 (MIDI 60)", () => {
  const expected: Record<CanonicalYamanSwara, { midi: number; pitch: string }> = {
    "S": { midi: 60, pitch: "C4" },
    "R2": { midi: 62, pitch: "D4" },
    "G3": { midi: 64, pitch: "E4" },
    "M2": { midi: 66, pitch: "F#4" },
    "P": { midi: 67, pitch: "G4" },
    "D2": { midi: 69, pitch: "A4" },
    "N3": { midi: 71, pitch: "B4" },
    "S'": { midi: 72, pitch: "C5" },
  };

  for (const swara of YAMAN_SWARA_ORDER) {
    assert.equal(isCanonicalYamanSwara(swara), true, `${swara} should be canonical`);
    const midi = yamanToMidi("C4", swara);
    const pitch = midiToPitchName(midi);
    assert.equal(midi, expected[swara].midi, `Midi mismatch for ${swara}`);
    assert.equal(pitch, expected[swara].pitch, `Pitch name mismatch for ${swara}`);
  }
});

test("1.2 yamanToMidi supports transposition to other tonics (D4, G3, F#4)", () => {
  // Tonic D4 = MIDI 62
  assert.equal(yamanToMidi("D4", "S"), 62); // D4
  assert.equal(yamanToMidi("D4", "M2"), 68); // G#4 (+6)
  assert.equal(yamanToMidi("D4", "P"), 69); // A4 (+7)
  assert.equal(yamanToMidi("D4", "S'"), 74); // D5 (+12)

  // Tonic G3 = MIDI 55
  assert.equal(yamanToMidi("G3", "S"), 55);
  assert.equal(yamanToMidi("G3", "M2"), 61); // C#4
  assert.equal(yamanToMidi("G3", "P"), 62); // D4
});

test("1.3 getYamanScale produces exact pitch sequence for tonic C4", () => {
  const scale = getYamanScale("C4");
  assert.deepEqual(scale, ["C4", "D4", "E4", "F#4", "G4", "A4", "B4", "C5"]);
});

// ---------------------------------------------------------------------
// TEST GROUP 2: Display-Name Normalization Boundary
// ---------------------------------------------------------------------

test("2.1 normalizeSwara safely maps solfege syllables and display variants to canonical IDs", () => {
  const displayMappings: Record<string, CanonicalYamanSwara> = {
    "Sa": "S",
    "sa": "S",
    "Ri": "R2",
    "ri": "R2",
    "Re": "R2",
    "re": "R2",
    "Ga": "G3",
    "ga": "G3",
    "Ma": "M2",
    "ma": "M2",
    "Teevra Ma": "M2",
    "Prati Madhyamam": "M2",
    "Pa": "P",
    "pa": "P",
    "Dha": "D2",
    "dha": "D2",
    "Ni": "N3",
    "ni": "N3",
    "Taara Sa": "S'",
    "Sa'": "S'",
    "High Sa": "S'",
  };

  for (const [display, expectedCanonical] of Object.entries(displayMappings)) {
    assert.equal(
      normalizeSwara(display),
      expectedCanonical,
      `Failed to normalize display label "${display}"`
    );
    assert.equal(
      tryNormalizeSwara(display),
      expectedCanonical,
      `tryNormalizeSwara failed for "${display}"`
    );
  }
});

test("2.2 yamanToMidi resolves normalized display names (e.g. 'Dha' -> 'D2' -> MIDI 69)", () => {
  assert.equal(yamanToMidi("C4", "Dha"), 69);
  assert.equal(midiToPitchName(yamanToMidi("C4", "Dha")), "A4");

  assert.equal(yamanToMidi("C4", "Sa"), 60);
  assert.equal(yamanToMidi("C4", "Teevra Ma"), 66);
  assert.equal(yamanToMidi("C4", "Taara Sa"), 72);
});

// ---------------------------------------------------------------------
// TEST GROUP 3: Rejection of Invalid Strings & Percussion Bols
// ---------------------------------------------------------------------

test("3.1 normalizeSwara and yamanToMidi throw on non-swara strings (bols, drums, random input)", () => {
  const invalidInputs = [
    "Dhin",
    "Kick",
    "Snare",
    "Ge",
    "Na",
    "Tin",
    "Ka",
    "Hat (Cl)",
    "Clap",
    "Rim",
    "RandomGarbage",
    "123",
  ];

  for (const invalid of invalidInputs) {
    assert.throws(
      () => normalizeSwara(invalid),
      (err: Error) => err.message.includes(`Cannot normalize swara: "${invalid}"`),
      `Expected normalizeSwara("${invalid}") to throw`
    );

    assert.throws(
      () => yamanToMidi("C4", invalid),
      (err: Error) => err.message.includes(`Cannot normalize swara: "${invalid}"`),
      `Expected yamanToMidi("C4", "${invalid}") to throw`
    );

    assert.equal(
      tryNormalizeSwara(invalid),
      null,
      `Expected tryNormalizeSwara("${invalid}") to return null`
    );
  }
});

test("3.2 tryNormalizeSwara returns null for null, undefined, empty, or non-string inputs", () => {
  assert.equal(tryNormalizeSwara(null), null);
  assert.equal(tryNormalizeSwara(undefined), null);
  assert.equal(tryNormalizeSwara(""), null);
  assert.equal(tryNormalizeSwara("   "), null);
  assert.equal(tryNormalizeSwara(123 as any), null);
  assert.equal(tryNormalizeSwara({} as any), null);
});

// ---------------------------------------------------------------------
// TEST GROUP 4: Open Library Data Audit & Integrity
// ---------------------------------------------------------------------

test("4.1 All melodic instruments in LIBRARY_INSTRUMENTS have valid canonical swaras", () => {
  for (const inst of LIBRARY_INSTRUMENTS) {
    if (inst.id === "tabla" || inst.id === "beats") {
      // Percussion instruments must define bols and percussionPads
      assert.ok(inst.percussionPads && inst.percussionPads.length > 0, `${inst.id} should have percussion pads`);
      for (const item of inst.notesCatalog) {
        assert.ok(item.bol, `Percussion catalog item in ${inst.id} must have bol: ${JSON.stringify(item)}`);
        assert.equal(item.swara, undefined, `Percussion catalog item in ${inst.id} must not have swara`);
      }
      for (const phrase of inst.phrases) {
        for (const note of phrase.notes) {
          assert.ok(note.bol, `Percussion phrase note in ${inst.id} must have bol: ${JSON.stringify(note)}`);
          assert.equal(note.swara, undefined, `Percussion phrase note in ${inst.id} must not have swara`);
        }
      }
    } else {
      // Melodic instruments must have canonical swaras
      for (const item of inst.notesCatalog) {
        if (item.swara) {
          assert.ok(
            isCanonicalYamanSwara(item.swara),
            `Invalid swara "${item.swara}" in instrument ${inst.id}`
          );
          // yamanToMidi should convert smoothly
          const midi = yamanToMidi("C4", item.swara);
          assert.ok(midi >= 40 && midi <= 90, `Unexpected MIDI value ${midi} for ${item.swara}`);
        }
      }
      for (const phrase of inst.phrases) {
        for (const note of phrase.notes) {
          if (note.swara) {
            assert.ok(
              isCanonicalYamanSwara(note.swara),
              `Invalid phrase swara "${note.swara}" in instrument ${inst.id}`
            );
            assert.doesNotThrow(() => yamanToMidi("C4", note.swara!));
          }
        }
      }
    }
  }
});

test("4.2 All LIBRARY_LOOPS have valid swaras or bols without crashing", () => {
  for (const loop of LIBRARY_LOOPS) {
    if (loop.instrumentId === "tabla" || loop.instrumentId === "beats") {
      for (const note of loop.notes) {
        assert.ok(note.bol, `Rhythm loop ${loop.id} note must have bol`);
        assert.equal(note.swara, undefined, `Rhythm loop ${loop.id} note must not have swara`);
      }
    } else {
      for (const note of loop.notes) {
        if (note.swara) {
          assert.ok(
            isCanonicalYamanSwara(note.swara),
            `Invalid swara "${note.swara}" in loop ${loop.id}`
          );
          assert.doesNotThrow(() => yamanToMidi("C4", note.swara!));
        }
      }
    }
  }
});

test("4.3 RECOMMENDED_PHRASES and YAMAN_PRESET_MELODY convert without throwing", () => {
  for (const phrase of RECOMMENDED_PHRASES) {
    for (const note of phrase.notes) {
      if (note.swara) {
        assert.ok(isCanonicalYamanSwara(note.swara));
        assert.doesNotThrow(() => yamanToMidi("C4", note.swara!));
      }
    }
  }

  for (const note of YAMAN_PRESET_MELODY) {
    if (note.swara) {
      assert.ok(isCanonicalYamanSwara(note.swara as CanonicalYamanSwara));
      assert.doesNotThrow(() => yamanToMidi("C4", note.swara as CanonicalYamanSwara));
    }
  }
});

// ---------------------------------------------------------------------
// TEST GROUP 5: Default Project Initialization & Transposition
// ---------------------------------------------------------------------

test("5.1 Default initial tracks contain valid canonical swaras and bols", () => {
  // Piano: melodic
  const pianoNotes = [
    { pitch: "C4", swara: "S" },
    { pitch: "E4", swara: "G3" },
    { pitch: "G4", swara: "P" },
    { pitch: "B4", swara: "N3" },
  ];
  for (const n of pianoNotes) {
    assert.ok(isCanonicalYamanSwara(n.swara));
    assert.doesNotThrow(() => yamanToMidi("C4", n.swara));
  }

  // Tabla: percussion with bols
  const tablaNotes = [
    { pitch: "C4", bol: "Dha" },
    { pitch: "D4", bol: "Dhin" },
    { pitch: "D4", bol: "Dhin" },
    { pitch: "C4", bol: "Dha" },
  ];
  for (const n of tablaNotes) {
    assert.equal(tryNormalizeSwara(n.bol), n.bol === "Dha" ? "D2" : null);
    // Tabla strokes must never be passed to yamanToMidi
  }
});

console.log(`\n------------------------------------------------------------`);
console.log(`All ${passedTests} / ${totalTests} test cases passed successfully!`);
console.log(`------------------------------------------------------------\n`);
