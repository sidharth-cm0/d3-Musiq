"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Volume2, Plus } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { audioEngine } from "@/lib/audio/engine";
import { yamanToMidi, midiToPitchName } from "@/lib/theory/carnatic";

export function ContextualSuggestion() {
  const tracks = useProjectStore((s) => s.tracks);
  const tonic = useProjectStore((s) => s.tonic);
  const currentScale = useProjectStore((s) => s.currentScale);
  const addTrack = useProjectStore((s) => s.addTrack);
  const addPhraseToTrack = useProjectStore((s) => s.addPhraseToTrack);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentSuggestion, setCurrentSuggestion] = useState<{
    id: string;
    title: string;
    text: string;
    preview: () => void;
    add: () => void;
  } | null>(null);

  useEffect(() => {
    const hasBansuri = tracks.some(
      (t) => t.instrument === "flute" && t.notes.length > 0 && !t.muted
    );
    const hasVeena = tracks.some(
      (t) => t.instrument === "pluck" && t.notes.length > 0 && !t.muted
    );
    const hasPad = tracks.some(
      (t) => t.instrument === "poly" && t.notes.length > 0 && !t.muted
    );
    const hasTabla = tracks.some(
      (t) => t.instrument === "tabla" && t.notes.length > 0 && !t.muted
    );
    const hasBeats = tracks.some(
      (t) => t.instrument === "beats" && t.notes.length > 0 && !t.muted
    );
    const hasVoice = tracks.some(
      (t) => t.isAudioTrack && t.audioBlobUrl && !t.muted
    );

    const activeMelodicNotes = tracks
      .filter((t) => !t.isAudioTrack && !t.muted && t.instrument !== "tabla" && t.instrument !== "beats")
      .flatMap((t) => t.notes);

    // Rule 1: Vocal take exists without drone pad
    if (hasVoice && !hasPad && !dismissedIds.has("suggest-vocal-pad")) {
      setCurrentSuggestion({
        id: "suggest-vocal-pad",
        title: "HARMONIC PAD FOR VOCALS",
        text: "An Atmospheric Pad drone anchors your vocal performance in pitch.",
        preview: () => {
          audioEngine.previewNote(tonic, "2n", 0.7, "poly");
        },
        add: () => {
          const padTrack = tracks.find((t) => t.instrument === "poly");
          const padNotes = [
            { step: 0, pitch: tonic, swara: "S", duration: 16, velocity: 0.65 },
          ];
          if (padTrack) {
            addPhraseToTrack(padTrack.id, padNotes);
          } else {
            addTrack({
              name: "Atmospheric Pad",
              type: "Harmonic Drone",
              instrument: "poly",
              notes: padNotes.map((pn, i) => ({
                id: `sug-pad-${i}-${Date.now()}`,
                pitch: pn.pitch,
                swara: pn.swara,
                step: pn.step,
                duration: pn.duration,
                velocity: pn.velocity,
              })),
            });
          }
          setDismissedIds((prev) => new Set([...prev, "suggest-vocal-pad"]));
        },
      });
      return;
    }

    // Rule 2: Active melody exists, but no rhythm (neither Tabla nor 808)
    if (activeMelodicNotes.length >= 3 && !hasTabla && !hasBeats && !dismissedIds.has("suggest-tabla")) {
      setCurrentSuggestion({
        id: "suggest-tabla",
        title: "GROUND WITH TABLA RHYTHM",
        text: "A 16-beat Classical Tabla cycle will ground this melody in time.",
        preview: () => {
          audioEngine.previewNote("C4", "4n", 0.9, "tabla");
        },
        add: () => {
          const tablaTrack = tracks.find((t) => t.instrument === "tabla");
          const theka = [
            { step: 0, pitch: "C4", bol: "Dha", duration: 1, velocity: 0.9 },
            { step: 4, pitch: "D4", bol: "Dhin", duration: 1, velocity: 0.8 },
            { step: 8, pitch: "C4", bol: "Dha", duration: 1, velocity: 0.9 },
            { step: 12, pitch: "D4", bol: "Dhin", duration: 1, velocity: 0.8 },
          ];
          if (tablaTrack) {
            addPhraseToTrack(tablaTrack.id, theka);
          } else {
            addTrack({
              name: "Classical Tabla",
              type: "Rhythm Bols",
              instrument: "tabla",
              notes: theka.map((pn, i) => ({
                id: `sug-tabla-${i}-${Date.now()}`,
                pitch: pn.pitch,
                bol: pn.bol,
                step: pn.step,
                duration: pn.duration,
                velocity: pn.velocity,
              })),
            });
          }
          setDismissedIds((prev) => new Set([...prev, "suggest-tabla"]));
        },
      });
      return;
    }

    // Rule 3: Veena or Pad present, but no Bansuri counterpoint
    if ((hasVeena || hasPad) && !hasBansuri && !dismissedIds.has("suggest-bansuri")) {
      setCurrentSuggestion({
        id: "suggest-bansuri",
        title: "TRY BANSURI FLUTE",
        text: "A breathy Bansuri motif provides an airy acoustic counter-melody.",
        preview: () => {
          audioEngine.previewNote("E4", "4n", 0.9, "flute");
        },
        add: () => {
          const bansuriTrack = tracks.find((t) => t.instrument === "flute");
          const phraseNotes = [
            { step: 4, pitch: "E4", swara: "G3", duration: 2, velocity: 0.8 },
            { step: 6, pitch: "F#4", swara: "M2", duration: 2, velocity: 0.85 },
            { step: 8, pitch: "G4", swara: "P", duration: 4, velocity: 0.9 },
          ];
          if (bansuriTrack) {
            addPhraseToTrack(bansuriTrack.id, phraseNotes);
          } else {
            addTrack({
              name: "Bansuri Flute",
              type: "Breathy Woodwind",
              instrument: "flute",
              notes: phraseNotes.map((pn, i) => ({
                id: `sug-bansuri-${i}-${Date.now()}`,
                pitch: pn.pitch,
                swara: pn.swara,
                step: pn.step,
                duration: pn.duration,
                velocity: pn.velocity,
              })),
            });
          }
          setDismissedIds((prev) => new Set([...prev, "suggest-bansuri"]));
        },
      });
      return;
    }

    // Rule 4: Yaman scale active, melody has notes, but missing characteristic Teevra Ma (M2)
    const allNotes = tracks.flatMap((t) => t.notes);
    const hasM2 = allNotes.some((n) => n.swara === "M2");
    if (currentScale === "yaman" && !hasM2 && allNotes.length >= 2 && !dismissedIds.has("suggest-m2")) {
      setCurrentSuggestion({
        id: "suggest-m2",
        title: "TRY TEEVRA MA (M2 / ♯4)",
        text: "Raag Yaman's essential color comes from Teevra Ma (M2 / ♯4).",
        preview: () => {
          const midi = yamanToMidi(tonic, "M2");
          audioEngine.previewNote(midiToPitchName(midi), "4n", 0.9, "pluck");
        },
        add: () => {
          const veenaTrack = tracks.find((t) => t.instrument === "pluck") || tracks[0];
          const midi = yamanToMidi(tonic, "M2");
          addPhraseToTrack(veenaTrack.id, [
            { step: 6, pitch: midiToPitchName(midi), swara: "M2", duration: 2, velocity: 0.9 },
          ]);
          setDismissedIds((prev) => new Set([...prev, "suggest-m2"]));
        },
      });
      return;
    }

    // Otherwise no suggestion
    setCurrentSuggestion(null);
  }, [tracks, tonic, currentScale, dismissedIds, addTrack, addPhraseToTrack]);

  if (!currentSuggestion) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full mx-4 sm:mx-0 p-3.5 rounded-xl bg-d3-neutral-900 border border-d3-amber/40 shadow-2xl shadow-black/80 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-d3-amber">
          <Sparkles className="w-3.5 h-3.5 text-d3-amber" />
          <span>✦ {currentSuggestion.title}</span>
        </div>
        <p className="text-xs text-d3-paper/90 leading-relaxed">
          {currentSuggestion.text}
        </p>

        {/* Tactile Actions: HEAR IT, ADD, IGNORE */}
        <div className="flex items-center gap-2 pt-1.5">
          <button
            onClick={currentSuggestion.preview}
            title="Hear suggested material (Audition only)"
            className="flex items-center gap-1 text-[11px] font-mono font-medium text-d3-neutral-300 hover:text-d3-amber px-2.5 py-1 rounded bg-d3-neutral-800 hover:bg-d3-neutral-750 border border-d3-neutral-700 transition-colors"
          >
            <Volume2 className="w-3 h-3 text-d3-amber" />
            <span>HEAR IT</span>
          </button>

          <button
            onClick={currentSuggestion.add}
            className="text-[11px] font-mono font-semibold text-d3-ink bg-d3-amber hover:bg-d3-paper px-3 py-1 rounded transition-colors shadow-sm"
          >
            ADD
          </button>

          <button
            onClick={() => {
              if (currentSuggestion) {
                setDismissedIds((prev) => new Set([...prev, currentSuggestion.id]));
              }
            }}
            className="text-[11px] font-mono text-d3-neutral-500 hover:text-d3-neutral-300 px-2 py-1 transition-colors"
          >
            IGNORE
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          if (currentSuggestion) {
            setDismissedIds((prev) => new Set([...prev, currentSuggestion.id]));
          }
        }}
        title="Dismiss"
        className="p-1 rounded text-d3-neutral-500 hover:text-d3-paper hover:bg-d3-neutral-800 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
