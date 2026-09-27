"use client";

import React, { useState } from "react";
import { Volume2, Play, Sparkles } from "lucide-react";
import { audioEngine } from "@/lib/audio/engine";
import { useProjectStore } from "@/store/useProjectStore";

export function AudioUnlockOverlay() {
  const isAudioUnlocked = useProjectStore((s) => s.isAudioUnlocked);
  const setAudioUnlocked = useProjectStore((s) => s.setAudioUnlocked);
  const loadPresetMelody = useProjectStore((s) => s.loadPresetMelody);
  const [isActivating, setIsActivating] = useState(false);

  if (isAudioUnlocked) return null;

  const handleUnlock = async () => {
    setIsActivating(true);
    try {
      const ok = await audioEngine.init();
      if (ok) {
        setAudioUnlocked(true);
        loadPresetMelody();
      }
    } catch (err) {
      console.error("Audio unlock error:", err);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div
      onClick={handleUnlock}
      className="fixed inset-0 z-50 flex items-center justify-center bg-d3-ink/90 backdrop-blur-md cursor-pointer transition-all duration-300 select-none"
    >
      <div className="max-w-md w-full mx-4 p-8 rounded-2xl bg-d3-neutral-900 border border-d3-neutral-700 shadow-2xl text-center transform transition-transform hover:scale-[1.01]">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-d3-neutral-850 border border-d3-amber/40 flex items-center justify-center text-d3-amber shadow-inner">
          <Volume2 className="w-7 h-7 animate-pulse" />
        </div>

        <h2 className="font-display text-2xl text-d3-paper mb-2">
          Enter D3 MusiQ
        </h2>

        <p className="text-xs text-d3-neutral-400 mb-6 leading-relaxed">
          Browser audio security requires a single gesture before generating sound. Click anywhere to activate the engine and launch your workspace.
        </p>

        <div className="space-y-3">
          <button
            disabled={isActivating}
            className="w-full py-3.5 px-6 rounded-xl bg-d3-amber hover:bg-d3-paper text-d3-ink font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-d3-amber-glow transition-all active:scale-95 disabled:opacity-50"
          >
            {isActivating ? (
              <span>Initializing Audio Engine...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Initialize Workspace & Load Yaman</span>
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-d3-neutral-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-d3-amber" />
            <span>Mechakalyani / Lydian theory engine ready</span>
          </p>
        </div>
      </div>
    </div>
  );
}
