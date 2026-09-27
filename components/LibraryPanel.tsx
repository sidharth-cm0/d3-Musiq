"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Music,
  Zap,
  Disc,
  Radio,
  Sliders,
  Volume2,
  Plus,
  ChevronRight,
  Layers,
  Wind,
  Info,
  X,
  Play,
  Check,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { audioEngine, type InstrumentType } from "@/lib/audio/engine";
import { getYamanScaleDetails } from "@/lib/theory/carnatic";
import {
  LIBRARY_INSTRUMENTS,
  LIBRARY_RAAGAS,
  LIBRARY_LOOPS,
  RECOMMENDED_PHRASES,
  type LibraryInstrument,
  type LoopCategory,
} from "@/lib/library/library-data";

export function LibraryPanel() {
  const tonic = useProjectStore((s) => s.tonic);
  const currentStep = useProjectStore((s) => s.currentStep);
  const activeTrackId = useProjectStore((s) => s.activeTrackId);
  const tracks = useProjectStore((s) => s.tracks);
  const instrument = useProjectStore((s) => s.instrument);
  const addNote = useProjectStore((s) => s.addNote);
  const addTrack = useProjectStore((s) => s.addTrack);
  const addPhraseToTrack = useProjectStore((s) => s.addPhraseToTrack);
  const setScale = useProjectStore((s) => s.setScale);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLoopFilter, setActiveLoopFilter] = useState<LoopCategory | "all">("all");
  const [auditioningId, setAuditioningId] = useState<string | null>(null);
  const [selectedInstrumentDetail, setSelectedInstrumentDetail] = useState<LibraryInstrument | null>(null);
  const [detailTab, setDetailTab] = useState<"notes" | "articulations" | "phrases">("notes");
  const [showTaxonomyModal, setShowTaxonomyModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const activeInstrumentData = LIBRARY_INSTRUMENTS.find((i) => i.id === instrument);
  const isPercussion = activeInstrumentData?.engineType === "percussion";
  const yamanNotes = getYamanScaleDetails(tonic);

  const showFeedback = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2000);
  };

  /**
   * HEAR / PREVIEW: Auditions sound temporarily without modifying composition state.
   */
  const handleAuditionSound = (
    id: string,
    pitch: string,
    instType?: InstrumentType,
    duration = "4n"
  ) => {
    setAuditioningId(id);
    audioEngine.previewNote(pitch, duration, 0.9, instType || (instrument as InstrumentType));
    setTimeout(() => {
      setAuditioningId((curr) => (curr === id ? null : curr));
    }, 450);
  };

  /**
   * ADD: Places material into the composition workspace as a new track or into the active track.
   */
  const handleAddInstrumentLayer = (inst: LibraryInstrument) => {
    // Check if a layer for this instrument already exists
    const existing = tracks.find((t) => t.instrument === inst.id);
    if (existing) {
      useProjectStore.getState().setActiveTrack(existing.id);
      showFeedback(`Switched to ${inst.name} layer`);
    } else {
      addTrack({
        name: inst.name,
        type: `${inst.style.split("/")[0].trim()} ${inst.category}`,
        instrument: inst.id as InstrumentType,
        notes: inst.phrases?.[0]?.notes.map((pn, i) => ({
          id: `add-${inst.id}-${i}-${Date.now()}`,
          pitch: pn.pitch,
          swara: pn.swara,
          bol: (pn as any).bol,
          step: pn.step,
          duration: pn.duration || 1,
          velocity: pn.velocity || 0.85,
        })) || [],
      });
      showFeedback(`Added ${inst.name} layer to project`);
    }
  };

  const handleAddLoopToProject = (loop: typeof LIBRARY_LOOPS[0]) => {
    const targetTrack = tracks.find((t) => t.instrument === loop.instrumentId);
    if (targetTrack) {
      addPhraseToTrack(targetTrack.id, loop.notes);
      useProjectStore.getState().setActiveTrack(targetTrack.id);
      showFeedback(`Added ${loop.name} to ${targetTrack.name}`);
    } else {
      addTrack({
        name: loop.instrumentName,
        type: `${loop.category.toUpperCase()} Loop`,
        instrument: loop.instrumentId as InstrumentType,
        notes: loop.notes.map((pn, i) => ({
          id: `loop-${loop.id}-${i}-${Date.now()}`,
          pitch: pn.pitch,
          swara: pn.swara,
          bol: pn.bol,
          step: pn.step,
          duration: pn.duration || 1,
          velocity: pn.velocity || 0.85,
        })),
      });
      showFeedback(`Added ${loop.name} as new layer`);
    }
  };

  const handleAddPhraseToActive = (phrase: typeof RECOMMENDED_PHRASES[0]) => {
    if (activeTrack) {
      addPhraseToTrack(activeTrack.id, phrase.notes);
      showFeedback(`Added phrase to ${activeTrack.name}`);
    } else {
      addTrack({
        name: phrase.instrumentName,
        type: "Melodic Phrase",
        instrument: phrase.instrumentId as InstrumentType,
        notes: phrase.notes.map((pn, i) => ({
          id: `rec-phrase-${i}-${Date.now()}`,
          pitch: pn.pitch,
          swara: pn.swara as any,
          bol: (pn as any).bol,
          step: pn.step,
          duration: pn.duration || 1,
          velocity: pn.velocity || 0.85,
        })),
      });
      showFeedback(`Added ${phrase.title} as new layer`);
    }
  };

  const handleAddNoteAtPlayhead = (pitch: string, swara?: string, bol?: string) => {
    handleAuditionSound(`note-${pitch}`, pitch, instrument as InstrumentType, "8n");
    addNote({
      pitch,
      swara: swara as any,
      bol,
      step: currentStep,
      duration: 1,
      velocity: 0.85,
    });
    showFeedback(`Placed ${bol || swara || pitch} at step ${currentStep + 1}`);
  };

  const handleDragStart = (e: React.DragEvent, pitch: string, swara?: string, bol?: string) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ pitch, swara, bol })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  // Filter logic
  const filteredInstruments = LIBRARY_INSTRUMENTS.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLoops = LIBRARY_LOOPS.filter((loop) => {
    const matchesSearch =
      loop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loop.instrumentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeLoopFilter === "all" || loop.category === activeLoopFilter;
    return matchesSearch && matchesCat;
  });

  const getInstrumentIcon = (id: string) => {
    switch (id) {
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

  const renderHonestyBadge = (sourceType: LibraryInstrument["soundSourceType"]) => {
    switch (sourceType) {
      case "real_sample":
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Real Sample</span>
          </span>
        );
      case "synthesized_model":
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-d3-amber border border-amber-800/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-d3-amber inline-block" />
            <span>Synth Model</span>
          </span>
        );
      case "analog_synth":
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
            <span>Analog Synth</span>
          </span>
        );
      case "digital_fm":
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-200 border border-amber-700/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
            <span>Digital FM</span>
          </span>
        );
    }
  };

  return (
    <aside className="w-full md:w-96 flex-shrink-0 bg-d3-neutral-900 border-r border-d3-neutral-700 flex flex-col h-full overflow-hidden select-none">
      {/* 1. Header & Live Search */}
      <div className="p-3.5 border-b border-d3-neutral-700 bg-d3-neutral-900/95 sticky top-0 z-20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-d3-amber" />
            <h2 className="font-display font-semibold text-sm tracking-wide text-d3-paper">
              OPEN SOUND LIBRARY
            </h2>
          </div>
          <span className="text-[10px] font-mono text-d3-neutral-500 uppercase tracking-wider">
            DISCOVERY
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-d3-neutral-500" />
          <input
            type="text"
            placeholder="Search sounds, swaras, loops, instruments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-d3-neutral-950 border border-d3-neutral-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-d3-paper placeholder:text-d3-neutral-500 focus:outline-none focus:border-d3-amber transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-d3-neutral-500 hover:text-d3-paper"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Action Notice Toast */}
        {actionNotice ? (
          <div className="text-[10px] font-mono text-d3-amber bg-d3-amber/10 border border-d3-amber/30 rounded px-2 py-0.5 flex items-center gap-1.5 animate-in fade-in duration-150">
            <Check className="w-3 h-3 text-d3-amber" />
            <span>{actionNotice}</span>
          </div>
        ) : null}
      </div>

      {/* 2. Scrollable Discovery Canvas */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
        {/* SECTION: FOR YOU / FEATURED INSTRUMENTS */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-d3-neutral-500 font-bold">
              FOR YOU
            </span>
            <span className="text-[10px] font-mono text-d3-neutral-600">
              Click card for details
            </span>
          </div>

          <div className="space-y-1.5">
            {filteredInstruments.map((inst) => {
              const isAuditioning = auditioningId === inst.id;
              const hasLayer = tracks.some((t) => t.instrument === inst.id);

              return (
                <div
                  key={inst.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 group ${
                    isAuditioning
                      ? "bg-d3-amber/15 border-d3-amber/60 shadow-md"
                      : "bg-d3-neutral-950/60 border-d3-neutral-700/80 hover:bg-d3-neutral-850 hover:border-d3-neutral-600"
                  }`}
                >
                  {/* Left: Icon, Name & Honest Badge */}
                  <div
                    onClick={() => {
                      setSelectedInstrumentDetail(inst);
                      setDetailTab("notes");
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    title="Click to view notes, articulations, and honest provenance"
                  >
                    <div className="w-7 h-7 rounded-lg bg-d3-neutral-900 border border-d3-neutral-700 flex items-center justify-center flex-shrink-0">
                      {getInstrumentIcon(inst.id)}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-d3-paper truncate group-hover:text-d3-amber transition-colors">
                          {inst.name}
                        </span>
                        {hasLayer ? (
                          <span className="text-[9px] font-mono font-bold bg-d3-neutral-800 text-d3-amber px-1.5 py-0.2 rounded border border-d3-neutral-700">
                            Layered
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {renderHonestyBadge(inst.soundSourceType)}
                        <span className="text-[10px] font-mono text-d3-neutral-500 truncate">
                          {inst.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Distinct HEAR and ADD actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleAuditionSound(inst.id, inst.previewPitch || "C4", inst.id as InstrumentType)
                      }
                      title="Audition sound without adding"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
                        isAuditioning
                          ? "bg-d3-amber text-d3-ink font-bold animate-pulse"
                          : "bg-d3-neutral-900 hover:bg-d3-neutral-800 text-d3-neutral-300 hover:text-d3-paper border border-d3-neutral-700"
                      }`}
                    >
                      <Volume2 className="w-3 h-3 text-d3-amber" />
                      <span>Hear</span>
                    </button>

                    <button
                      onClick={() => handleAddInstrumentLayer(inst)}
                      title="Add to composition workspace"
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-d3-neutral-800 hover:bg-d3-amber hover:text-d3-ink text-d3-paper border border-d3-neutral-700 text-[11px] font-mono font-semibold transition-all shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: RAAGAS */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-d3-neutral-500 font-bold">
              RAAGAS
            </span>
            <span className="text-[10px] font-mono text-d3-neutral-600">
              Modal frameworks
            </span>
          </div>

          <div className="space-y-1.5">
            {LIBRARY_RAAGAS.map((raaga) => {
              const isAuditioning = auditioningId === raaga.id;
              const isActive = raaga.id === "yaman";

              return (
                <div
                  key={raaga.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isActive
                      ? "bg-d3-amber/10 border-d3-amber/40 text-d3-paper"
                      : "bg-d3-neutral-950/40 border-d3-neutral-700/60 hover:bg-d3-neutral-900/60 text-d3-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-d3-paper">
                          {raaga.name}
                        </span>
                        <span className="text-[10px] font-mono text-d3-amber/80">
                          ({raaga.westernEquivalent.split("(")[0].trim()})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-d3-neutral-500 block mt-0.5 truncate">
                        {raaga.swaras.join(" · ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleAuditionSound(
                            raaga.id,
                            raaga.previewPitch,
                            "pluck",
                            "2n"
                          )
                        }
                        title="Audition characteristic raaga interval"
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                          isAuditioning
                            ? "bg-d3-amber text-d3-ink font-bold animate-pulse"
                            : "bg-d3-neutral-900 hover:bg-d3-neutral-800 text-d3-neutral-300 border border-d3-neutral-700"
                        }`}
                      >
                        <Volume2 className="w-3 h-3 text-d3-amber" />
                        <span>Hear</span>
                      </button>

                      <button
                        onClick={() => {
                          setScale("yaman");
                          if (activeTrack) {
                            addPhraseToTrack(activeTrack.id, raaga.characteristicPhrase);
                            showFeedback(`Applied ${raaga.name} to ${activeTrack.name}`);
                          }
                        }}
                        title="Apply raaga to project"
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-d3-neutral-800 hover:bg-d3-amber hover:text-d3-ink text-d3-paper border border-d3-neutral-700 text-[10px] font-mono font-semibold transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: LOOPS */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-d3-neutral-500 font-bold">
              LOOPS & TEXTURES
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
            {(["all", "rhythm", "melody", "atmosphere", "bass"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveLoopFilter(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors whitespace-nowrap ${
                  activeLoopFilter === cat
                    ? "bg-d3-amber/20 text-d3-amber border border-d3-amber/40 font-bold"
                    : "bg-d3-neutral-950 text-d3-neutral-500 hover:text-d3-paper border border-d3-neutral-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {filteredLoops.map((loop) => {
              const isAuditioning = auditioningId === loop.id;

              return (
                <div
                  key={loop.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                    isAuditioning
                      ? "bg-d3-amber/15 border-d3-amber/60"
                      : "bg-d3-neutral-950/60 border-d3-neutral-700/80 hover:bg-d3-neutral-850"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-d3-paper block truncate">
                      {loop.name}
                    </span>
                    <span className="text-[10px] font-mono text-d3-neutral-500 block truncate leading-tight">
                      {loop.instrumentName} · {loop.tempoBpm} BPM
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleAuditionSound(
                          loop.id,
                          loop.previewPitch,
                          loop.instrumentId as InstrumentType,
                          "4n"
                        )
                      }
                      title="Audition loop root"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                        isAuditioning
                          ? "bg-d3-amber text-d3-ink font-bold animate-pulse"
                          : "bg-d3-neutral-900 hover:bg-d3-neutral-800 text-d3-neutral-300 border border-d3-neutral-700"
                      }`}
                    >
                      <Volume2 className="w-3 h-3 text-d3-amber" />
                      <span>Hear</span>
                    </button>

                    <button
                      onClick={() => handleAddLoopToProject(loop)}
                      title="Add loop into composition"
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-d3-neutral-800 hover:bg-d3-amber hover:text-d3-ink text-d3-paper border border-d3-neutral-700 text-[10px] font-mono font-semibold transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: PHRASES */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-d3-neutral-500 font-bold">
              PHRASES & MOTIFS
            </span>
          </div>

          <div className="space-y-1.5">
            {RECOMMENDED_PHRASES.map((phrase) => {
              const isAuditioning = auditioningId === phrase.id;

              return (
                <div
                  key={phrase.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                    isAuditioning
                      ? "bg-d3-amber/15 border-d3-amber/60"
                      : "bg-d3-neutral-950/60 border-d3-neutral-700/80 hover:bg-d3-neutral-850"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-d3-paper block truncate">
                      {phrase.title}
                    </span>
                    <span className="text-[10px] font-mono text-d3-neutral-500 block truncate leading-tight">
                      {phrase.instrumentName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleAuditionSound(
                          phrase.id,
                          phrase.previewPitch,
                          phrase.instrumentId as InstrumentType,
                          "2n"
                        )
                      }
                      title="Audition phrase"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                        isAuditioning
                          ? "bg-d3-amber text-d3-ink font-bold animate-pulse"
                          : "bg-d3-neutral-900 hover:bg-d3-neutral-800 text-d3-neutral-300 border border-d3-neutral-700"
                      }`}
                    >
                      <Volume2 className="w-3 h-3 text-d3-amber" />
                      <span>Hear</span>
                    </button>

                    <button
                      onClick={() => handleAddPhraseToActive(phrase)}
                      title="Add phrase to project"
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-d3-neutral-800 hover:bg-d3-amber hover:text-d3-ink text-d3-paper border border-d3-neutral-700 text-[10px] font-mono font-semibold transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: ACTIVE INSTRUMENT SWARAS / BOLS */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-d3-neutral-500 font-bold mb-2 px-1">
            <span>
              {isPercussion ? "TABLA BOLS" : `SWARAS (${tonic})`}
            </span>
            <span className="text-[9px] font-normal text-d3-neutral-500">
              Drag to grid or click Add
            </span>
          </div>

          <div className="space-y-1">
            {isPercussion ? (
              activeInstrumentData?.percussionPads?.map((pad) => {
                const isAuditioning = auditioningId === pad.id;
                return (
                  <div
                    key={pad.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, pad.pitchMapping, undefined, pad.name)}
                    className="flex items-center justify-between p-2 rounded-lg bg-d3-neutral-950/60 hover:bg-d3-neutral-800 border border-d3-neutral-700/80 hover:border-d3-neutral-600 transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-d3-neutral-900 border border-d3-neutral-700 text-d3-paper font-bold font-mono text-xs flex items-center justify-center">
                        {pad.name}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-d3-neutral-200 block">
                          {pad.strokeName}
                        </span>
                        <span className="text-[10px] font-mono text-d3-neutral-500">
                          {pad.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAuditionSound(pad.id, pad.pitchMapping, "tabla", "8n")}
                        title="Audition pad"
                        className={`p-1.5 rounded transition-colors ${
                          isAuditioning ? "text-d3-amber font-bold" : "text-d3-neutral-500 hover:text-d3-paper"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddNoteAtPlayhead(pad.pitchMapping, undefined, pad.name)}
                        title="Place on timeline"
                        className="p-1.5 rounded text-d3-neutral-500 hover:text-d3-amber transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              yamanNotes.map((item, idx) => {
                const degree = idx + 1 === 8 ? "8" : idx === 3 ? "♯4" : `${idx + 1}`;
                const isAuditioning = auditioningId === item.swara;
                return (
                  <div
                    key={item.swara}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.pitch, item.swara)}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-d3-neutral-950/60 hover:bg-d3-neutral-800 border border-d3-neutral-700/80 hover:border-d3-neutral-600 transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-d3-neutral-900 border border-d3-neutral-700 flex flex-col items-center justify-center text-d3-amber font-mono font-bold text-xs">
                        {item.swara}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-d3-paper">
                            {item.pitch}
                          </span>
                          <span className="text-[10px] font-mono text-d3-neutral-500">
                            [{degree}]
                          </span>
                        </div>
                        <span className="text-[10px] text-d3-neutral-500 leading-none">
                          {item.info.carnaticName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          handleAuditionSound(
                            item.swara,
                            item.pitch,
                            instrument as InstrumentType,
                            "8n"
                          )
                        }
                        title="Audition swara"
                        className={`p-1.5 rounded transition-colors ${
                          isAuditioning ? "text-d3-amber font-bold" : "text-d3-neutral-500 hover:text-d3-paper"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddNoteAtPlayhead(item.pitch, item.swara)}
                        title="Add to current step"
                        className="p-1.5 rounded text-d3-neutral-500 hover:text-d3-amber transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION: BROWSE ALL TAXONOMY */}
        <div className="pt-2 border-t border-d3-neutral-800">
          <button
            onClick={() => setShowTaxonomyModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-d3-neutral-950 hover:bg-d3-neutral-850 border border-d3-neutral-700 text-xs font-mono font-medium text-d3-neutral-400 hover:text-d3-paper transition-colors flex items-center justify-between"
          >
            <span>Browse All Taxonomy & Families →</span>
            <ChevronRight className="w-3.5 h-3.5 text-d3-amber" />
          </button>
        </div>
      </div>

      {/* 3. Comprehensive Instrument Detail Modal */}
      {selectedInstrumentDetail ? (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-d3-neutral-900 border border-d3-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-d3-neutral-700 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-d3-neutral-950 border border-d3-neutral-700 flex items-center justify-center">
                  {getInstrumentIcon(selectedInstrumentDetail.id)}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-d3-paper leading-tight">
                    {selectedInstrumentDetail.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-d3-neutral-500">
                    <span>{selectedInstrumentDetail.style}</span>
                    <span>·</span>
                    <span>{selectedInstrumentDetail.category}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstrumentDetail(null)}
                className="p-1 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <p className="text-xs text-d3-neutral-300 leading-relaxed">
                {selectedInstrumentDetail.description}
              </p>

              {/* Strict Honesty & Technical Provenance Card */}
              <div className="p-3.5 rounded-xl bg-d3-neutral-950 border border-d3-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-d3-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-d3-amber" />
                    <span>HONESTY DISCLOSURE</span>
                  </span>
                  {renderHonestyBadge(selectedInstrumentDetail.soundSourceType)}
                </div>

                <p className="text-xs text-d3-paper/90 leading-relaxed">
                  {selectedInstrumentDetail.sourceDetails}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-d3-neutral-850 text-[10px] font-mono">
                  <div>
                    <span className="text-d3-neutral-500 block">SOURCE / PROVENANCE:</span>
                    <span className="text-d3-neutral-300 font-semibold truncate block">
                      {selectedInstrumentDetail.provenance}
                    </span>
                  </div>
                  <div>
                    <span className="text-d3-neutral-500 block">LICENSE:</span>
                    <span className="text-d3-amber font-semibold block">
                      {selectedInstrumentDetail.license}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Tabs: Notes vs Articulations vs Phrases */}
              <div className="border-b border-d3-neutral-700 flex items-center gap-4 text-xs font-mono font-medium">
                <button
                  onClick={() => setDetailTab("notes")}
                  className={`pb-2 border-b-2 transition-colors ${
                    detailTab === "notes"
                      ? "border-d3-amber text-d3-amber font-bold"
                      : "border-transparent text-d3-neutral-400 hover:text-d3-paper"
                  }`}
                >
                  Individual Sounds ({selectedInstrumentDetail.notesCatalog.length})
                </button>
                <button
                  onClick={() => setDetailTab("articulations")}
                  className={`pb-2 border-b-2 transition-colors ${
                    detailTab === "articulations"
                      ? "border-d3-amber text-d3-amber font-bold"
                      : "border-transparent text-d3-neutral-400 hover:text-d3-paper"
                  }`}
                >
                  Articulations ({selectedInstrumentDetail.articulations.length})
                </button>
                <button
                  onClick={() => setDetailTab("phrases")}
                  className={`pb-2 border-b-2 transition-colors ${
                    detailTab === "phrases"
                      ? "border-d3-amber text-d3-amber font-bold"
                      : "border-transparent text-d3-neutral-400 hover:text-d3-paper"
                  }`}
                >
                  Phrases ({selectedInstrumentDetail.phrases.length})
                </button>
              </div>

              {/* Tab 1: Notes / Swaras Catalog */}
              {detailTab === "notes" ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-d3-neutral-500">
                    Click any note to audition across octaves:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                    {selectedInstrumentDetail.notesCatalog.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          handleAuditionSound(
                            `detail-note-${item.pitch}`,
                            item.pitch,
                            selectedInstrumentDetail.id as InstrumentType
                          )
                        }
                        className="p-2 rounded-lg bg-d3-neutral-950 border border-d3-neutral-800 hover:border-d3-amber/60 text-left transition-all group flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-mono font-bold text-d3-paper group-hover:text-d3-amber">
                            {item.bol ? `${item.bol} (${item.pitch})` : item.swara ? `${item.swara} (${item.pitch})` : item.pitch}
                          </div>
                          <div className="text-[10px] font-mono text-d3-neutral-500">
                            {item.degree ? `[${item.degree}]` : `Octave ${item.octave}`}
                          </div>
                        </div>
                        <Volume2 className="w-3 h-3 text-d3-neutral-600 group-hover:text-d3-amber transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Tab 2: Articulations */}
              {detailTab === "articulations" ? (
                <div className="space-y-2">
                  {selectedInstrumentDetail.articulations.map((art) => (
                    <div
                      key={art.id}
                      className="p-2.5 rounded-lg bg-d3-neutral-950 border border-d3-neutral-800 text-left space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-d3-paper">
                          {art.name}
                        </span>
                        <span className="text-[9px] font-mono text-d3-neutral-500">
                          {art.isSimulated ? "Envelope Modulation" : "Acoustic Natural"}
                        </span>
                      </div>
                      <p className="text-xs text-d3-neutral-400">
                        {art.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Tab 3: Phrases */}
              {detailTab === "phrases" ? (
                <div className="space-y-2">
                  {selectedInstrumentDetail.phrases.map((phrase) => (
                    <div
                      key={phrase.id}
                      className="p-3 rounded-xl bg-d3-neutral-950 border border-d3-neutral-800 text-left flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-d3-paper block truncate">
                          {phrase.name}
                        </span>
                        <p className="text-[11px] text-d3-neutral-400 line-clamp-1 mt-0.5">
                          {phrase.description}
                        </p>
                        <span className="text-[10px] font-mono text-d3-neutral-500 block mt-1">
                          {phrase.notes.length} notes · {phrase.tempoBpm || 110} BPM
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleAuditionSound(
                              phrase.id,
                              phrase.notes[0]?.pitch || "C4",
                              selectedInstrumentDetail.id as InstrumentType
                            )
                          }
                          className="px-2.5 py-1 rounded bg-d3-neutral-900 hover:bg-d3-neutral-800 text-xs font-mono text-d3-neutral-300 flex items-center gap-1 border border-d3-neutral-700"
                        >
                          <Volume2 className="w-3 h-3 text-d3-amber" />
                          <span>Hear</span>
                        </button>

                        <button
                          onClick={() => {
                            if (activeTrack) {
                              addPhraseToTrack(activeTrack.id, phrase.notes);
                              showFeedback(`Added ${phrase.name} to ${activeTrack.name}`);
                            } else {
                              handleAddInstrumentLayer(selectedInstrumentDetail);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-d3-neutral-800 hover:bg-d3-amber hover:text-d3-ink text-xs font-mono font-semibold text-d3-paper border border-d3-neutral-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-d3-neutral-700 flex-shrink-0">
              <button
                onClick={() =>
                  handleAuditionSound(
                    selectedInstrumentDetail.id,
                    selectedInstrumentDetail.previewPitch || "C4",
                    selectedInstrumentDetail.id as InstrumentType
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-d3-neutral-800 hover:bg-d3-neutral-700 text-xs font-mono text-d3-paper transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-d3-amber" />
                <span>Hear Audition</span>
              </button>

              <button
                onClick={() => {
                  handleAddInstrumentLayer(selectedInstrumentDetail);
                  setSelectedInstrumentDetail(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-d3-amber hover:bg-d3-paper text-d3-ink text-xs font-semibold tracking-wide transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>ADD TO PROJECT</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Taxonomy Modal */}
      {showTaxonomyModal ? (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-d3-neutral-900 border border-d3-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-d3-neutral-700 pb-3">
              <h3 className="font-display font-semibold text-base text-d3-paper">
                Open Sound Taxonomy
              </h3>
              <button
                onClick={() => setShowTaxonomyModal(false)}
                className="p-1 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-d3-neutral-400 leading-relaxed">
              D3 MusiQ organizes sounds from diverse traditions and instrument families:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {LIBRARY_INSTRUMENTS.map((inst) => (
                <div
                  key={inst.id}
                  className="w-full p-2.5 rounded-xl bg-d3-neutral-950 border border-d3-neutral-700 hover:border-d3-amber/60 text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-d3-neutral-900 border border-d3-neutral-700 flex items-center justify-center flex-shrink-0">
                      {getInstrumentIcon(inst.id)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-d3-paper block group-hover:text-d3-amber transition-colors">
                        {inst.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {renderHonestyBadge(inst.soundSourceType)}
                        <span className="text-[10px] font-mono text-d3-neutral-500">
                          {inst.style} · {inst.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleAuditionSound(
                          inst.id,
                          inst.previewPitch || "C4",
                          inst.id as InstrumentType
                        )
                      }
                      title="Audition"
                      className="p-1.5 rounded bg-d3-neutral-900 hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-amber"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        handleAddInstrumentLayer(inst);
                        setShowTaxonomyModal(false);
                      }}
                      title="Add Layer"
                      className="p-1.5 rounded bg-d3-neutral-800 hover:bg-d3-amber hover:text-d3-ink text-d3-paper"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
