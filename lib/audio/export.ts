/**
 * Mix Exporter for D3 MusiQ (Phase 3)
 * 
 * Renders the active multi-track composition into an uncompressed WAV audio file
 * using Tone.Offline and standard 16-bit PCM encoding.
 */

import * as Tone from "tone";
import { ProjectTrack } from "@/store/useProjectStore";
import { InstrumentType } from "@/lib/audio/engine";

/**
 * Converts an AudioBuffer to a 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + length;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  // RIFF chunk length
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, "WAVE");
  // format chunk identifier
  writeString(view, 12, "fmt ");
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, "data");
  // data chunk length
  view.setUint32(40, length, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert float to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Renders all active, unmuted tracks into an audio mix offline and downloads as WAV
 */
export async function exportCompositionToWav(
  tracks: ProjectTrack[],
  bpm: number,
  loopCycles = 2
): Promise<Blob> {
  const secondsPerBeat = 60 / bpm;
  const loopDurationSeconds = secondsPerBeat * 4; // 1 measure of 4/4
  const totalDuration = loopDurationSeconds * loopCycles + 0.5; // slight tail

  const hasSolo = tracks.some((t) => t.solo);

  // Pre-decode any active vocal / audio tracks for the mix
  const audioTrackBuffers: Array<{ buffer: AudioBuffer; volume: number }> = [];
  for (const track of tracks) {
    if (track.isAudioTrack && track.audioBlobUrl) {
      const isMuted = hasSolo ? !track.solo : track.muted;
      if (!isMuted) {
        try {
          const resp = await fetch(track.audioBlobUrl);
          const arrayBuf = await resp.arrayBuffer();
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const tempCtx = new AudioContextClass();
          const decoded = await tempCtx.decodeAudioData(arrayBuf);
          tempCtx.close();
          audioTrackBuffers.push({ buffer: decoded, volume: track.volume ?? 0.8 });
        } catch (err) {
          console.warn("Could not decode audio track for export:", err);
        }
      }
    }
  }

  const offlineBuffer = await Tone.Offline(async (context) => {
    const masterLimiter = new Tone.Limiter(-0.5).toDestination();
    const masterGain = new Tone.Gain(0.85).connect(masterLimiter);

    // Instantiate synths for offline context
    const polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0.4, release: 0.6 },
    }).connect(masterGain);

    const pluckSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth8" },
      envelope: { attack: 0.003, decay: 0.35, sustain: 0.04, release: 0.4 },
    }).connect(masterGain);

    const fluteSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.035, decay: 0.3, sustain: 0.7, release: 0.45 },
    }).connect(masterGain);

    const violinSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.75, release: 0.5 },
    }).connect(masterGain);

    const guitarSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle4" },
      envelope: { attack: 0.005, decay: 0.45, sustain: 0.08, release: 0.4 },
    }).connect(masterGain);

    const drumKick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
    }).connect(masterGain);

    const drumSnare = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
    }).connect(masterGain);

    const drumHat = new Tone.MetalSynth({
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      envelope: { attack: 0.001, decay: 0.08, release: 0.05 },
    }).connect(masterGain);

    const tablaBayan = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.5 },
    }).connect(masterGain);

    const tablaDayan = new Tone.MetalSynth({
      harmonicity: 3.2,
      modulationIndex: 16,
      resonance: 2800,
      envelope: { attack: 0.002, decay: 0.3, release: 0.2 },
    }).connect(masterGain);

    const tablaSlap = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
    }).connect(masterGain);

    const secondsPer16th = loopDurationSeconds / 16;

    for (let cycle = 0; cycle < loopCycles; cycle++) {
      const cycleOffset = cycle * loopDurationSeconds;

      // Schedule any recorded vocal audio tracks for this cycle
      for (const { buffer, volume } of audioTrackBuffers) {
        try {
          const toneBuffer = new Tone.ToneAudioBuffer(buffer);
          const player = new Tone.Player(toneBuffer).connect(masterGain);
          player.volume.value = 20 * Math.log10(Math.max(0.0001, volume));
          player.start(cycleOffset);
        } catch (err) {
          console.warn("Failed to schedule audio buffer in offline export:", err);
        }
      }

      for (const track of tracks) {
        if (track.isAudioTrack) continue;
        const isMuted = hasSolo ? !track.solo : track.muted;
        if (isMuted) continue;

        const trackVol = track.volume ?? 1;

        for (const note of track.notes) {
          const noteTime = cycleOffset + note.step * secondsPer16th;
          const durSeconds = Math.max(0.05, (note.duration || 1) * secondsPer16th * 0.9);
          const velocity = (note.velocity ?? 0.85) * trackVol;
          const inst: InstrumentType = track.instrument;

          if (inst === "tabla") {
            if (note.pitch.startsWith("C") || note.pitch.startsWith("D")) {
              tablaBayan.triggerAttackRelease("G1", "8n", noteTime, velocity * 0.9);
              tablaDayan.triggerAttackRelease("8n", noteTime, velocity * 0.8);
            } else if (note.pitch.startsWith("E")) {
              tablaBayan.triggerAttackRelease("E1", "4n", noteTime, velocity);
            } else if (note.pitch.startsWith("F")) {
              tablaDayan.triggerAttackRelease("16n", noteTime, velocity);
            } else if (note.pitch.startsWith("G")) {
              tablaDayan.triggerAttackRelease("8n", noteTime, velocity * 0.85);
            } else {
              tablaSlap.triggerAttackRelease("32n", noteTime, velocity * 0.9);
            }
          } else if (inst === "beats") {
            if (note.pitch.startsWith("C")) {
              drumKick.triggerAttackRelease("C1", "8n", noteTime, velocity);
            } else if (note.pitch.startsWith("D")) {
              drumSnare.triggerAttackRelease("16n", noteTime, velocity);
            } else {
              drumHat.triggerAttackRelease("32n", noteTime, velocity * 0.7);
            }
          } else if (inst === "pluck") {
            pluckSynth.triggerAttackRelease(note.pitch, durSeconds, noteTime, velocity);
          } else if (inst === "flute") {
            fluteSynth.triggerAttackRelease(note.pitch, durSeconds, noteTime, velocity);
          } else if (inst === "violin") {
            violinSynth.triggerAttackRelease(note.pitch, durSeconds, noteTime, velocity);
          } else if (inst === "guitar") {
            guitarSynth.triggerAttackRelease(note.pitch, durSeconds, noteTime, velocity);
          } else {
            polySynth.triggerAttackRelease(note.pitch, durSeconds, noteTime, velocity);
          }
        }
      }
    }
  }, totalDuration);

  // Return the encoded WAV Blob
  const rawBuffer = offlineBuffer.get();
  if (!rawBuffer) {
    throw new Error("Failed to render offline audio mix: buffer was undefined.");
  }
  return audioBufferToWav(rawBuffer);
}
