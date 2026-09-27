/**
 * Demo Audio Generator for D3 MusiQ Breakdown Workspace
 * 
 * Synthesizes short, authentic audio clips using OfflineAudioContext
 * to enable instant one-click analysis without uploading a file.
 */

export async function generateDemoYamanAudio(): Promise<AudioBuffer> {
  const sampleRate = 44100;
  const duration = 3.6; // 3.6 seconds
  const OfflineContext =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  const ctx = new OfflineContext(1, Math.floor(sampleRate * duration), sampleRate);

  // Raag Yaman phrase: S (C4), G3 (E4), M2 (F#4), P (G4), D2 (A4), N3 (B4), S' (C5)
  const notes = [
    { freq: 261.63, start: 0.1, dur: 0.4 }, // C4 (S)
    { freq: 329.63, start: 0.6, dur: 0.4 }, // E4 (G3)
    { freq: 369.99, start: 1.1, dur: 0.45 }, // F#4 (M2 - Teevra Ma!)
    { freq: 392.00, start: 1.65, dur: 0.4 }, // G4 (P)
    { freq: 440.00, start: 2.15, dur: 0.4 }, // A4 (D2)
    { freq: 493.88, start: 2.65, dur: 0.4 }, // B4 (N3)
    { freq: 523.25, start: 3.15, dur: 0.4 }, // C5 (S')
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Fundamental + subtle 2nd harmonic for rich acoustic timbre
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(n.freq, n.start);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(n.freq * 2, n.start);

    // Filter to soften tone
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, n.start);

    // Natural ADSR envelope
    gain.gain.setValueAtTime(0.0001, n.start);
    gain.gain.linearRampToValueAtTime(0.4, n.start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, n.start + n.dur);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(n.start);
    osc.stop(n.start + n.dur);
    osc2.start(n.start);
    osc2.stop(n.start + n.dur);
  }

  const renderedBuffer = await ctx.startRendering();
  return renderedBuffer;
}
