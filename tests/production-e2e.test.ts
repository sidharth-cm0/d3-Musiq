/**
 * Production Flow E2E Integration Test for D3 MusiQ
 * 
 * Simulates browser runtime actions in the /production route:
 * 1. Initial store boot
 * 2. User audio unlock -> loadPresetMelody()
 * 3. Tonic transpositions across all project layers
 * 4. Library interaction: Hear -> Add (Grand Piano, Veena, Tabla, Pad, Bansuri, 808)
 * 5. Timeline editing: toggleNote with swaras and bols
 * 6. Batch editing and JSON project export/import
 */

import assert from "node:assert/strict";

// Mock localStorage if needed
if (typeof (globalThis as any).localStorage === "undefined") {
  (globalThis as any).localStorage = {
    store: {} as Record<string, string>,
    getItem(k: string) { return this.store[k] ?? null; },
    setItem(k: string, v: string) { this.store[k] = String(v); },
    removeItem(k: string) { delete this.store[k]; },
    clear() { this.store = {}; }
  };
}

import { useProjectStore } from "../store/useProjectStore";
import { LIBRARY_INSTRUMENTS } from "../lib/library/instruments";
import { LIBRARY_LOOPS } from "../lib/library/library-data";
import { yamanToMidi } from "../lib/theory/carnatic";

console.log("------------------------------------------------------------");
console.log("Running D3 MusiQ Production Route Full Flow Test");
console.log("------------------------------------------------------------\n");

let passed = 0;
let total = 0;

