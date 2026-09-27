"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sliders, Play, Music, Sparkles, FolderOpen } from "lucide-react";
import { AcousticAtmosphere } from "@/components/AcousticAtmosphere";
import { useProjectStore } from "@/store/useProjectStore";
import { audioEngine } from "@/lib/audio/engine";

export default function HomePage() {
  const setInstrument = useProjectStore((s) => s.setInstrument);
  const setAudioUnlocked = useProjectStore((s) => s.setAudioUnlocked);
  const loadPresetMelody = useProjectStore((s) => s.loadPresetMelody);

  const handleQuickStart = (instId?: string) => {
    if (instId) {
      setInstrument(instId as any);
    }
    loadPresetMelody();
    setAudioUnlocked(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-d3-ink relative flex flex-col items-center justify-center px-6 py-16 selection:bg-d3-amber selection:text-d3-ink">
      {/* Restrained Acoustic Standing Wave & Particle Atmosphere */}
      <AcousticAtmosphere opacity={0.35} />

      <div className="max-w-3xl w-full z-10 text-center space-y-8 my-auto">
        {/* Subtle Brand Emitter */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-d3-neutral-900 border border-d3-neutral-700 text-d3-amber text-xs font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-d3-amber animate-pulse" />
          <span>D3 ECOSYSTEM · SOUND & THEORY</span>
        </div>

        {/* Hero Title in Fraunces */}
        <div className="space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-d3-amber">
            D3 MUSIQ
          </div>
          <h1 className="font-display font-medium text-5xl sm:text-7xl text-d3-paper tracking-tight leading-[1.08]">
            Create music.<br />
            <span className="italic font-normal text-d3-neutral-300">Your way.</span>
          </h1>

          <p className="text-sm sm:text-base font-mono text-d3-paper/90 max-w-xl mx-auto tracking-wide pt-1">
            Find sounds. Layer them. Make music.
          </p>
          <p className="text-xs text-d3-neutral-400 max-w-md mx-auto leading-relaxed">
            The human remains the musician. D3 provides sounds, raagas, and a composition workspace. You decide what to combine.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <Link
            href="/production"
            onClick={() => handleQuickStart()}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-d3-amber hover:bg-d3-paper text-d3-ink font-semibold text-sm tracking-wide shadow-xl shadow-d3-amber-glow transition-all hover:scale-105 active:scale-95"
          >
            <span>START CREATING</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Continue Creating & Recent Project Card */}
        <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Active Preset Project */}
          <Link
            href="/production"
            onClick={() => handleQuickStart("pluck")}
            className="p-4 rounded-xl bg-d3-neutral-900/80 hover:bg-d3-neutral-850 border border-d3-neutral-700/80 hover:border-d3-neutral-600 transition-all group block"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-d3-neutral-500 mb-2">
              <span className="flex items-center gap-1.5 text-d3-amber">
                <Sparkles className="w-3 h-3" />
                <span>ACTIVE SESSION</span>
              </span>
              <span>110 BPM · C4</span>
            </div>
            <h3 className="font-display text-base text-d3-paper group-hover:text-d3-amber transition-colors">
              Raag Yaman Exploration
            </h3>
            <p className="text-xs text-d3-neutral-400 mt-1 line-clamp-1">
              S · R2 · G3 · M2 · P · D2 · N3 with Saraswati Veena & Piano
            </p>
          </Link>

          {/* Breakdown / Reverse Engineering Link */}
          <Link
            href="/breakdown"
            className="p-4 rounded-xl bg-d3-neutral-900/80 hover:bg-d3-neutral-850 border border-d3-neutral-700/80 hover:border-d3-neutral-600 transition-all group block"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-d3-neutral-500 mb-2">
              <span className="text-d3-neutral-400">ANALYSIS ENGINE</span>
              <span>YIN PITCH</span>
            </div>
            <h3 className="font-display text-base text-d3-paper group-hover:text-d3-amber transition-colors">
              Breakdown Workspace
            </h3>
            <p className="text-xs text-d3-neutral-400 mt-1 line-clamp-1">
              Upload or record audio to deconstruct swaras & send to Production
            </p>
          </Link>
        </div>

        {/* Small Open Library Discovery Section */}
        <div className="pt-4 border-t border-d3-neutral-800/80 text-left">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-d3-neutral-500">
            <span>DISCOVER SOUND MATERIALS</span>
            <Link
              href="/production"
              className="hover:text-d3-amber transition-colors flex items-center gap-1"
            >
              <span>Browse All Library</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "piano", label: "🎹 Grand Piano", desc: "Acoustic Sampled" },
              { id: "pluck", label: "🪕 Saraswati Veena", desc: "Carnatic Pluck" },
              { id: "tabla", label: "🥁 Classical Tabla", desc: "Indian Bols" },
              { id: "fm", label: "✨ FM Bell Chime", desc: "Digital Resonance" },
              { id: "poly", label: "🎛️ Warm PolySynth", desc: "Subtractive" },
            ].map((item) => (
              <Link
                key={item.id}
                href="/production"
                onClick={() => handleQuickStart(item.id)}
                className="px-3 py-1.5 rounded-lg bg-d3-neutral-900 border border-d3-neutral-700 hover:border-d3-amber/60 text-xs font-medium text-d3-neutral-300 hover:text-d3-paper transition-all flex items-center gap-2 group"
              >
                <span>{item.label}</span>
                <span className="text-[10px] font-mono text-d3-neutral-500 group-hover:text-d3-neutral-400">
                  {item.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
