"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  Music,
  Download,
  Upload,
  Save,
  FolderOpen,
  Loader2,
  Check,
  Mic,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { audioEngine, type InstrumentType } from "@/lib/audio/engine";
import { LIBRARY_INSTRUMENTS } from "@/lib/library/instruments";
import { exportCompositionToWav } from "@/lib/audio/export";

const TONIC_OPTIONS = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];

export function TransportBar() {
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const setIsPlaying = useProjectStore((s) => s.setIsPlaying);
  const bpm = useProjectStore((s) => s.bpm);
  const setBpm = useProjectStore((s) => s.setBpm);
  const masterVolume = useProjectStore((s) => s.masterVolume);
  const setMasterVolume = useProjectStore((s) => s.setMasterVolume);
  const instrument = useProjectStore((s) => s.instrument);
  const tracks = useProjectStore((s) => s.tracks);
  const activeTrackId = useProjectStore((s) => s.activeTrackId);
  const setInstrument = useProjectStore((s) => s.setInstrument);
  const isSampleLoading = useProjectStore((s) => s.isSampleLoading);
  const loadingInstrument = useProjectStore((s) => s.loadingInstrument);
  const currentScale = useProjectStore((s) => s.currentScale);
  const setScale = useProjectStore((s) => s.setScale);
  const tonic = useProjectStore((s) => s.tonic);
  const setTonic = useProjectStore((s) => s.setTonic);
  const isAudioUnlocked = useProjectStore((s) => s.isAudioUnlocked);
  const loadPresetMelody = useProjectStore((s) => s.loadPresetMelody);
  const clearNotes = useProjectStore((s) => s.clearNotes);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  // Persistence
  const saveToLocalStorage = useProjectStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = useProjectStore((s) => s.loadFromLocalStorage);
  const exportProjectJSON = useProjectStore((s) => s.exportProjectJSON);
  const importProjectJSON = useProjectStore((s) => s.importProjectJSON);

  const setTrackAudioBlob = useProjectStore((s) => s.setTrackAudioBlob);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2400);
  };

  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) return;
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  const handleToggleRecord = async () => {
    if (!isRecordingMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(audioBlob);
          setTrackAudioBlob("voice", url);
          showToast("Vocal performance saved to Voice track!");
        };

        recorder.start();
        setIsRecordingMic(true);
        if (!isPlaying) {
          setIsPlaying(true);
        }
        showToast("Live microphone armed • Recording alongside loop");
      } catch (err) {
        console.error("Microphone recording error:", err);
        showToast("Microphone access unavailable");
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingMic(false);
    }
  };

  const handleExportWAV = async () => {
    if (isExportingWav) return;
    try {
      setIsExportingWav(true);
      showToast("Rendering 16-bit uncompressed WAV mix...");
      const wavBlob = await exportCompositionToWav(tracks, bpm, 2);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `d3_musiq_${tonic}_${bpm}bpm_mix.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Downloaded " + link.download);
    } catch (err) {
      console.error("WAV Export error:", err);
      showToast("WAV export failed");
    } finally {
      setIsExportingWav(false);
    }
  };

  const handleQuickSave = () => {
    const ok = saveToLocalStorage();
    if (ok) showToast("Saved to browser storage");
  };

  const handleQuickLoad = () => {
    const ok = loadFromLocalStorage();
    if (ok) showToast("Pattern loaded");
    else showToast("No saved pattern found");
  };

  const handleExportJSON = () => {
    const jsonStr = exportProjectJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `d3_musiq_${tonic}_${bpm}bpm.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded .json file");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importProjectJSON(content);
        if (ok) showToast("Pattern imported successfully");
        else showToast("Invalid project file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <header className="w-full bg-d3-neutral-900 border-b border-d3-neutral-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Left: Playback, Stop & Live Record */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTogglePlay}
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold text-xs tracking-wide transition-all shadow-sm ${
            isPlaying
              ? "bg-d3-amber hover:bg-d3-paper text-d3-ink shadow-d3-amber-glow"
              : "bg-d3-paper hover:bg-white text-d3-ink"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              <span>PLAY</span>
            </>
          )}
        </button>

        <button
          onClick={handleStop}
          title="Stop & Rewind to Step 0"
          className="p-1.5 rounded-lg bg-d3-neutral-800 hover:bg-d3-neutral-700 text-d3-neutral-400 hover:text-d3-paper border border-d3-neutral-700 transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Live Vocal / Mic Record Toggle */}
        <button
          onClick={handleToggleRecord}
          title="Record live vocals alongside your loop"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all border ${
            isRecordingMic
              ? "bg-d3-rust text-d3-paper border-red-500 animate-pulse"
              : "bg-d3-neutral-950/60 hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-rust border-d3-neutral-700"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">REC</span>
        </button>

        <div className="h-4 w-px bg-d3-neutral-700 mx-1" />

        {/* BPM Stepper */}
        <div className="flex items-center gap-2 bg-d3-neutral-950 border border-d3-neutral-700 rounded-lg px-2.5 py-1">
          <span className="text-[10px] font-mono font-semibold uppercase text-d3-neutral-500">
            BPM
          </span>
          <input
            type="number"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-9 bg-transparent text-xs font-mono font-bold text-d3-paper text-right focus:outline-none"
          />
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-12 h-1 bg-d3-neutral-700 rounded appearance-none cursor-pointer accent-d3-amber"
          />
        </div>
      </div>

      {/* Middle: Raaga & Tonic (Carnatic ↔ Western Bridge) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-d3-neutral-950 border border-d3-neutral-700 rounded-lg p-0.5">
          <div className="flex items-center gap-1 px-1.5 text-xs font-semibold text-d3-amber">
            <Music className="w-3 h-3" />
            <span className="hidden sm:inline">Raaga:</span>
          </div>
          <button
            onClick={() => setScale("yaman")}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
              currentScale === "yaman"
                ? "bg-d3-amber/20 border border-d3-amber/40 text-d3-amber font-semibold"
                : "text-d3-neutral-400 hover:text-d3-paper"
            }`}
          >
            Yaman
          </button>
          <button
            onClick={() => setScale("chromatic")}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
              currentScale === "chromatic"
                ? "bg-d3-neutral-800 border border-d3-neutral-700 text-d3-paper font-semibold"
                : "text-d3-neutral-400 hover:text-d3-paper"
            }`}
          >
            Chromatic
          </button>
        </div>

        {/* Tonic Selector */}
        <div className="flex items-center gap-1 bg-d3-neutral-950 border border-d3-neutral-700 rounded-lg px-2 py-1">
          <span className="text-xs font-mono text-d3-neutral-500">Tonic:</span>
          <select
            value={tonic}
            onChange={(e) => setTonic(e.target.value)}
            className="bg-transparent text-xs font-mono font-bold text-d3-amber focus:outline-none cursor-pointer"
          >
            {TONIC_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-d3-neutral-900 text-d3-paper">
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Master Volume, Quick Save, Load, Clear */}
      <div className="flex items-center gap-2">
        {/* Active Instrument Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-d3-neutral-400 bg-d3-neutral-950 border border-d3-neutral-700 px-2 py-1 rounded-lg">
          <span className="text-d3-neutral-500">LAYER:</span>
          <span className="text-d3-paper font-semibold truncate max-w-[120px]">
            {activeTrack?.name || instrument}
          </span>
          {isSampleLoading && loadingInstrument === instrument ? (
            <Loader2 className="w-3 h-3 text-d3-amber animate-spin ml-1" />
          ) : null}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-1.5 bg-d3-neutral-950 border border-d3-neutral-700 rounded-lg px-2 py-1">
          {masterVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-d3-neutral-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-d3-neutral-400" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-12 h-1 bg-d3-neutral-700 rounded appearance-none cursor-pointer accent-d3-amber"
            title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
          />
        </div>

        {/* Persistence Controls */}
        <div className="flex items-center gap-0.5 bg-d3-neutral-950 border border-d3-neutral-700 rounded-lg p-0.5">
          <button
            onClick={handleQuickSave}
            title="Quick save to browser storage"
            className="p-1.5 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-amber transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleQuickLoad}
            title="Quick load from browser storage"
            className="p-1.5 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-amber transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportWAV}
            disabled={isExportingWav}
            title="Export 16-bit uncompressed WAV mix"
            className="px-2 py-1 rounded hover:bg-d3-neutral-800 text-d3-amber hover:text-d3-paper transition-colors flex items-center gap-1 text-[11px] font-mono border border-d3-amber/30"
          >
            {isExportingWav ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-d3-amber" />
            ) : (
              <Download className="w-3.5 h-3.5 text-d3-amber" />
            )}
            <span className="font-bold">WAV</span>
          </button>
          <button
            onClick={handleExportJSON}
            title="Export pattern as .json file"
            className="p-1.5 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import pattern from .json file"
            className="p-1.5 rounded hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-paper transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clear Canvas */}
        <button
          onClick={clearNotes}
          title="Clear all placed notes"
          className="p-1.5 rounded-lg bg-d3-neutral-950 hover:bg-d3-rust/20 hover:text-d3-rust text-d3-neutral-500 border border-d3-neutral-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Save/Status Toast */}
      {saveToast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-d3-neutral-900 border border-d3-amber/40 text-d3-amber text-xs font-mono px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-3.5 h-3.5 text-d3-amber" />
          <span>{saveToast}</span>
        </div>
      ) : null}
    </header>
  );
}
