/**
 * Zustand Store for D3 MusiQ
 * 
 * Manages serializable project state:
 * - Multi-layer horizontal arrangement tracks (Piano, Veena, Tabla, Atmosphere, Flute, Voice, etc.)
 * - Direct "FIND -> HEAR -> ADD -> COMBINE -> CREATE" library integration
 * - Layer volume faders, mute, solo, and layer notes
 * - Transport (BPM, play/pause, volume)
 * - Active raaga/scale & tonic transposition
 * - 16-step note grid with velocity & multi-selection
 * - Secondary / contextual note editor state
 * - Project persistence (localStorage + JSON import/export)
 * 
 * Rules:
 * - Never store live Tone.js objects here.
 * - All state must be strictly JSON serializable.
 */

import { create } from "zustand";
import { audioEngine, type InstrumentType, type ScheduledNote } from "@/lib/audio/engine";
import {
  yamanToMidi,
  midiToPitchName,
  getTonicMidi,
  tryNormalizeSwara,
  type CanonicalYamanSwara,
} from "@/lib/theory/carnatic";
import { YAMAN_PRESET_MELODY } from "@/lib/library/library-data";
import { MusicalStyle, InstrumentCategory, type SoundAsset } from "@/lib/library/types";

export interface ProjectNote {
  id: string;
  pitch: string;
  swara?: CanonicalYamanSwara;
  bol?: string;
  step: number; // 0 to 15
  duration: number; // in 16th notes
  velocity: number; // 0.1 to 1.0 (default 0.85)
}

export interface ProjectTrack {
  id: string;
  name: string;
  type: string;
  instrument: InstrumentType;
  volume: number; // 0.0 to 1.0
  muted: boolean;
  solo: boolean;
  isAudioTrack?: boolean;
  audioBlobUrl?: string;
  notes: ProjectNote[];
}

export interface SerializableProjectData {
  version: string;
  name: string;
  savedAt: string;
  bpm: number;
  masterVolume: number;
  currentScale: "yaman" | "chromatic";
  tonic: string;
  instrument: InstrumentType;
  activeTrackId?: string;
  loopLength: number;
  tracks?: ProjectTrack[];
  notes: ProjectNote[];
}

const LOCAL_STORAGE_KEY = "d3_musiq_project_backup";

const DEFAULT_INITIAL_TRACKS: ProjectTrack[] = [
  {
    id: "piano",
    name: "Concert Grand Piano",
    type: "Melodic Keys",
    instrument: "piano",
    volume: 0.85,
    muted: false,
    solo: false,
    notes: [
      { id: "piano-1", pitch: "C4", swara: "S", step: 0, duration: 2, velocity: 0.8 },
      { id: "piano-2", pitch: "E4", swara: "G3", step: 4, duration: 2, velocity: 0.85 },
      { id: "piano-3", pitch: "G4", swara: "P", step: 8, duration: 2, velocity: 0.9 },
      { id: "piano-4", pitch: "B4", swara: "N3", step: 12, duration: 2, velocity: 0.85 },
    ],
  },
  {
    id: "pluck",
    name: "Saraswati Veena",
    type: "Carnatic Strings",
    instrument: "pluck",
    volume: 0.9,
    muted: false,
    solo: false,
    notes: [
      { id: "veena-1", pitch: "E4", swara: "G3", step: 2, duration: 2, velocity: 0.85 },
      { id: "veena-2", pitch: "F#4", swara: "M2", step: 4, duration: 2, velocity: 0.95 },
      { id: "veena-3", pitch: "G4", swara: "P", step: 6, duration: 4, velocity: 0.9 },
      { id: "veena-4", pitch: "A4", swara: "D2", step: 10, duration: 2, velocity: 0.8 },
      { id: "veena-5", pitch: "B4", swara: "N3", step: 12, duration: 2, velocity: 0.9 },
      { id: "veena-6", pitch: "C5", swara: "S'", step: 14, duration: 2, velocity: 0.95 },
    ],
  },
  {
    id: "tabla",
    name: "Classical Tabla",
    type: "Rhythm Bols",
    instrument: "tabla",
    volume: 0.85,
    muted: false,
    solo: false,
    notes: [
      { id: "tabla-1", pitch: "C4", bol: "Dha", step: 0, duration: 1, velocity: 0.9 },
      { id: "tabla-2", pitch: "D4", bol: "Dhin", step: 2, duration: 1, velocity: 0.8 },
      { id: "tabla-3", pitch: "D4", bol: "Dhin", step: 4, duration: 1, velocity: 0.8 },
      { id: "tabla-4", pitch: "C4", bol: "Dha", step: 6, duration: 1, velocity: 0.9 },
      { id: "tabla-5", pitch: "C4", bol: "Dha", step: 8, duration: 1, velocity: 0.9 },
      { id: "tabla-6", pitch: "D4", bol: "Dhin", step: 10, duration: 1, velocity: 0.8 },
      { id: "tabla-7", pitch: "D4", bol: "Dhin", step: 12, duration: 1, velocity: 0.8 },
      { id: "tabla-8", pitch: "C4", bol: "Dha", step: 14, duration: 1, velocity: 0.9 },
    ],
  },
  {
    id: "poly",
    name: "Atmospheric Pad",
    type: "Analog Texture",
    instrument: "poly",
    volume: 0.65,
    muted: false,
    solo: false,
    notes: [
      { id: "poly-1", pitch: "C4", swara: "S", step: 0, duration: 16, velocity: 0.6 },
      { id: "poly-2", pitch: "G4", swara: "P", step: 0, duration: 16, velocity: 0.55 },
    ],
  },
  {
    id: "flute",
    name: "Bansuri Flute",
    type: "Breathy Woodwind",
    instrument: "flute",
    volume: 0.85,
    muted: false,
    solo: false,
    notes: [
      { id: "flute-1", pitch: "E4", swara: "G3", step: 4, duration: 2, velocity: 0.8 },
      { id: "flute-2", pitch: "F#4", swara: "M2", step: 6, duration: 2, velocity: 0.85 },
      { id: "flute-3", pitch: "G4", swara: "P", step: 8, duration: 4, velocity: 0.9 },
    ],
  },
  {
    id: "voice",
    name: "Voice / Mic",
    type: "Live Acoustic Audio",
    instrument: "pluck",
    volume: 0.8,
    muted: false,
    solo: false,
    isAudioTrack: true,
    notes: [],
  },
];

