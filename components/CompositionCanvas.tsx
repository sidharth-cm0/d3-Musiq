"use client";

import React, { useState, useEffect } from "react";
import {
  Music,
  Sliders,
  Mic,
  Disc,
  Zap,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Radio,
  Wind,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import { useProjectStore, ProjectTrack } from "@/store/useProjectStore";
import { audioEngine, type InstrumentType } from "@/lib/audio/engine";
import { PianoRoll } from "./PianoRoll";

export function CompositionCanvas() {
  const tracks = useProjectStore((s) => s.tracks);
  const activeTrackId = useProjectStore((s) => s.activeTrackId);
  const setActiveTrack = useProjectStore((s) => s.setActiveTrack);
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute);
  const toggleTrackSolo = useProjectStore((s) => s.toggleTrackSolo);
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume);
  const removeTrack = useProjectStore((s) => s.removeTrack);
  const clearTrackNotes = useProjectStore((s) => s.clearTrackNotes);
  const reorderTracks = useProjectStore((s) => s.reorderTracks);
  const setTrackAudioBlob = useProjectStore((s) => s.setTrackAudioBlob);
  const isEditorOpen = useProjectStore((s) => s.isEditorOpen);
  const setEditorOpen = useProjectStore((s) => s.setEditorOpen);

  const currentStep = useProjectStore((s) => s.currentStep);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const toggleNote = useProjectStore((s) => s.toggleNote);
  const tonic = useProjectStore((s) => s.tonic);

  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  // Synchronize vocal track with audio engine whenever tracks change
  useEffect(() => {
    const voiceTrack = tracks.find((t) => t.isAudioTrack && t.audioBlobUrl);
    const hasSolo = tracks.some((t) => t.solo);
    if (voiceTrack) {
      const isMuted = hasSolo ? !voiceTrack.solo : voiceTrack.muted;
      audioEngine.syncVocalTrack(voiceTrack.audioBlobUrl, voiceTrack.volume, isMuted);
    } else {
      audioEngine.syncVocalTrack(null);
    }
  }, [tracks]);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  const getTrackIcon = (instrument: InstrumentType, isAudioTrack?: boolean) => {
    if (isAudioTrack) return <Mic className="w-3.5 h-3.5 text-d3-rust" />;
    switch (instrument) {
      case "piano":
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case "pluck":
        return <Zap className="w-3.5 h-3.5 text-d3-amber" />;
      case "tabla":
        return <Disc className="w-3.5 h-3.5 text-rose-400" />;
      case "flute":
        return <Wind className="w-3.5 h-3.5 text-sky-400" />;
      case "violin":
        return <Music className="w-3.5 h-3.5 text-violet-400" />;
      case "guitar":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "poly":
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case "fm":
        return <Sparkles className="w-3.5 h-3.5 text-amber-300" />;
      case "beats":
        return <Radio className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Music className="w-3.5 h-3.5 text-d3-neutral-400" />;
    }
  };

  const getTrackBadgeColor = (instrument: InstrumentType, isActive: boolean) => {
    if (isActive) return "border-d3-amber bg-d3-amber/10";
    return "border-d3-neutral-700/80 bg-d3-neutral-900/80 hover:bg-d3-neutral-850 hover:border-d3-neutral-600";
  };

  const getTrackBarColor = (instrument: InstrumentType) => {
    switch (instrument) {
      case "piano":
        return "bg-emerald-500/90 text-emerald-950 border-emerald-400/60";
      case "pluck":
        return "bg-d3-amber text-d3-ink border-amber-300";
      case "tabla":
        return "bg-rose-500/90 text-rose-950 border-rose-400/60";
      case "flute":
        return "bg-sky-500/90 text-sky-950 border-sky-400/60";
      case "violin":
        return "bg-violet-500/90 text-violet-950 border-violet-400/60";
      case "guitar":
        return "bg-amber-600/90 text-amber-950 border-amber-400/60";
      case "poly":
        return "bg-indigo-500/90 text-indigo-950 border-indigo-400/60";
      case "fm":
        return "bg-amber-400 text-amber-950 border-amber-300";
      case "beats":
        return "bg-orange-500/90 text-orange-950 border-orange-400/60";
      default:
        return "bg-d3-neutral-600 text-d3-paper border-d3-neutral-500";
    }
  };

  const handleAuditionLayer = (track: ProjectTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.notes.length > 0) {
      const firstNote = track.notes[0];
      audioEngine.previewNote(firstNote.pitch, "4n", 0.9, track.instrument);
    } else {
      audioEngine.previewNote("C4", "4n", 0.9, track.instrument);
    }
  };

  const handleTrackCellClick = (track: ProjectTrack, step: number) => {
    setActiveTrack(track.id);
    const existing = track.notes.find((n) => n.step === step);
    if (existing) {
      audioEngine.previewNote(existing.pitch, "8n", existing.velocity || 0.85, track.instrument);
    } else {
      if (track.instrument === "tabla") {
        toggleNote("C4", step, undefined, 0.85, "Dha");
      } else if (track.instrument === "beats") {
        toggleNote("C4", step, undefined, 0.85, "Kick");
      } else {
        toggleNote("C4", step, "S", 0.85);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-d3-ink overflow-hidden select-none">
      {/* 1. Composition Canvas Workspace Header */}
      <div className="px-4 py-2 bg-d3-neutral-900 border-b border-d3-neutral-700 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-d3-amber animate-pulse" />
            <span className="font-display font-semibold text-xs tracking-wide text-d3-paper uppercase">
              YOUR COMPOSITION
            </span>
          </div>
          <span className="text-[10px] font-mono text-d3-neutral-500 border-l border-d3-neutral-700 pl-3">
            {tracks.length} Layers · 16-Step Horizontal Arrangement
          </span>
        </div>

        {/* Note Editor Drawer Toggle */}
        <button
          onClick={() => setEditorOpen(!isEditorOpen)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
            isEditorOpen
              ? "bg-d3-amber/20 border-d3-amber text-d3-amber font-bold"
              : "bg-d3-neutral-800 hover:bg-d3-neutral-700 border-d3-neutral-700 text-d3-neutral-300"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isEditorOpen ? "Collapse Note Editor" : "Open Note Editor (Piano Roll)"}</span>
          {isEditorOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-d3-amber" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-d3-amber" />
          )}
        </button>
      </div>

      {/* 2. Top Time Ruler (0:00 -> 0:30 Feel, 16 steps) */}
      <div className="flex items-center border-b border-d3-neutral-700 bg-d3-neutral-900/90 sticky top-0 z-20">
        <div className="w-56 sm:w-64 flex-shrink-0 px-3.5 py-1.5 border-r border-d3-neutral-700 text-[11px] font-mono text-d3-neutral-400 flex items-center justify-between">
          <span className="font-bold">LAYERS</span>
          <span className="text-[10px] text-d3-neutral-500">VOL / M / S</span>
        </div>

        {/* 16-Step Time Indicators */}
        <div className="flex-1 grid grid-cols-16">
          {Array.from({ length: 16 }, (_, step) => {
            const beat = Math.floor(step / 4) + 1;
            const sub = (step % 4) + 1;
            const isCurrent = isPlaying && currentStep === step;
            const isBeatStart = step % 4 === 0;

            return (
              <div
                key={step}
                className={`py-1 text-center text-[10px] font-mono border-r transition-all ${
                  isBeatStart
                    ? "border-r-d3-neutral-700 bg-d3-neutral-950/40"
                    : "border-r-d3-neutral-800/40"
                } ${
                  isCurrent
                    ? "bg-d3-amber/20 text-d3-amber font-bold border-b-2 border-b-d3-amber"
                    : "text-d3-neutral-500"
                }`}
              >
                <span>{isBeatStart ? `0:0${beat * 2}` : `${beat}.${sub}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Horizontal Layer Stacks Canvas */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
        {tracks.map((track, trackIdx) => {
          const isActive = track.id === activeTrackId;
          const isMuted = track.muted;
          const isSolo = track.solo;
          const isHovered = hoveredTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              onMouseEnter={() => setHoveredTrackId(track.id)}
              onMouseLeave={() => setHoveredTrackId(null)}
              className={`flex items-stretch rounded-xl border transition-all cursor-pointer ${getTrackBadgeColor(
                track.instrument,
                isActive
              )}`}
            >
              {/* Left Track Control Badge */}
              <div className="w-56 sm:w-64 flex-shrink-0 p-2.5 flex items-center justify-between border-r border-d3-neutral-700/80 bg-d3-neutral-950/50">
                {/* Track Order Buttons (Up / Down) */}
                <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
                  <button
                    disabled={trackIdx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderTracks(trackIdx, trackIdx - 1);
                    }}
                    className={`p-0.5 rounded transition-colors ${
                      trackIdx === 0
                        ? "opacity-20 cursor-not-allowed text-d3-neutral-600"
                        : "text-d3-neutral-400 hover:text-d3-amber hover:bg-d3-neutral-800"
                    }`}
                    title="Move Layer Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={trackIdx === tracks.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderTracks(trackIdx, trackIdx + 1);
                    }}
                    className={`p-0.5 rounded transition-colors ${
                      trackIdx === tracks.length - 1
                        ? "opacity-20 cursor-not-allowed text-d3-neutral-600"
                        : "text-d3-neutral-400 hover:text-d3-amber hover:bg-d3-neutral-800"
                    }`}
                    title="Move Layer Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-d3-neutral-900 border border-d3-neutral-700 flex items-center justify-center flex-shrink-0">
                    {getTrackIcon(track.instrument, track.isAudioTrack)}
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs font-semibold text-d3-paper block truncate">
                      {track.name}
                    </span>
                    <span className="text-[10px] font-mono text-d3-neutral-500 block truncate leading-tight">
                      {track.isAudioTrack
                        ? track.audioBlobUrl
                          ? "Vocal take captured"
                          : "Live Mic · WebM"
                        : `${track.type} · ${track.notes.length} ${
                            track.notes.length === 1 ? "note" : "notes"
                          }`}
                    </span>
                  </div>
                </div>

                {/* Track Fader, Mute & Solo Controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                  {/* Compact Volume slider */}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={track.volume}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setTrackVolume(track.id, Number(e.target.value))}
                    className="w-10 h-1 bg-d3-neutral-700 rounded appearance-none cursor-pointer accent-d3-amber hidden sm:block"
                    title={`Layer Volume: ${Math.round(track.volume * 100)}%`}
                  />

                  {/* Mute button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackMute(track.id);
                    }}
                    title={isMuted ? "Unmute layer" : "Mute layer"}
                    className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors ${
                      isMuted
                        ? "bg-d3-rust text-d3-paper shadow-sm"
                        : "bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper"
                    }`}
                  >
                    M
                  </button>

                  {/* Solo button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackSolo(track.id);
                    }}
                    title={isSolo ? "Deactivate Solo" : "Solo layer"}
                    className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors ${
                      isSolo
                        ? "bg-d3-amber text-d3-ink font-extrabold shadow-sm"
                        : "bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper"
                    }`}
                  >
                    S
                  </button>

                  {/* Audition single layer (non-audio) */}
                  {!track.isAudioTrack ? (
                    <button
                      onClick={(e) => handleAuditionLayer(track, e)}
                      title="Audition this layer"
                      className="p-1 rounded hover:bg-d3-neutral-800 text-d3-neutral-500 hover:text-d3-amber transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  {/* Delete track if multiple */}
                  {tracks.length > 1 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrack(track.id);
                      }}
                      title="Remove layer"
                      className="p-1 rounded hover:bg-d3-rust/20 text-d3-neutral-600 hover:text-d3-rust transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 16-Step Horizontal Strip or Vocal Waveform Strip */}
              {track.isAudioTrack ? (
                track.audioBlobUrl ? (
                  <div className="flex-1 flex items-center justify-between px-3 bg-d3-neutral-950/70 border-l border-d3-rust/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-semibold text-d3-paper">
                        Recorded Vocal Take
                      </span>
                      <span className="text-[10px] font-mono text-d3-neutral-500 hidden sm:inline">
                        (Synchronized with 16-step composition loop)
                      </span>
                    </div>

                    {/* Waveform Visualization Bars */}
                    <div className="flex-1 max-w-xs h-6 mx-4 flex items-center gap-0.5 px-2 bg-d3-neutral-900 rounded border border-d3-neutral-800">
                      {[30, 45, 70, 85, 60, 40, 75, 95, 80, 50, 65, 85, 70, 40, 55, 30].map(
                        (h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={`flex-1 rounded-sm transition-all ${
                              isPlaying && currentStep === i
                                ? "bg-d3-amber"
                                : "bg-d3-rust/60 hover:bg-d3-rust"
                            }`}
                          />
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (track.audioBlobUrl) {
                            const audio = new Audio(track.audioBlobUrl);
                            audio.volume = track.volume ?? 0.8;
                            audio.play().catch(console.warn);
                          }
                        }}
                        title="Audition recorded vocal take alone"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-d3-neutral-800 hover:bg-d3-neutral-700 text-d3-paper text-[10px] font-mono border border-d3-neutral-700 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current text-d3-amber" />
                        <span>Audition Take</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrackAudioBlob(track.id, undefined);
                        }}
                        title="Discard vocal take and re-record"
                        className="p-1 rounded text-d3-neutral-500 hover:text-d3-rust hover:bg-d3-neutral-800 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between px-3 bg-d3-neutral-950/40 border-l border-dashed border-d3-neutral-800">
                    <div className="flex items-center gap-2 text-d3-neutral-500">
                      <Mic className="w-4 h-4 text-d3-rust/60" />
                      <span className="text-xs font-mono">
                        Microphone Layer Armed · Click{" "}
                        <strong className="text-d3-rust">[REC]</strong> in the top transport bar
                        to record vocals or acoustic instruments over your loop.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-d3-neutral-600 bg-d3-neutral-900 px-2 py-0.5 rounded border border-d3-neutral-800">
                      Web Audio MediaRecorder
                    </span>
                  </div>
                )
              ) : (
                <div className="flex-1 grid grid-cols-16 min-h-[44px] relative px-0.5">
                  {Array.from({ length: 16 }, (_, step) => {
                    const isCurrent = isPlaying && currentStep === step;
                    const stepNotes = track.notes.filter((n) => n.step === step);
                    const isBeatStart = step % 4 === 0;

                    return (
                      <div
                        key={step}
                        onClick={() => handleTrackCellClick(track, step)}
                        className={`relative border-r flex items-center justify-center p-0.5 transition-colors ${
                          isBeatStart
                            ? "border-r-d3-neutral-700/80 bg-d3-neutral-950/20"
                            : "border-r-d3-neutral-800/40"
                        } ${isCurrent ? "bg-d3-amber/10" : ""} hover:bg-d3-neutral-800/40`}
                      >
                        {stepNotes.length > 0 ? (
                          <div
                            className={`w-full mx-0.5 h-7 rounded-md border flex flex-col items-center justify-center shadow-sm transition-all ${getTrackBarColor(
                              track.instrument
                            )} ${isCurrent ? "brightness-125 scale-105" : ""}`}
                            title={`${track.name}: ${stepNotes
                              .map((n) => n.bol || n.swara || n.pitch)
                              .join(", ")}`}
                          >
                            <span className="text-[10px] font-mono font-bold leading-none truncate px-1">
                              {stepNotes[0].bol || stepNotes[0].swara || stepNotes[0].pitch}
                            </span>
                          </div>
                        ) : isBeatStart ? (
                          <div className="w-1 h-1 rounded-full bg-d3-neutral-700/60 pointer-events-none" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Minimal Add Another Layer Action */}
        <div className="pt-2 flex items-center justify-center">
          <div className="text-center py-2 px-4 rounded-xl border border-dashed border-d3-neutral-800 hover:border-d3-neutral-600 transition-colors">
            <span className="text-xs font-mono text-d3-neutral-500">
              Select sounds from the Open Sound Library on the left to add another layer.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Secondary Contextual Note Editor (Piano Roll) */}
      {isEditorOpen ? (
        <div className="h-80 border-t border-d3-neutral-700 flex flex-col bg-d3-ink animate-in slide-in-from-bottom duration-200">
          <div className="px-4 py-1.5 bg-d3-neutral-900 border-b border-d3-neutral-700 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-d3-amber" />
              <span className="text-d3-paper font-semibold">
                NOTE EDITOR: {activeTrack?.name || "Active Layer"}
              </span>
              <span className="text-d3-neutral-500">
                ({activeTrack?.notes.length || 0} notes)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-d3-neutral-500">
                Click any cell to toggle note · Drag from library
              </span>
              <button
                onClick={() => setEditorOpen(false)}
                className="p-1 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper"
                title="Collapse Editor"
              >
                <ChevronDown className="w-4 h-4 text-d3-amber" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <PianoRoll />
          </div>
        </div>
      ) : (
        /* Collapsed Helper Bar */
        <div className="px-4 py-2 bg-d3-neutral-900 border-t border-d3-neutral-700 flex items-center justify-between text-xs text-d3-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-d3-neutral-500">Active Layer:</span>
            <span className="text-d3-paper font-bold">{activeTrack?.name}</span>
            <span className="text-d3-neutral-500">
              · {activeTrack?.notes.length || 0} notes
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] text-d3-neutral-500">
              Space to Play/Pause · Click a layer to select
            </span>
            <button
              onClick={() => setEditorOpen(true)}
              className="text-xs text-d3-amber hover:text-d3-paper underline font-medium transition-colors"
            >
              Open Note Editor →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
