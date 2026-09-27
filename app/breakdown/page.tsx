"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Mic,
  Music,
  ArrowRight,
  ArrowLeft,
  Activity,
  Sliders,
  Play,
  Pause,
  Sparkles,
  Info,
  Loader2,
  Zap,
  Volume2,
  Clock,
  Layers,
  Radio,
  Check,
  Flame,
  ShieldAlert,
  Wind,
  Disc,
} from "lucide-react";
import { AudioAnalyzer, AnalysisResult, MusicalSection, InstrumentSuggestion } from "@/lib/analysis/audio-analyzer";
import { generateDemoYamanAudio } from "@/lib/analysis/demo-audio";
import { useProjectStore } from "@/store/useProjectStore";
import { audioEngine, type InstrumentType } from "@/lib/audio/engine";

export default function BreakdownPage() {
  const router = useRouter();
  const importBreakdownNotes = useProjectStore((s) => s.importBreakdownNotes);
  const setAudioUnlocked = useProjectStore((s) => s.setAudioUnlocked);

  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [targetInstrument, setTargetInstrument] = useState<InstrumentType>("pluck");

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAudioFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAudioFile(file);
    }
  };

  const processAudioFile = async (blobOrFile: Blob) => {
    setIsAnalyzing(true);
    setAnalysisStatus("Decoding audio stream...");

    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blobOrFile);
      setAudioUrl(url);

      const audioBuffer = await AudioAnalyzer.decodeAudio(blobOrFile);

      setAnalysisStatus("Running YIN pitch tracking & onset segmentation...");
      await new Promise((r) => setTimeout(r, 200));

      setAnalysisStatus("Correlating against Raag Yaman & spectral features...");
      const result = await AudioAnalyzer.analyzeAudioBuffer(audioBuffer);

      setAnalysisResult(result);
      setTargetInstrument(result.suggestedInstrument);
    } catch (err) {
      console.error("Audio analysis failed:", err);
      alert("Failed to analyze audio. Please try an uncompressed .wav or standard .mp3 file.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        await processAudioFile(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSecondsLeft(5);

      const interval = setInterval(() => {
        setRecordSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access was denied or is unavailable.");
    }
  };

  const handleAnalyzeDemoClip = async () => {
    setIsAnalyzing(true);
    setAnalysisStatus("Synthesizing Raag Yaman acoustic motif...");

    try {
      const demoBuffer = await generateDemoYamanAudio();
      setAnalysisStatus("Running YIN pitch tracking & swara recognition...");
      await new Promise((r) => setTimeout(r, 250));

      const result = await AudioAnalyzer.analyzeAudioBuffer(demoBuffer);
      setAnalysisResult(result);
      setTargetInstrument(result.suggestedInstrument);
    } catch (err) {
      console.error("Demo clip generation failed:", err);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAuditionNote = (pitch: string) => {
    audioEngine.init().then(() => {
      setAudioUnlocked(true);
      audioEngine.previewNote(pitch, "4n", 0.9, targetInstrument);
    });
  };

  const handleAuditionInstrument = (inst: InstrumentType) => {
    audioEngine.init().then(() => {
      setAudioUnlocked(true);
      audioEngine.previewNote("C4", "4n", 0.9, inst);
    });
  };

  const handleSendToProduction = () => {
    if (!analysisResult) return;

    const notesToImport = analysisResult.detectedNotes.map((dn) => ({
      pitch: dn.pitch,
      step: dn.step ?? 0,
      swara: dn.swara,
      velocity: Math.max(0.6, Math.min(1.0, dn.confidence)),
    }));

    importBreakdownNotes(
      notesToImport,
      analysisResult.estimatedTonic,
      targetInstrument || analysisResult.suggestedInstrument,
      analysisResult.estimatedBpm,
      analysisResult.raagaConfidence >= 65 ? "yaman" : "chromatic"
    );

    setAudioUnlocked(true);
    router.push("/production");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-d3-ink p-4 sm:p-8 flex flex-col items-center select-none selection:bg-d3-amber selection:text-d3-ink">
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlayingAudio(false)}
          className="hidden"
        />
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="max-w-4xl w-full space-y-6 my-auto">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/production"
            className="flex items-center gap-1.5 text-xs font-mono text-d3-neutral-500 hover:text-d3-amber transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO PRODUCTION</span>
          </Link>

          <span className="text-[11px] font-mono uppercase bg-d3-neutral-900 text-d3-amber border border-d3-neutral-700 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>UNDERSTAND · REVERSE ENGINEERING</span>
          </span>
        </div>

        <div>
          <h1 className="font-display font-medium text-3xl sm:text-4xl text-d3-paper tracking-tight">
            Breakdown: Audio & Raaga Analysis
          </h1>
          <p className="text-xs sm:text-sm text-d3-neutral-400 mt-1 leading-relaxed">
            See what’s happening inside music. Upload or record audio to deconstruct swaras, frequencies, and structure, then transfer them into Production.
          </p>
        </div>

        {/* Input Methods Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. File Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? "border-d3-amber bg-d3-amber/10 scale-[1.01]"
                : "border-d3-neutral-700 bg-d3-neutral-900/60 hover:bg-d3-neutral-850 hover:border-d3-neutral-600"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-d3-neutral-850 border border-d3-neutral-700 text-d3-amber flex items-center justify-center mb-2 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm text-d3-paper font-semibold">Upload Audio File</h3>
            <p className="text-[11px] text-d3-neutral-500 mt-0.5">
              Drag & drop .mp3, .wav, .ogg or browse
            </p>
          </div>

          {/* 2. Record from Mic */}
          <div
            onClick={isRecording ? undefined : handleStartRecording}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isRecording
                ? "border-d3-rust bg-d3-rust/10 animate-pulse"
                : "border-d3-neutral-700 bg-d3-neutral-900/60 hover:bg-d3-neutral-850 hover:border-d3-neutral-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-inner ${
                isRecording
                  ? "bg-d3-rust text-d3-paper"
                  : "bg-d3-neutral-850 border border-d3-neutral-700 text-d3-rust"
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm text-d3-paper font-semibold">
              {isRecording ? `Recording (${recordSecondsLeft}s)...` : "Record 5s from Mic"}
            </h3>
            <p className="text-[11px] text-d3-neutral-500 mt-0.5">
              {isRecording ? "Sing or hum a melodic phrase" : "Direct microphone acoustic capture"}
            </p>
          </div>

          {/* 3. Instant Demo Clip */}
          <div
            onClick={isAnalyzing ? undefined : handleAnalyzeDemoClip}
            className="p-6 rounded-2xl border border-d3-neutral-700 bg-d3-neutral-900/60 hover:bg-d3-neutral-850 hover:border-d3-amber/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-d3-neutral-850 border border-d3-neutral-700 text-d3-amber flex items-center justify-center mb-2 shadow-inner group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm text-d3-paper font-semibold">Try Demo Yaman Clip</h3>
            <p className="text-[11px] text-d3-neutral-500 mt-0.5">
              Instant synthetic acoustic phrase (Zero file needed)
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        {isAnalyzing ? (
          <div className="p-8 rounded-2xl bg-d3-neutral-900 border border-d3-neutral-700 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-7 h-7 text-d3-amber animate-spin" />
            <h3 className="font-display text-base text-d3-paper">Analyzing Audio Spectrum</h3>
            <p className="text-xs text-d3-amber font-mono">{analysisStatus}</p>
          </div>
        ) : null}

        {/* Analysis Results Display */}
        {analysisResult && !isAnalyzing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 1. Summary Banner with Tempo, Raaga, Key, & Send to Production CTA */}
            <div className="p-5 rounded-2xl bg-d3-neutral-900 border border-d3-neutral-700 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-d3-neutral-850 border border-d3-amber/40 text-d3-amber flex flex-col items-center justify-center font-mono shadow-inner flex-shrink-0">
                  <span className="text-[10px] text-d3-neutral-500 font-bold uppercase leading-none">TONIC</span>
                  <span className="text-base font-bold text-d3-amber leading-tight">{analysisResult.estimatedTonic}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display font-semibold text-lg text-d3-paper">
                      {analysisResult.estimatedRaaga}
                    </h2>
                    <span className="text-[10px] font-mono font-bold bg-d3-amber/20 text-d3-amber px-2 py-0.5 rounded-full border border-d3-amber/30">
                      {analysisResult.raagaConfidence}% Yaman Match
                    </span>
                    {/* Tempo (BPM) Badge with Pulse */}
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-d3-neutral-800 text-d3-paper px-2 py-0.5 rounded-full border border-d3-neutral-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{analysisResult.estimatedBpm} BPM</span>
                      <span className="text-d3-neutral-500">({analysisResult.bpmConfidence}% pulse)</span>
                    </span>
                  </div>
                  <p className="text-xs text-d3-neutral-400 font-mono mt-1">
                    Mode: <span className="text-d3-paper">{analysisResult.estimatedKey}</span> · Duration: {analysisResult.duration}s · {analysisResult.detectedNotes.length} swaras transcribed
                  </p>
                </div>
              </div>

              {/* Action Button: Send to Production with chosen Target Instrument */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendToProduction}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-d3-amber hover:bg-d3-paper text-d3-ink font-semibold text-xs tracking-wider uppercase shadow-lg shadow-d3-amber-glow transition-all hover:scale-105 active:scale-95"
                >
                  <Sliders className="w-4 h-4" />
                  <span>SEND TO PRODUCTION</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Audio Preview & Waveform Strip */}
            <div className="p-3 rounded-xl bg-d3-neutral-900/60 border border-d3-neutral-700 flex items-center gap-3">
              {audioUrl ? (
                <button
                  onClick={toggleAudioPlayback}
                  className="p-2 rounded-lg bg-d3-amber text-d3-ink hover:bg-d3-paper transition-colors shadow-sm"
                  title={isPlayingAudio ? "Pause audio" : "Play audio"}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
              ) : null}

              {/* Downsampled Waveform Visualizer */}
              <div className="flex-1 h-8 flex items-center gap-0.5 px-2 bg-d3-neutral-950 rounded-lg border border-d3-neutral-800 overflow-hidden">
                {analysisResult.waveformPoints.map((val, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${Math.max(10, val * 100)}%` }}
                    className="flex-1 bg-gradient-to-t from-d3-neutral-600 to-d3-amber/80 rounded-sm"
                  />
                ))}
              </div>

              <div className="text-[10px] font-mono text-d3-neutral-500 whitespace-nowrap">
                {analysisResult.sampleRate / 1000} kHz · 16-bit Web Audio
              </div>
            </div>

            {/* 3. Rough Musical Structure (Form & Energy Timeline) */}
            <div className="p-4 rounded-2xl bg-d3-neutral-900/80 border border-d3-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-d3-amber" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-d3-paper">
                    ROUGH MUSICAL STRUCTURE (FORM & ENERGY TIMELINE)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-d3-neutral-500">
                  Energy flux & note density segmentation
                </span>
              </div>

              {/* Proportional Segment Bar */}
              <div className="h-2 rounded-full bg-d3-neutral-950 flex overflow-hidden border border-d3-neutral-800">
                {analysisResult.roughStructure.map((sec) => (
                  <div
                    key={sec.id}
                    style={{ width: `${(sec.duration / analysisResult.duration) * 100}%` }}
                    className={`h-full transition-all ${
                      sec.label === "intro"
                        ? "bg-sky-500/80"
                        : sec.label === "chorus"
                        ? "bg-d3-amber"
                        : sec.label === "outro"
                        ? "bg-violet-500/80"
                        : "bg-emerald-500/80"
                    }`}
                    title={`${sec.name}: ${sec.startTime}s - ${sec.endTime}s (${sec.energyPercent}% energy)`}
                  />
                ))}
              </div>

              {/* Section Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {analysisResult.roughStructure.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-2.5 rounded-xl bg-d3-neutral-950/70 border border-d3-neutral-800 flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-d3-paper truncate">
                        {sec.name}
                      </span>
                      <span className="text-[9px] font-mono text-d3-neutral-500">
                        {sec.startTime}s – {sec.endTime}s
                      </span>
                    </div>

                    <p className="text-[11px] text-d3-neutral-400 leading-tight">
                      {sec.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-d3-neutral-850 text-[10px] font-mono">
                      <span className="text-d3-amber">{sec.noteCount} {sec.noteCount === 1 ? "swara" : "swaras"}</span>
                      <span className="text-d3-neutral-500">{sec.energyPercent}% energy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Detected Characteristics & Companion Instruments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Detected Timbre Profile & Target Layer */}
              <div className="p-4 rounded-2xl bg-d3-neutral-900/80 border border-d3-neutral-700 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-d3-amber" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-d3-paper">
                      DETECTED ACOUSTIC PROFILE
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-d3-neutral-950 border border-d3-neutral-800 flex items-center justify-between">
                      <span className="text-d3-neutral-500">Pitch Register:</span>
                      <span className="font-bold text-d3-paper">{analysisResult.detectedCharacteristics.pitchRange}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-d3-neutral-950 border border-d3-neutral-800 flex items-center justify-between">
                      <span className="text-d3-neutral-500">Spectral Centroid:</span>
                      <span className="font-bold text-d3-paper">
                        {analysisResult.spectralCentroidHz} Hz · <span className="text-d3-amber">{analysisResult.detectedCharacteristics.brightnessLabel}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-d3-neutral-950 border border-d3-neutral-800 flex items-center justify-between">
                      <span className="text-d3-neutral-500">Harmonic Clarity:</span>
                      <span className="font-bold text-d3-paper">{analysisResult.detectedCharacteristics.harmonicClarity}</span>
                    </div>
                  </div>
                </div>

                {/* Target Instrument Selector for Import */}
                <div className="pt-2 border-t border-d3-neutral-800">
                  <label className="text-[11px] font-mono text-d3-neutral-400 block mb-1.5">
                    Target Layer in Production Workspace:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { id: "pluck", label: "Veena" },
                        { id: "piano", label: "Piano" },
                        { id: "flute", label: "Bansuri" },
                        { id: "violin", label: "Violin" },
                        { id: "guitar", label: "Guitar" },
                        { id: "tabla", label: "Tabla" },
                        { id: "poly", label: "Pad" },
                        { id: "beats", label: "808" },
                      ] as const
                    ).map((inst) => {
                      const isSelected = targetInstrument === inst.id;
                      return (
                        <button
                          key={inst.id}
                          onClick={() => setTargetInstrument(inst.id)}
                          className={`py-1 px-1.5 rounded text-[10px] font-mono font-semibold transition-all border ${
                            isSelected
                              ? "bg-d3-amber text-d3-ink border-d3-amber shadow-sm"
                              : "bg-d3-neutral-950 hover:bg-d3-neutral-800 text-d3-neutral-400 border-d3-neutral-800"
                          }`}
                        >
                          {inst.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Suggested Companion Instruments from Open Sound Library */}
              <div className="p-4 rounded-2xl bg-d3-neutral-900/80 border border-d3-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-d3-amber" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-d3-paper">
                      SUGGESTED COMPANION INSTRUMENTS
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-d3-neutral-500">
                    Open Sound Library
                  </span>
                </div>

                <div className="space-y-2">
                  {analysisResult.suggestedCompanionInstruments.map((comp) => (
                    <div
                      key={comp.name}
                      className="p-2.5 rounded-xl bg-d3-neutral-950/70 border border-d3-neutral-800 flex items-center justify-between gap-2.5 hover:border-d3-neutral-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-d3-paper truncate">
                            {comp.name}
                          </span>
                          <span className="text-[9px] font-mono uppercase bg-d3-neutral-800 text-d3-neutral-400 px-1.5 py-0.5 rounded">
                            {comp.role}
                          </span>
                          <span className="text-[9px] font-mono text-d3-amber">
                            {comp.sampleOrSynth === "real_sample"
                              ? "● Real Sample"
                              : "○ Synth Model"}
                          </span>
                        </div>
                        <p className="text-[10px] text-d3-neutral-400 mt-0.5 leading-tight">
                          {comp.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleAuditionInstrument(comp.instrument)}
                          title={`Audition ${comp.name}`}
                          className="p-1.5 rounded-lg bg-d3-neutral-850 hover:bg-d3-neutral-800 text-d3-neutral-400 hover:text-d3-amber border border-d3-neutral-700 transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTargetInstrument(comp.instrument)}
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-colors border ${
                            targetInstrument === comp.instrument
                              ? "bg-d3-amber/20 border-d3-amber text-d3-amber font-bold"
                              : "bg-d3-neutral-850 hover:bg-d3-neutral-800 border-d3-neutral-700 text-d3-neutral-400"
                          }`}
                        >
                          {targetInstrument === comp.instrument ? "Selected" : "Set Target"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Transcribed Note Chips */}
            <div className="p-4 rounded-2xl bg-d3-neutral-900/80 border border-d3-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-d3-amber" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-d3-paper">
                    TRANSCRIBED SWARAS & NOTES
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-d3-neutral-500">
                  Click any note to audition with {targetInstrument.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {analysisResult.detectedNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleAuditionNote(n.pitch)}
                    title={`Audition ${n.pitch} (${n.frequency} Hz)`}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 text-left ${
                      n.isYamanNote
                        ? "bg-d3-amber/15 border-d3-amber/40 text-d3-paper hover:bg-d3-amber/25"
                        : "bg-d3-neutral-950/60 border-d3-neutral-700 text-d3-neutral-400 hover:bg-d3-neutral-800"
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-d3-neutral-950 border border-d3-neutral-700 flex flex-col items-center justify-center">
                      <span className="text-xs font-mono font-bold text-d3-amber leading-none">
                        {n.swara || "—"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-d3-paper">{n.pitch}</span>
                        <Volume2 className="w-3 h-3 text-d3-neutral-500" />
                      </div>
                      <div className="text-[9px] font-mono text-d3-neutral-500">
                        @{n.startTime}s · {n.duration}s
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 6. Honest Approximation Notice */}
              <div className="p-3 rounded-xl bg-d3-neutral-950/60 border border-d3-neutral-800 space-y-1 text-[11px] text-d3-neutral-400 font-mono">
                <div className="flex items-center gap-1.5 text-d3-amber font-semibold">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Honest Signal Analysis Notice (Phase 4):</span>
                </div>
                <p className="leading-relaxed text-d3-neutral-500">
                  • <strong>Monophonic YIN Tracking:</strong> Optimized for solo vocal lines, bansuri, violin, and veena. Polyphonic chords are reduced to predominant fundamental pitch.<br />
                  • <strong>Raaga Alignment:</strong> Transcriptions are evaluated against Raag Yaman / Mechakalyani intervals. Microtonal shruti slides are mapped to closest tempered swaras.<br />
                  • <strong>The Human Remains the Musician:</strong> This breakdown provides starting raw musical materials. Clicking &quot;Send to Production&quot; transfers notes and detected tempo into your composition workspace.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