/**
 * Compiles all tracks' notes into a flat list of ScheduledNote for the audio engine,
 * respecting Mute and Solo states.
 */
function compileScheduledNotes(tracks: ProjectTrack[]): ScheduledNote[] {
  const hasSolo = tracks.some((t) => t.solo);
  const scheduled: ScheduledNote[] = [];

  for (const track of tracks) {
    if (track.isAudioTrack) continue;
    const isMuted = hasSolo ? !track.solo : track.muted;
    if (isMuted) continue;

    for (const n of track.notes) {
      scheduled.push({
        id: n.id,
        pitch: n.pitch,
        swara: n.swara,
        step: n.step,
        duration: n.duration,
        velocity: (n.velocity ?? 0.85) * (track.volume ?? 1),
        instrument: track.instrument,
        trackId: track.id,
      });
    }
  }

  return scheduled;
}

export interface ProjectState {
  // Audio & Transport
  isAudioUnlocked: boolean;
  isPlaying: boolean;
  bpm: number;
  masterVolume: number;
  currentStep: number;
  activeNoteIds: string[];

  // Instrument Loading
  isSampleLoading: boolean;
  loadingInstrument: string | null;

  // Configuration
  currentScale: "yaman" | "chromatic";
  tonic: string; // e.g. "C4", "D4"
  instrument: InstrumentType; // Active instrument (matches active track)
  loopLength: number;

  // Multi-Track Layers Architecture
  tracks: ProjectTrack[];
  activeTrackId: string;
  isEditorOpen: boolean; // Controls whether the secondary Note Editor is open

  // Active track's notes (kept in sync for PianoRoll backwards compatibility)
  notes: ProjectNote[];
  selectedNoteIds: string[];

  // Library View Filter
  selectedStyle: MusicalStyle | "all";
  selectedCategory: InstrumentCategory | "all";