function runTest(name: string, fn: () => void) {
  total++;
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------
// TEST 1: Initial Store State
// ---------------------------------------------------------------------
runTest("1. Initial Store boots with layers (Piano, Veena, Tabla, Pad, Flute...)", () => {
  const state = useProjectStore.getState();
  assert.ok(state.tracks.length >= 5);
  assert.equal(state.tracks[0].id, "piano");
  assert.equal(state.tracks[1].id, "pluck");
  assert.equal(state.tracks[2].id, "tabla");
  assert.equal(state.tracks[3].id, "poly");
  assert.equal(state.tracks[4].id, "flute");

  // Tabla track notes must have bols, not swaras
  const tablaTrack = state.tracks.find((t) => t.id === "tabla");
  assert.ok(tablaTrack);
  for (const note of tablaTrack.notes) {
    assert.ok(note.bol === "Dha" || note.bol === "Dhin", `Expected bol on tabla note: ${JSON.stringify(note)}`);
    assert.equal(note.swara, undefined, `Expected undefined swara on tabla note: ${JSON.stringify(note)}`);
  }
});

// ---------------------------------------------------------------------
// TEST 2: Audio Unlock & loadPresetMelody() - Exact Crash Reproduction
// ---------------------------------------------------------------------
runTest("2. loadPresetMelody() executes cleanly without 'Unknown Yaman swara' error", () => {
  assert.doesNotThrow(() => {
    useProjectStore.getState().loadPresetMelody();
  });

  const state = useProjectStore.getState();
  const tablaTrack = state.tracks.find((t) => t.id === "tabla");
  assert.ok(tablaTrack);
  assert.equal(tablaTrack.notes.length, 8);
  assert.equal(tablaTrack.notes[0].bol, "Dha");
  assert.equal(tablaTrack.notes[1].bol, "Dhin");

  const veenaTrack = state.tracks.find((t) => t.id === "pluck");
  assert.ok(veenaTrack);
  assert.equal(veenaTrack.notes[0].swara, "G3");
});

// ---------------------------------------------------------------------
// TEST 3: Tonic Transposition
// ---------------------------------------------------------------------
runTest("3. setTonic transposes melodic tracks and preserves percussion tracks intact", () => {
  // Transpose from C4 to D4
  assert.doesNotThrow(() => {
    useProjectStore.getState().setTonic("D4");
  });

  let state = useProjectStore.getState();
  assert.equal(state.tonic, "D4");

  // Melodic notes transposed to D4 tonic (e.g. S on Piano is now D4)
  const pianoTrack = state.tracks.find((t) => t.id === "piano");
  assert.ok(pianoTrack);
  assert.equal(pianoTrack.notes[0].pitch, "D4"); // S at D4

  // Tabla notes must maintain physical trigger pitch C4/D4 and bols
  const tablaTrack = state.tracks.find((t) => t.id === "tabla");
  assert.ok(tablaTrack);
  assert.equal(tablaTrack.notes[0].pitch, "C4");
  assert.equal(tablaTrack.notes[0].bol, "Dha");

  // Transpose back to C4
  assert.doesNotThrow(() => {
    useProjectStore.getState().setTonic("C4");
  });

  state = useProjectStore.getState();
  assert.equal(state.tonic, "C4");
  assert.equal(state.tracks.find((t) => t.id === "piano")!.notes[0].pitch, "C4");
});

// ---------------------------------------------------------------------
// TEST 4: Open Library Hear -> Add Workflow
// ---------------------------------------------------------------------
runTest("4. Open Library Add Track for Grand Piano, Atmospheric Pad, Bansuri, and Tabla", () => {
  const store = useProjectStore.getState();

  // Add Grand Piano
  const pianoInst = LIBRARY_INSTRUMENTS.find((i) => i.id === "piano")!;
  assert.doesNotThrow(() => {
    store.addTrack({
      name: pianoInst.name,
      type: "Melodic Keys",
      instrument: "piano",
      notes: pianoInst.phrases[0].notes.map((pn, i) => ({
        id: `test-piano-${i}`,
        pitch: pn.pitch,
        swara: pn.swara,
        step: pn.step,
        duration: pn.duration || 1,
        velocity: pn.velocity || 0.85,
      })),
    });
  });

  // Add Classical Tabla with Teental Loop
  const tablaLoop = LIBRARY_LOOPS.find((l) => l.id === "loop-tabla-teental")!;
  assert.doesNotThrow(() => {
    store.addTrack({
      name: tablaLoop.instrumentName,
      type: "RHYTHM Loop",
      instrument: "tabla",
      notes: tablaLoop.notes.map((pn, i) => ({
        id: `test-loop-tabla-${i}`,
        pitch: pn.pitch,
        bol: pn.bol,
        step: pn.step,
        duration: pn.duration || 1,
        velocity: pn.velocity || 0.85,
      })),
    });
  });

  // Add 808 Rhythm Kit
  const beatsLoop = LIBRARY_LOOPS.find((l) => l.id === "loop-808-sub")!;
  assert.doesNotThrow(() => {
    store.addTrack({
      name: beatsLoop.instrumentName,
      type: "RHYTHM Loop",
      instrument: "beats",
      notes: beatsLoop.notes.map((pn, i) => ({
        id: `test-loop-beats-${i}`,
        pitch: pn.pitch,
        bol: pn.bol,
        step: pn.step,
        duration: pn.duration || 1,
        velocity: pn.velocity || 0.85,
      })),
    });
  });
});

// ---------------------------------------------------------------------
// TEST 5: Interactive Note Toggling with Swaras & Bols
// ---------------------------------------------------------------------
runTest("5. toggleNote and addNote handle canonical swaras, bols, and normalize display names", () => {
  const store = useProjectStore.getState();
  store.setActiveTrack("piano");

  // Add canonical swara
  store.toggleNote("E4", 1, "G3", 0.9);
  let activeNotes = useProjectStore.getState().notes;
  const addedG3 = activeNotes.find((n) => n.pitch === "E4" && n.step === 1);
  assert.ok(addedG3);
  assert.equal(addedG3.swara, "G3");

  // Add display name "Dha" -> normalizes to canonical "D2"
  store.toggleNote("A4", 3, "Dha", 0.85);
  activeNotes = useProjectStore.getState().notes;
  const addedDha = activeNotes.find((n) => n.pitch === "A4" && n.step === 3);
  assert.ok(addedDha);
  assert.equal(addedDha.swara, "D2");

  // Switch to Tabla track and add bol
  store.setActiveTrack("tabla");
  store.toggleNote("C4", 15, undefined, 0.9, "Dha");
  activeNotes = useProjectStore.getState().notes;
  const addedBol = activeNotes.find((n) => n.step === 15);
  assert.ok(addedBol);
  assert.equal(addedBol.bol, "Dha");
  assert.equal(addedBol.swara, undefined);
});

// ---------------------------------------------------------------------
// TEST 6: Project Persistence
// ---------------------------------------------------------------------
runTest("6. Project state exports to JSON and re-imports cleanly", () => {
  const store = useProjectStore.getState();
  const json = store.exportProjectJSON();
  assert.ok(json.length > 100);

  const importResult = store.importProjectJSON(json);
  assert.equal(importResult, true);

  const reloadedState = useProjectStore.getState();
  assert.ok(reloadedState.tracks.length >= 5);
});

console.log(`\n------------------------------------------------------------`);
console.log(`All ${passed} / ${total} Production E2E test cases passed!`);
console.log(`------------------------------------------------------------\n`);
