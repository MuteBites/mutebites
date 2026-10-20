import { SPLASH_IMAGES } from "./app-splash";
import { SPLASH } from "./config";
import { runSplash, type SplashRuntime } from "./engine";
import { SCENE } from "./scene";

const runtime: SplashRuntime = {
  speed: SPLASH.speed,
  riseAt: SPLASH.riseAt,
  riseMs: SPLASH.riseMs,
  shakeAt: SPLASH.shakeAt,
  shakeMs: SPLASH.shakeMs,
  burstAt: SPLASH.burstAt,
  popMs: SPLASH.popMs,
  popFrames: SCENE.pop.frames,
  wordAt: SPLASH.wordAt,
  taglineAt: SPLASH.taglineAt,
  exitAt: SPLASH.exitAt,
  morphMs: SPLASH.morphMs,
  targetWaitMs: SPLASH.targetWaitMs,
  reducedHoldMs: SPLASH.reducedHoldMs,
  loadTimeoutMs: SPLASH.loadTimeoutMs,
  sessionKey: SPLASH.sessionKey,
  disableKey: SPLASH.disableKey,
  skipPaths: SPLASH.skipPaths,
  images: SPLASH_IMAGES,
};

/**
 * The splash engine as a raw inline script (layout.tsx renders it with
 * dangerouslySetInnerHTML at the top of <body> — not next/script, whose
 * beforeInteractive inline scripts are queued until Next's JS loads).
 * `runSplash.toString()` is the compiled function source, so engine.ts
 * must stay self-contained. `?nosplash` skips it for one load; `?intro`
 * (or `?splash`) replays it.
 */
export const SPLASH_INIT_SCRIPT = `(${runSplash.toString()})(${JSON.stringify(runtime)});`;
