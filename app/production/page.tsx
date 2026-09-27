"use client";

import React, { useEffect, useState } from "react";
import { TransportBar } from "@/components/TransportBar";
import { LibraryPanel } from "@/components/LibraryPanel";
import { CompositionCanvas } from "@/components/CompositionCanvas";
import { ContextualSuggestion } from "@/components/ContextualSuggestion";
import { AudioUnlockOverlay } from "@/components/AudioUnlockOverlay";
import { useProjectStore } from "@/store/useProjectStore";
import { Search, Sliders } from "lucide-react";

export default function ProductionPage() {
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const setIsPlaying = useProjectStore((s) => s.setIsPlaying);
  const isAudioUnlocked = useProjectStore((s) => s.isAudioUnlocked);

  // Mobile Viewport Switcher: "library" (Find) vs "track" (Combine)
  const [mobileTab, setMobileTab] = useState<"library" | "track">("track");

  // Global spacebar shortcut for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isAudioUnlocked) {
          setIsPlaying(!isPlaying);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isAudioUnlocked, setIsPlaying]);

  return (
    <div className="flex-1 flex flex-col h-full bg-d3-ink relative overflow-hidden select-none">
      {/* Audio Unlock Overlay for Browser Audio Security */}
      <AudioUnlockOverlay />

      {/* Global Studio Console Transport Bar */}
      <TransportBar />

      {/* Mobile Tab Switcher (< md screens) */}
      <div className="md:hidden flex items-center bg-d3-neutral-900 border-b border-d3-neutral-700 p-1 text-xs font-mono">
        <button
          onClick={() => setMobileTab("library")}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "library"
              ? "bg-d3-neutral-800 text-d3-amber font-bold border border-d3-neutral-700"
              : "text-d3-neutral-400 hover:text-d3-paper"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>SOUND LIBRARY</span>
        </button>
        <button
          onClick={() => setMobileTab("track")}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "track"
              ? "bg-d3-neutral-800 text-d3-paper font-bold border border-d3-neutral-700"
              : "text-d3-neutral-400 hover:text-d3-paper"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>YOUR TRACK</span>
        </button>
      </div>

      {/* Main Workspace: Left Library + Central Multi-Layer Composition Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: side-by-side. Mobile: tab-controlled */}
        <div className={`h-full ${mobileTab === "library" ? "block w-full" : "hidden md:block"}`}>
          <LibraryPanel />
        </div>

        <div className={`flex-1 h-full ${mobileTab === "track" ? "block" : "hidden md:block"}`}>
          <CompositionCanvas />
        </div>
      </div>

      {/* D3 Quiet Contextual Suggestions (Behavior, not a destination page) */}
      <ContextualSuggestion />
    </div>
  );
}