  // Actions
  setAudioUnlocked: (unlocked: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentStep: (step: number) => void;
  setActiveNoteIds: (ids: string[]) => void;
  setBpm: (bpm: number) => void;
  setMasterVolume: (volume: number) => void;
  setInstrument: (inst: InstrumentType) => void;
  setScale: (scale: "yaman" | "chromatic") => void;
  setTonic: (tonic: string) => void;
  setSampleLoading: (instrument: string | null, isLoading: boolean) => void;
  setEditorOpen: (open: boolean) => void;

  // Track Actions
  setActiveTrack: (trackId: string) => void;
  addTrack: (track: {
    name: string;
    type: string;
    instrument: InstrumentType;
    notes?: Array<Omit<ProjectNote, "id" | "swara"> & { id?: string; swara?: string; bol?: string }>;
  }) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (startIndex: number, endIndex: number) => void;
  setTrackAudioBlob: (trackId: string, url: string | undefined) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  clearTrackNotes: (trackId: string) => void;
  addPhraseToTrack: (
    trackId: string,
    phraseNotes: Array<{ step: number; pitch: string; swara?: string; bol?: string; duration?: number; velocity?: number }>
  ) => void;
  addAssetTrack: (asset: SoundAsset) => void;
  swapTrackAsset: (trackId: string, newAsset: SoundAsset) => void;

  // Library Filters
  setSelectedStyle: (style: MusicalStyle | "all") => void;
  setSelectedCategory: (cat: InstrumentCategory | "all") => void;

  // Note actions on active track
  addNote: (note: Omit<ProjectNote, "id" | "swara"> & { swara?: string; bol?: string }) => void;
  removeNote: (id: string) => void;
  toggleNote: (pitch: string, step: number, swara?: string, velocity?: number, bol?: string) => void;
  clearNotes: () => void;
  loadPresetMelody: () => void;

  // Multi-select & Batch Edit Actions
  selectNote: (id: string, isMulti?: boolean) => void;
  selectAllNotes: () => void;
  deselectAllNotes: () => void;
  deleteSelectedNotes: () => void;
  moveSelectedNotes: (stepDelta: number) => void;
  setSelectedNotesVelocity: (velocity: number) => void;

  // Project Persistence
  saveToLocalStorage: () => boolean;
  loadFromLocalStorage: () => boolean;
  hasSavedProject: () => boolean;
  exportProjectJSON: () => string;
  importProjectJSON: (jsonString: string) => boolean;

  // Breakdown Import
  importBreakdownNotes: (
    notes: Array<{ pitch: string; step: number; swara?: string; velocity?: number }>,
    tonic?: string,
    instrument?: InstrumentType,
    bpm?: number,
    scale?: "yaman" | "chromatic"
  ) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const initialTracks = DEFAULT_INITIAL_TRACKS;
  const initialActiveTrack = initialTracks[1]; // Veena as active pluck lead

  return {
    isAudioUnlocked: false,
    isPlaying: false,
    bpm: 110,
    masterVolume: 0.85,
    currentStep: 0,
    activeNoteIds: [],

    isSampleLoading: false,
    loadingInstrument: null,

    currentScale: "yaman",
    tonic: "C4",
    instrument: initialActiveTrack.instrument,
    loopLength: 16,

    tracks: initialTracks,
    activeTrackId: initialActiveTrack.id,
    isEditorOpen: false, // Collapsed by default so users focus on discovering and layering

    notes: initialActiveTrack.notes,
    selectedNoteIds: [],

    selectedStyle: "all",
    selectedCategory: "all",

    setAudioUnlocked: (unlocked: boolean) => set({ isAudioUnlocked: unlocked }),

    setIsPlaying: (isPlaying: boolean) => {
      set({ isPlaying });
      if (isPlaying) {
        audioEngine.start();
      } else {
        audioEngine.pause();
      }
    },

    setCurrentStep: (currentStep: number) => set({ currentStep }),

    setActiveNoteIds: (activeNoteIds: string[]) => set({ activeNoteIds }),

    setBpm: (bpm: number) => {
      const clamped = Math.max(60, Math.min(180, bpm));
      set({ bpm: clamped });
      audioEngine.setBPM(clamped);
    },

    setMasterVolume: (masterVolume: number) => {
      const clamped = Math.max(0, Math.min(1, masterVolume));
      set({ masterVolume: clamped });
      audioEngine.setVolume(clamped);
    },

    setEditorOpen: (isEditorOpen: boolean) => set({ isEditorOpen }),

    setInstrument: (instrument: InstrumentType) => {
      const { tracks, activeTrackId } = get();
      // Update active track instrument
      const updatedTracks = tracks.map((t) =>
        t.id === activeTrackId ? { ...t, instrument } : t
      );
      set({ instrument, tracks: updatedTracks });
      audioEngine.setInstrument(instrument);
      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    setScale: (currentScale: "yaman" | "chromatic") => {
      set({ currentScale });
    },

    setSampleLoading: (instrument: string | null, isLoading: boolean) => {
      set({
        isSampleLoading: isLoading,
        loadingInstrument: isLoading ? instrument : null,
      });
    },

    setSelectedStyle: (selectedStyle: MusicalStyle | "all") => set({ selectedStyle }),

    setSelectedCategory: (selectedCategory: InstrumentCategory | "all") => set({ selectedCategory }),

    // Track Management Actions
    setActiveTrack: (trackId: string) => {
      const track = get().tracks.find((t) => t.id === trackId);
      if (!track) return;
      set({
        activeTrackId: trackId,
        instrument: track.instrument,
        notes: track.notes,
        selectedNoteIds: [],
      });
      audioEngine.setInstrument(track.instrument);
    },

    addTrack: (trackData) => {
      const newId = `track-${Date.now()}`;
      const isPercussion = trackData.instrument === "tabla" || trackData.instrument === "beats";
      const normalizedNotes: ProjectNote[] = (trackData.notes || []).map((n, idx) => {
        const canonical = n.swara ? tryNormalizeSwara(n.swara) : null;
        return {
          ...n,
          id: n.id || `track-note-${Date.now()}-${idx}`,
          swara: !isPercussion && canonical ? canonical : undefined,
          bol: n.bol || (isPercussion && n.swara ? n.swara : undefined),
        };
      });

      const newTrack: ProjectTrack = {
        id: newId,
        name: trackData.name,
        type: trackData.type,
        instrument: trackData.instrument,
        volume: 0.85,
        muted: false,
        solo: false,
        notes: normalizedNotes,
      };
      const updated = [...get().tracks, newTrack];
      set({
        tracks: updated,
        activeTrackId: newId,
        instrument: newTrack.instrument,
        notes: newTrack.notes,
      });
      audioEngine.setInstrument(newTrack.instrument);
      audioEngine.scheduleNotes(compileScheduledNotes(updated));
    },

    removeTrack: (trackId: string) => {
      const remaining = get().tracks.filter((t) => t.id !== trackId);
      if (remaining.length === 0) return;
      const nextActive = remaining[0];
      set({
        tracks: remaining,
        activeTrackId: nextActive.id,
        instrument: nextActive.instrument,
        notes: nextActive.notes,
      });
      audioEngine.scheduleNotes(compileScheduledNotes(remaining));
    },

    reorderTracks: (startIndex: number, endIndex: number) => {
      const tracks = [...get().tracks];
      const [removed] = tracks.splice(startIndex, 1);
      tracks.splice(endIndex, 0, removed);
      set({ tracks });
    },

    setTrackAudioBlob: (trackId: string, url: string | undefined) => {
      const updated = get().tracks.map((t) =>
        t.id === trackId ? { ...t, audioBlobUrl: url } : t
      );
      set({ tracks: updated });
    },

    toggleTrackMute: (trackId: string) => {
      const updated = get().tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      );
      set({ tracks: updated });
      audioEngine.scheduleNotes(compileScheduledNotes(updated));
    },

    toggleTrackSolo: (trackId: string) => {
      const updated = get().tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      );
      set({ tracks: updated });
      audioEngine.scheduleNotes(compileScheduledNotes(updated));
    },

    setTrackVolume: (trackId: string, volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      const updated = get().tracks.map((t) =>
        t.id === trackId ? { ...t, volume: clamped } : t
      );
      set({ tracks: updated });
      audioEngine.scheduleNotes(compileScheduledNotes(updated));
    },

    clearTrackNotes: (trackId: string) => {
      const updated = get().tracks.map((t) =>
        t.id === trackId ? { ...t, notes: [] } : t
      );
      const activeNotes = trackId === get().activeTrackId ? [] : get().notes;
      set({ tracks: updated, notes: activeNotes });
      audioEngine.scheduleNotes(compileScheduledNotes(updated));
    },

    addPhraseToTrack: (trackId: string, phraseNotes) => {
      const targetTrack = get().tracks.find((t) => t.id === trackId);
      if (!targetTrack) return;

      const isPercussion = targetTrack.instrument === "tabla" || targetTrack.instrument === "beats";

      const newNotes: ProjectNote[] = phraseNotes.map((pn, idx) => {
        const canonical = pn.swara ? tryNormalizeSwara(pn.swara) : null;
        const bol = pn.bol || (isPercussion && pn.swara ? pn.swara : undefined);
        return {
          id: `phrase-${pn.pitch}-${pn.step}-${Date.now()}-${idx}`,
          pitch: pn.pitch,
          swara: !isPercussion && canonical ? canonical : undefined,
          bol,
          step: pn.step,
          duration: pn.duration || 1,
          velocity: pn.velocity || 0.85,
        };
      });

      // Overwrite or blend: if steps clash, remove conflicting note
      const filteredExisting = targetTrack.notes.filter(
        (en) => !newNotes.some((nn) => nn.step === en.step && nn.pitch === en.pitch)
      );
      const updatedTrackNotes = [...filteredExisting, ...newNotes];

      const updatedTracks = get().tracks.map((t) =>
        t.id === trackId ? { ...t, notes: updatedTrackNotes } : t
      );

      set({
        tracks: updatedTracks,
        notes: trackId === get().activeTrackId ? updatedTrackNotes : get().notes,
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    addAssetTrack: (asset: SoundAsset) => {
      const newId = `track-${Date.now()}`;
      const instType = asset.instrumentId as InstrumentType;
      const isPercussion = instType === "tabla" || instType === "beats";
      const tonic = get().tonic;

      const normalizedNotes: ProjectNote[] = asset.musicalInfo.stepNotes.map((sn, idx) => {
        const canonical = sn.swara ? tryNormalizeSwara(sn.swara) : null;
        let pitch = sn.note || "C4";
        if (canonical && !isPercussion) {
          const midi = yamanToMidi(tonic, canonical);
          pitch = midiToPitchName(midi);
        }
        let duration = 2;
        if (typeof sn.duration === "number") {
          duration = sn.duration;
        } else if (typeof sn.duration === "string") {
          if (sn.duration === "1m" || sn.duration === "1n") duration = 16;
          else if (sn.duration === "2n") duration = 8;
          else if (sn.duration === "4n") duration = 4;
          else if (sn.duration === "8n") duration = 2;
          else if (sn.duration === "16n") duration = 1;
        }

        return {
          id: `asset-note-${Date.now()}-${idx}`,
          pitch,
          swara: !isPercussion && canonical ? canonical : undefined,
          bol: sn.bol || (isPercussion && sn.swara ? (sn.swara as string) : undefined),
          step: sn.step,
          duration,
          velocity: sn.velocity ?? 0.85,
        };
      });

      const newTrack: ProjectTrack = {
        id: newId,
        name: asset.name,
        type: `${asset.materialType.toUpperCase()} · ${asset.tags.moods[0] || asset.instrumentFamily}`,
        instrument: instType,
        volume: asset.materialType === "drone" || asset.materialType === "texture" ? 0.65 : 0.85,
        muted: false,
        solo: false,
        notes: normalizedNotes,
      };

      const updated = [...get().tracks, newTrack];
      set({
        tracks: updated,
        activeTrackId: newId,
        instrument: newTrack.instrument,
        notes: newTrack.notes,
      });
      audioEngine.setInstrument(newTrack.instrument);
      audioEngine.scheduleNotes(compileScheduledNotes(updated));
    },

    swapTrackAsset: (trackId: string, newAsset: SoundAsset) => {
      const existingTrack = get().tracks.find((t) => t.id === trackId);
      if (!existingTrack) return;

      const instType = newAsset.instrumentId as InstrumentType;
      const isPercussion = instType === "tabla" || instType === "beats";
      const tonic = get().tonic;

      const newNotes: ProjectNote[] = newAsset.musicalInfo.stepNotes.map((sn, idx) => {
        const canonical = sn.swara ? tryNormalizeSwara(sn.swara) : null;
        let pitch = sn.note || "C4";
        if (canonical && !isPercussion) {
          const midi = yamanToMidi(tonic, canonical);
          pitch = midiToPitchName(midi);
        }
        let duration = 2;
        if (typeof sn.duration === "number") {
          duration = sn.duration;
        } else if (typeof sn.duration === "string") {
          if (sn.duration === "1m" || sn.duration === "1n") duration = 16;
          else if (sn.duration === "2n") duration = 8;
          else if (sn.duration === "4n") duration = 4;
          else if (sn.duration === "8n") duration = 2;
          else if (sn.duration === "16n") duration = 1;
        }

        return {
          id: `swap-note-${Date.now()}-${idx}`,
          pitch,
          swara: !isPercussion && canonical ? canonical : undefined,
          bol: sn.bol || (isPercussion && sn.swara ? (sn.swara as string) : undefined),
          step: sn.step,
          duration,
          velocity: sn.velocity ?? 0.85,
        };
      });

      const updatedTracks = get().tracks.map((t) => {
        if (t.id === trackId) {
          return {
            ...t,
            name: newAsset.name,
            type: `${newAsset.materialType.toUpperCase()} · ${newAsset.tags.moods[0] || newAsset.instrumentFamily}`,
            instrument: instType,
            notes: newNotes,
            // Preserves existing volume, muted, solo, etc.!
          };
        }
        return t;
      });

      const isActive = trackId === get().activeTrackId;
      set({
        tracks: updatedTracks,
        notes: isActive ? newNotes : get().notes,
        instrument: isActive ? instType : get().instrument,
      });

      if (isActive) {
        audioEngine.setInstrument(instType);
      }
      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    setTonic: (tonic: string) => {
      const prevTonic = get().tonic;
      if (prevTonic === tonic) return;

      // Transpose notes across melodic tracks only (percussion & audio tracks must never be pitch-transposed)
      const transposedTracks = get().tracks.map((track) => {
        if (track.instrument === "tabla" || track.instrument === "beats" || track.isAudioTrack) {
          return track;
        }
        const transposedNotes = track.notes.map((note) => {
          if (note.swara) {
            const canonical = tryNormalizeSwara(note.swara);
            if (canonical) {
              const midi = yamanToMidi(tonic, canonical);
              return {
                ...note,
                swara: canonical,
                pitch: midiToPitchName(midi),
              };
            }
          }
          return note;
        });
        return { ...track, notes: transposedNotes };
      });

      const activeTrack = transposedTracks.find((t) => t.id === get().activeTrackId);

      set({
        tonic,
        tracks: transposedTracks,
        notes: activeTrack ? activeTrack.notes : [],
      });

      audioEngine.scheduleNotes(compileScheduledNotes(transposedTracks));
    },

    // Note operations on active track
    addNote: (noteData) => {
      const { activeTrackId, tracks } = get();
      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      const isPercussion = activeTrack
        ? activeTrack.instrument === "tabla" || activeTrack.instrument === "beats"
        : false;

      const canonical = noteData.swara ? tryNormalizeSwara(noteData.swara) : null;
      const id = `${noteData.pitch}-${noteData.step}-${Date.now()}`;
      const newNote: ProjectNote = {
        ...noteData,
        id,
        swara: !isPercussion && canonical ? canonical : undefined,
        bol: noteData.bol || (isPercussion && noteData.swara ? noteData.swara : undefined),
        velocity: noteData.velocity ?? 0.85,
      };

      const updatedTracks = tracks.map((track) => {
        if (track.id === activeTrackId) {
          return { ...track, notes: [...track.notes, newNote] };
        }
        return track;
      });

      const updatedActiveTrack = updatedTracks.find((t) => t.id === activeTrackId);

      set({
        tracks: updatedTracks,
        notes: updatedActiveTrack ? updatedActiveTrack.notes : [],
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    removeNote: (id: string) => {
      const { activeTrackId, tracks, selectedNoteIds } = get();
      const updatedTracks = tracks.map((track) => {
        if (track.id === activeTrackId) {
          return { ...track, notes: track.notes.filter((n) => n.id !== id) };
        }
        return track;
      });

      const activeTrack = updatedTracks.find((t) => t.id === activeTrackId);

      set({
        tracks: updatedTracks,
        notes: activeTrack ? activeTrack.notes : [],
        selectedNoteIds: selectedNoteIds.filter((selId) => selId !== id),
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    toggleNote: (pitch: string, step: number, swara?: string, velocity = 0.85, bol?: string) => {
      const { activeTrackId, tracks, selectedNoteIds } = get();
      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      if (!activeTrack) return;

      const isPercussion = activeTrack.instrument === "tabla" || activeTrack.instrument === "beats";
      const canonical = swara ? tryNormalizeSwara(swara) : null;
      const finalBol = bol || (isPercussion && swara ? swara : undefined);

      const existingIndex = activeTrack.notes.findIndex((n) => n.pitch === pitch && n.step === step);
      let updatedTrackNotes: ProjectNote[];
      let updatedSelected = [...selectedNoteIds];

      if (existingIndex >= 0) {
        const removedNote = activeTrack.notes[existingIndex];
        updatedTrackNotes = activeTrack.notes.filter((_, idx) => idx !== existingIndex);
        updatedSelected = updatedSelected.filter((id) => id !== removedNote.id);
      } else {
        const id = `${pitch}-${step}-${Date.now()}`;
        const newNote: ProjectNote = {
          id,
          pitch,
          swara: !isPercussion && canonical ? canonical : undefined,
          bol: finalBol,
          step,
          duration: 1,
          velocity,
        };
        updatedTrackNotes = [...activeTrack.notes, newNote];
        audioEngine.previewNote(pitch, "8n", velocity, activeTrack.instrument);
      }

      const updatedTracks = tracks.map((t) =>
        t.id === activeTrackId ? { ...t, notes: updatedTrackNotes } : t
      );

      set({
        tracks: updatedTracks,
        notes: updatedTrackNotes,
        selectedNoteIds: updatedSelected,
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    clearNotes: () => {
      const { activeTrackId, tracks } = get();
      const updatedTracks = tracks.map((t) =>
        t.id === activeTrackId ? { ...t, notes: [] } : t
      );
      set({ tracks: updatedTracks, notes: [], selectedNoteIds: [] });
      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    loadPresetMelody: () => {
      const currentTonic = get().tonic;
      // Reset to default multi-layer arrangement with transposed notes
      const initialTracks = DEFAULT_INITIAL_TRACKS.map((track) => {
        if (track.instrument === "tabla" || track.instrument === "beats" || track.isAudioTrack) {
          return track;
        }
        return {
          ...track,
          notes: track.notes.map((n) => {
            if (n.swara) {
              const canonical = tryNormalizeSwara(n.swara);
              if (canonical) {
                const midi = yamanToMidi(currentTonic, canonical);
                return { ...n, swara: canonical, pitch: midiToPitchName(midi) };
              }
            }
            return n;
          }),
        };
      });

      const activeTrack = initialTracks[1] || initialTracks[0]; // Veena

      set({
        tracks: initialTracks,
        activeTrackId: activeTrack.id,
        instrument: activeTrack.instrument,
        notes: activeTrack.notes,
        selectedNoteIds: [],
      });

      audioEngine.scheduleNotes(compileScheduledNotes(initialTracks));
      audioEngine.previewNote("E4", "4n", 0.9, "pluck");
    },

    // Multi-select & Batch Editing
    selectNote: (id: string, isMulti = false) => {
      if (isMulti) {
        const current = get().selectedNoteIds;
        if (current.includes(id)) {
          set({ selectedNoteIds: current.filter((x) => x !== id) });
        } else {
          set({ selectedNoteIds: [...current, id] });
        }
      } else {
        set({ selectedNoteIds: [id] });
      }
    },

    selectAllNotes: () => {
      set({ selectedNoteIds: get().notes.map((n) => n.id) });
    },

    deselectAllNotes: () => {
      set({ selectedNoteIds: [] });
    },

    deleteSelectedNotes: () => {
      const { activeTrackId, tracks, selectedNoteIds } = get();
      const selectedIds = new Set(selectedNoteIds);
      if (selectedIds.size === 0) return;

      const updatedTracks = tracks.map((t) => {
        if (t.id === activeTrackId) {
          return { ...t, notes: t.notes.filter((n) => !selectedIds.has(n.id)) };
        }
        return t;
      });

      const activeTrack = updatedTracks.find((t) => t.id === activeTrackId);

      set({
        tracks: updatedTracks,
        notes: activeTrack ? activeTrack.notes : [],
        selectedNoteIds: [],
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    moveSelectedNotes: (stepDelta: number) => {
      const { activeTrackId, tracks, selectedNoteIds, loopLength } = get();
      const selectedIds = new Set(selectedNoteIds);
      if (selectedIds.size === 0) return;

      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      if (!activeTrack) return;

      const selectedNotes = activeTrack.notes.filter((n) => selectedIds.has(n.id));
      const canMove = selectedNotes.every((n) => {
        const newStep = n.step + stepDelta;
        return newStep >= 0 && newStep < loopLength;
      });

      if (!canMove) return;

      const updatedTrackNotes = activeTrack.notes.map((n) => {
        if (selectedIds.has(n.id)) {
          return { ...n, step: n.step + stepDelta };
        }
        return n;
      });

      const updatedTracks = tracks.map((t) =>
        t.id === activeTrackId ? { ...t, notes: updatedTrackNotes } : t
      );

      set({
        tracks: updatedTracks,
        notes: updatedTrackNotes,
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    setSelectedNotesVelocity: (velocity: number) => {
      const { activeTrackId, tracks, selectedNoteIds } = get();
      const selectedIds = new Set(selectedNoteIds);
      if (selectedIds.size === 0) return;

      const clamped = Math.max(0.1, Math.min(1.0, velocity));
      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      if (!activeTrack) return;

      const updatedTrackNotes = activeTrack.notes.map((n) => {
        if (selectedIds.has(n.id)) {
          return { ...n, velocity: clamped };
        }
        return n;
      });

      const updatedTracks = tracks.map((t) =>
        t.id === activeTrackId ? { ...t, notes: updatedTrackNotes } : t
      );

      set({
        tracks: updatedTracks,
        notes: updatedTrackNotes,
      });

      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },

    // Project Persistence
    saveToLocalStorage: () => {
      if (typeof window === "undefined") return false;
      try {
        const data: SerializableProjectData = {
          version: "3.0",
          name: "My D3 MusiQ Track",
          savedAt: new Date().toISOString(),
          bpm: get().bpm,
          masterVolume: get().masterVolume,
          currentScale: get().currentScale,
          tonic: get().tonic,
          instrument: get().instrument,
          activeTrackId: get().activeTrackId,
          loopLength: get().loopLength,
          tracks: get().tracks,
          notes: get().notes,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        console.error("Failed to save project to localStorage:", err);
        return false;
      }
    },

    loadFromLocalStorage: () => {
      if (typeof window === "undefined") return false;
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return false;
        const data: SerializableProjectData = JSON.parse(raw);

        const tracksToLoad =
          data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0
            ? data.tracks
            : DEFAULT_INITIAL_TRACKS.map((t) =>
                t.instrument === (data.instrument || "pluck")
                  ? { ...t, notes: data.notes || [] }
                  : t
              );

        const activeId = data.activeTrackId || tracksToLoad[0].id;
        const activeTrack = tracksToLoad.find((t) => t.id === activeId) || tracksToLoad[0];

        set({
          bpm: data.bpm ?? 110,
          masterVolume: data.masterVolume ?? 0.85,
          currentScale: data.currentScale ?? "yaman",
          tonic: data.tonic ?? "C4",
          instrument: activeTrack.instrument,
          loopLength: data.loopLength ?? 16,
          tracks: tracksToLoad,
          activeTrackId: activeTrack.id,
          notes: activeTrack.notes,
          selectedNoteIds: [],
        });

        audioEngine.setBPM(data.bpm ?? 110);
        audioEngine.setVolume(data.masterVolume ?? 0.85);
        audioEngine.setInstrument(activeTrack.instrument);
        audioEngine.scheduleNotes(compileScheduledNotes(tracksToLoad));
        return true;
      } catch (err) {
        console.error("Failed to load project from localStorage:", err);
        return false;
      }
    },

    hasSavedProject: () => {
      if (typeof window === "undefined") return false;
      return !!localStorage.getItem(LOCAL_STORAGE_KEY);
    },

    exportProjectJSON: () => {
      const data: SerializableProjectData = {
        version: "3.0",
        name: "D3 MusiQ Arrangement",
        savedAt: new Date().toISOString(),
        bpm: get().bpm,
        masterVolume: get().masterVolume,
        currentScale: get().currentScale,
        tonic: get().tonic,
        instrument: get().instrument,
        activeTrackId: get().activeTrackId,
        loopLength: get().loopLength,
        tracks: get().tracks,
        notes: get().notes,
      };
      return JSON.stringify(data, null, 2);
    },

    importProjectJSON: (jsonString: string) => {
      try {
        const data: SerializableProjectData = JSON.parse(jsonString);

        const tracksToLoad =
          data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0
            ? data.tracks
            : DEFAULT_INITIAL_TRACKS.map((t) =>
                t.instrument === (data.instrument || "pluck")
                  ? { ...t, notes: data.notes || [] }
                  : t
              );

        const activeId = data.activeTrackId || tracksToLoad[0].id;
        const activeTrack = tracksToLoad.find((t) => t.id === activeId) || tracksToLoad[0];

        set({
          bpm: data.bpm ?? 110,
          masterVolume: data.masterVolume ?? 0.85,
          currentScale: data.currentScale ?? "yaman",
          tonic: data.tonic ?? "C4",
          instrument: activeTrack.instrument,
          loopLength: data.loopLength ?? 16,
          tracks: tracksToLoad,
          activeTrackId: activeTrack.id,
          notes: activeTrack.notes,
          selectedNoteIds: [],
        });

        audioEngine.setBPM(data.bpm ?? 110);
        audioEngine.setVolume(data.masterVolume ?? 0.85);
        audioEngine.setInstrument(activeTrack.instrument);
        audioEngine.scheduleNotes(compileScheduledNotes(tracksToLoad));
        return true;
      } catch (err) {
        console.error("Failed to import project JSON:", err);
        return false;
      }
    },

    importBreakdownNotes: (detectedNotes, newTonic, newInstrument, newBpm, newScale) => {
      const finalTonic = newTonic || get().tonic;
      const finalInstrument = newInstrument || get().instrument;
      const finalScale = newScale || get().currentScale;
      const finalBpm = newBpm ? Math.max(60, Math.min(180, newBpm)) : get().bpm;
      const isPercussion = finalInstrument === "tabla" || finalInstrument === "beats";

      const importedNotes: ProjectNote[] = detectedNotes.map((dn, idx) => {
        const canonical = dn.swara ? tryNormalizeSwara(dn.swara) : null;
        return {
          id: `imported-${dn.pitch}-${dn.step}-${idx}`,
          pitch: dn.pitch,
          swara: !isPercussion && canonical ? canonical : undefined,
          bol: isPercussion && dn.swara ? dn.swara : undefined,
          step: Math.max(0, Math.min(15, dn.step)),
          duration: 1,
          velocity: dn.velocity ?? 0.85,
        };
      });

      // Find or create layer matching finalInstrument
      const existingTrack = get().tracks.find((t) => t.instrument === finalInstrument);
      let updatedTracks: ProjectTrack[];
      let targetTrackId: string;

      if (existingTrack) {
        targetTrackId = existingTrack.id;
        updatedTracks = get().tracks.map((t) =>
          t.id === existingTrack.id ? { ...t, notes: importedNotes } : t
        );
      } else {
        targetTrackId = `track-breakdown-${Date.now()}`;
        const newTrack: ProjectTrack = {
          id: targetTrackId,
          name: `${finalInstrument.toUpperCase()} Transcription`,
          type: "Breakdown Import",
          instrument: finalInstrument,
          volume: 0.85,
          muted: false,
          solo: false,
          notes: importedNotes,
        };
        updatedTracks = [...get().tracks, newTrack];
      }

      set({
        tonic: finalTonic,
        instrument: finalInstrument,
        currentScale: finalScale,
        bpm: finalBpm,
        tracks: updatedTracks,
        activeTrackId: targetTrackId,
        notes: importedNotes,
        selectedNoteIds: [],
      });

      audioEngine.setBPM(finalBpm);
      audioEngine.setInstrument(finalInstrument);
      audioEngine.scheduleNotes(compileScheduledNotes(updatedTracks));
    },
  };
});
