"use client";

import { isSoundEnabled } from "./store";

/**
 * A short two-note chime synthesized with the Web Audio API — no audio
 * file to ship or download, just two oscillators with a quick gain
 * envelope so it stays subtle rather than a jarring beep.
 */
export function playOrderPlacedSound() {
  if (!isSoundEnabled()) return;

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    [880, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.09;

      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Web Audio unavailable/blocked — the sound is a nice-to-have, fail silently.
  }
}
