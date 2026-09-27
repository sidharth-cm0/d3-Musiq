"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { audioEngine, ScheduledNote } from "@/lib/audio/engine";
import {
  YAMAN_SWARA_ORDER,
  yamanToMidi,
  midiToPitchName,
  SWARA_DETAILS,
  type CanonicalYamanSwara,
} from "@/lib/theory/carnatic";
import { LIBRARY_INSTRUMENTS } from "@/lib/library/instruments";
import {
  Volume2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sliders,
  X,
} from "lucide-react";

export function PianoRoll() {
  const currentScale = useProjectStore((s) => s.currentScale);
  const tonic = useProjectStore((s) => s.tonic);
  const instrument = useProjectStore((s) => s.instrument);
  const notes = useProjectStore((s) => s.notes);
  const toggleNote = useProjectStore((s) => s.toggleNote);
  const currentStep = useProjectStore((s) => s.currentStep);
  const setCurrentStep = useProjectStore((s) => s.setCurrentStep);
  const isPlaying = useProjectStore((s) => s.isPlaying);

  // Multi-selection & Batch Edit
  const selectedNoteIds = useProjectStore((s) => s.selectedNoteIds);
  const selectNote = useProjectStore((s) => s.selectNote);
  const selectAllNotes = useProjectStore((s) => s.selectAllNotes);
  const deselectAllNotes = useProjectStore((s) => s.deselectAllNotes);
  const deleteSelectedNotes = useProjectStore((s) => s.deleteSelectedNotes);
  const moveSelectedNotes = useProjectStore((s) => s.moveSelectedNotes);
  const setSelectedNotesVelocity = useProjectStore((s) => s.setSelectedNotesVelocity);

  const [soundingNoteIds, setSoundingNoteIds] = useState<string[]>([]);
  const [batchVelocity, setBatchVelocity] = useState<number>(0.85);

  const activeInstrumentData = LIBRARY_INSTRUMENTS.find((i) => i.id === instrument);
  const isPercussion = activeInstrumentData?.engineType === "percussion";

  useEffect(() => {
    audioEngine.onStep((step, activeNotes: ScheduledNote[]) => {
      setCurrentStep(step);
      if (activeNotes.length > 0) {
        setSoundingNoteIds(activeNotes.map((n) => n.id || `${n.pitch}-${n.step}`));
      } else {
        setSoundingNoteIds([]);
      }
    });

    return () => {
      audioEngine.onStep(null);
    };
  }, [setCurrentStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (selectedNoteIds.length > 0) {
        if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          deleteSelectedNotes();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          moveSelectedNotes(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          moveSelectedNotes(1);
        } else if (e.key === "Escape") {
          e.preventDefault();
          deselectAllNotes();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAllNotes();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNoteIds, deleteSelectedNotes, moveSelectedNotes, deselectAllNotes, selectAllNotes]);

  // Build grid rows descending from high pitch to low pitch
  const rows = useMemo(() => {
    if (isPercussion && activeInstrumentData?.percussionPads) {
      const pads = [...activeInstrumentData.percussionPads].reverse();
      return pads.map((pad, idx) => ({
        id: pad.id,
        pitch: pad.pitchMapping,
        swara: undefined as CanonicalYamanSwara | undefined,
        bol: pad.name,
        degree: `${pads.length - idx}`,
        label: pad.pitchMapping,
        carnaticName: pad.strokeName,
        intervalName: pad.description,
        isRoot: idx === pads.length - 1,
        isTeevraMa: false,
      }));
    }

    if (currentScale === "yaman") {
      const reversedSwaras = [...YAMAN_SWARA_ORDER].reverse();
      return reversedSwaras.map((swara) => {
        const midi = yamanToMidi(tonic, swara);
        const pitch = midiToPitchName(midi);
        const details = SWARA_DETAILS[swara];

        let degree = "1";
        if (swara === "S'") degree = "8";
        else if (swara === "N3") degree = "7";
        else if (swara === "D2") degree = "6";
        else if (swara === "P") degree = "5";
        else if (swara === "M2") degree = "♯4";
        else if (swara === "G3") degree = "3";
        else if (swara === "R2") degree = "2";

        return {
          id: `${swara}-${pitch}`,
          pitch,
          swara,
          degree,
          label: pitch,
          carnaticName: details?.carnaticName || swara,
          intervalName: details?.intervalName || "",
          isRoot: swara === "S" || swara === "S'",
          isTeevraMa: swara === "M2",
        };
      });
    } else {
      const pitches = [
        "C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4"
      ];
      return pitches.map((pitch) => ({
        id: pitch,
        pitch,
        swara: undefined,
        degree: "",
        label: pitch,
        carnaticName: "",
        intervalName: "",
        isRoot: pitch.startsWith("C"),
        isTeevraMa: pitch.includes("F#"),
      }));
    }
  }, [currentScale, tonic, isPercussion, activeInstrumentData]);

  const handleCellClick = (
    e: React.MouseEvent,
    pitch: string,
    step: number,
    existingNoteId?: string,
    swara?: CanonicalYamanSwara,
    bol?: string
  ) => {
    e.stopPropagation();

    if (existingNoteId) {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        selectNote(existingNoteId, true);
      } else if (selectedNoteIds.length > 0 && selectedNoteIds.includes(existingNoteId)) {
        selectNote(existingNoteId, true);
      } else {
        toggleNote(pitch, step, swara, undefined, bol);
      }
    } else {
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        deselectAllNotes();
      }
      toggleNote(pitch, step, swara, batchVelocity, bol);
    }
  };

  const handleDrop = (e: React.DragEvent, targetPitch: string, step: number) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const data = JSON.parse(raw);
      const pitch = targetPitch || data.pitch;
      const swara = data.swara;
      const bol = data.bol;
      toggleNote(pitch, step, swara, batchVelocity, bol);
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  const handleAuditionRow = (pitch: string) => {
    audioEngine.previewNote(pitch, "4n", 0.9, instrument as any);
  };

  const handleVelocitySlider = (val: number) => {
    setBatchVelocity(val);
    setSelectedNotesVelocity(val);
  };

  return (
    <div
      onClick={() => deselectAllNotes()}
      className="flex-1 flex flex-col h-full bg-d3-ink overflow-hidden select-none relative"
    >
      {/* Batch Action Toolbar */}
      {selectedNoteIds.length > 0 ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-10 left-1/2 -translate-x-1/2 z-30 bg-d3-neutral-900 border border-d3-amber/50 shadow-2xl rounded-xl px-4 py-2 flex items-center gap-4 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2 border-r border-d3-neutral-700 pr-3">
            <span className="w-2 h-2 rounded-full bg-d3-amber animate-pulse" />
            <span className="text-xs font-mono font-bold text-d3-amber">
              {selectedNoteIds.length} {selectedNoteIds.length === 1 ? "NOTE" : "NOTES"} SELECTED
            </span>
          </div>

          <div className="flex items-center gap-1 border-r border-d3-neutral-700 pr-3">
            <span className="text-[10px] uppercase font-mono text-d3-neutral-500">Shift:</span>
            <button
              onClick={() => moveSelectedNotes(-1)}
              title="Move earlier (ArrowLeft)"
              className="p-1 rounded bg-d3-neutral-800 hover:bg-d3-neutral-700 text-d3-neutral-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveSelectedNotes(1)}
              title="Move later (ArrowRight)"
              className="p-1 rounded bg-d3-neutral-800 hover:bg-d3-neutral-700 text-d3-neutral-300 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-r border-d3-neutral-700 pr-3">
            <Sliders className="w-3.5 h-3.5 text-d3-neutral-500" />
            <span className="text-[10px] uppercase font-mono text-d3-neutral-500">Vel:</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={batchVelocity}
              onChange={(e) => handleVelocitySlider(Number(e.target.value))}
              className="w-14 h-1 bg-d3-neutral-700 rounded appearance-none cursor-pointer accent-d3-amber"
            />
            <span className="text-[11px] font-mono text-d3-amber font-bold w-7">
              {Math.round(batchVelocity * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={deleteSelectedNotes}
              title="Delete selected (Backspace / Del)"
              className="p-1.5 rounded-lg bg-d3-rust/20 hover:bg-d3-rust/30 text-red-300 border border-d3-rust/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deselectAllNotes}
              title="Deselect all (Esc)"
              className="p-1.5 rounded-lg hover:bg-d3-neutral-800 text-d3-neutral-500 hover:text-d3-paper transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Top Ruler / Bar & Beat display */}
      <div className="flex items-center border-b border-d3-neutral-700 bg-d3-neutral-900/90 sticky top-0 z-20">
        <div className="w-52 flex-shrink-0 px-3.5 py-2 border-r border-d3-neutral-700 text-xs font-mono text-d3-neutral-400 flex items-center justify-between">
          <span>{isPercussion ? "PAD / BOL" : "SWARA · DEG · NOTE"}</span>
          <span className="text-[10px] text-d3-neutral-500">16TH</span>
        </div>

        <div className="flex-1 grid grid-cols-16">
          {Array.from({ length: 16 }, (_, step) => {
            const beat = Math.floor(step / 4) + 1;
            const sub = (step % 4) + 1;
            const isCurrent = isPlaying && currentStep === step;
            const isBeatStart = step % 4 === 0;

            return (
              <div
                key={step}
                className={`py-1.5 text-center text-[10px] font-mono transition-all border-r ${
                  isBeatStart ? "border-r-d3-neutral-700 bg-d3-neutral-950/40" : "border-r-d3-neutral-800/40"
                } ${
                  isCurrent
                    ? "bg-d3-amber/20 text-d3-amber font-bold border-b-2 border-b-d3-amber"
                    : "text-d3-neutral-500 hover:text-d3-neutral-300"
                }`}
              >
                <span>{`${beat}.${sub}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Rows */}
      <div className="flex-1 overflow-y-auto">
        {rows.map((row) => {
          return (
            <div
              key={row.id}
              className={`flex items-stretch border-b border-d3-neutral-800/60 hover:bg-d3-neutral-900/40 transition-colors group ${
                row.isRoot ? "bg-d3-amber/5" : row.isTeevraMa ? "bg-d3-cyan-muted/5" : ""
              }`}
            >
              {/* Row Header Label */}
              <div
                onClick={() => handleAuditionRow(row.pitch)}
                className={`w-52 flex-shrink-0 px-3 py-2 border-r border-d3-neutral-700 flex items-center justify-between cursor-pointer transition-colors ${
                  row.isRoot
                    ? "text-d3-amber font-semibold bg-d3-amber/5 hover:bg-d3-amber/10"
                    : row.isTeevraMa
                    ? "text-d3-cyan-muted font-semibold bg-d3-cyan-muted/5 hover:bg-d3-cyan-muted/10"
                    : "text-d3-neutral-300 hover:bg-d3-neutral-850"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {(row.swara || (row as any).bol) ? (
                    <div className="w-7 h-7 rounded bg-d3-neutral-950 border border-d3-neutral-700 flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                      <span className="text-xs font-bold font-mono text-d3-amber leading-none">
                        {row.swara || (row as any).bol}
                      </span>
                      {row.degree ? (
                        <span className="text-[8px] font-mono text-d3-neutral-500 leading-none mt-0.5">
                          {row.degree}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-d3-paper">{row.pitch}</span>
                      {row.degree && !isPercussion ? (
                        <span className="text-[10px] text-d3-amber/80 font-mono">
                          [{row.degree}]
                        </span>
                      ) : null}
                    </div>
                    {row.carnaticName ? (
                      <span className="text-[10px] text-d3-neutral-500 block truncate leading-tight">
                        {row.carnaticName}
                      </span>
                    ) : null}
                  </div>
                </div>

                <Volume2 className="w-3.5 h-3.5 text-d3-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* 16 Step Cells */}
              <div className="flex-1 grid grid-cols-16 relative">
                {Array.from({ length: 16 }, (_, step) => {
                  const activeNote = notes.find(
                    (n) => n.pitch === row.pitch && n.step === step
                  );
                  const isCurrent = isPlaying && currentStep === step;
                  const isBeatStart = step % 4 === 0;
                  const isSelected = activeNote ? selectedNoteIds.includes(activeNote.id) : false;
                  const isSounding = activeNote ? soundingNoteIds.includes(activeNote.id) : false;

                  return (
                    <div
                      key={step}
                      onClick={(e) =>
                        handleCellClick(
                          e,
                          row.pitch,
                          step,
                          activeNote?.id,
                          row.swara,
                          (row as any).bol
                        )
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, row.pitch, step)}
                      className={`relative min-h-[38px] border-r transition-all cursor-pointer flex items-center justify-center p-0.5 ${
                        isBeatStart ? "border-r-d3-neutral-700/80" : "border-r-d3-neutral-800/40"
                      } ${isCurrent ? "bg-d3-amber/10" : ""} hover:bg-d3-neutral-850`}
                    >
                      {activeNote ? (
                        <div
                          style={{
                            opacity: 0.45 + (activeNote.velocity || 0.85) * 0.55,
                          }}
                          className={`w-full h-full rounded shadow flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all relative ${
                            isSelected
                              ? "ring-2 ring-d3-amber ring-offset-1 ring-offset-d3-ink scale-[0.98]"
                              : ""
                          } ${
                            isSounding
                              ? "scale-105 brightness-125 ring-2 ring-white shadow-lg animate-pulse"
                              : ""
                          } ${
                            isPercussion
                              ? "bg-d3-rust text-d3-paper border border-red-400/50"
                              : row.isTeevraMa
                              ? "bg-d3-cyan-muted text-d3-ink border border-cyan-300"
                              : row.isRoot
                              ? "bg-d3-amber text-d3-ink border border-amber-300"
                              : "bg-d3-neutral-700 text-d3-paper border border-d3-neutral-600"
                          }`}
                        >
                          <span className="leading-tight">
                            {activeNote.bol || activeNote.swara || activeNote.pitch}
                          </span>

                          <div className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-black/40 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${(activeNote.velocity || 0.85) * 100}%` }}
                              className="h-full bg-white/90"
                            />
                          </div>
                        </div>
                      ) : isBeatStart ? (
                        <div className="w-1 h-1 rounded-full bg-d3-neutral-700/70 pointer-events-none" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Piano Roll Footer info */}
      <footer className="px-4 py-2 bg-d3-neutral-900 border-t border-d3-neutral-700 flex items-center justify-between text-xs text-d3-neutral-400 font-mono">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-d3-amber inline-block" />
            <span>Sa Root (S / 1)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-d3-cyan-muted inline-block" />
            <span>Teevra Ma (M2 / ♯4)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-d3-neutral-700 inline-block" />
            <span>Scale Degree</span>
          </span>
        </div>

        <div className="text-[10px] text-d3-neutral-500">
          Shift+Click to multi-select · Backspace to delete · Arrow keys to shift
        </div>
      </footer>
    </div>
  );
}
