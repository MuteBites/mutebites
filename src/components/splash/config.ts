/**
 * Every knob for the startup splash (components/splash/app-splash.tsx +
 * the "Startup splash" block in globals.css). Durations are for speed 1;
 * the CSS scales every delay and duration by `speed`, and the init script
 * scales its exit timer the same way.
 */
export const SPLASH = {
  /** Multiplies every delay and duration. 1 = the ~2.35 s storyboard, 1.2 = 20% slower, 0.8 = faster. */
  speed: 1,
  /**
   * Where the mascot starts, as a translateX of the logo-sized stage. The
   * default puts its nose just past the left edge of the screen; a smaller
   * value (e.g. "calc(-30vw - 40%)") gives a shorter run-in.
   */
  runFrom: "calc(-50vw - 45%)",
  /** Landing bounce overshoot — 0.03 plays 0.98 → 1.03 → 1. 0 turns it off. */
  bounce: 0.03,
  /** How long each rising steam wisp lives, ms. */
  steamMs: 620,
  /** When the exit into the app starts, ms after the splash begins. */
  exitAt: 2050,
  /** Exit fade length, ms. */
  exitMs: 300,
  /** Reduced motion: how long the still logo holds before fading out, ms. */
  reducedHoldMs: 700,
  /** Longest wait for the layer images; past this the splash just fades out. */
  loadTimeoutMs: 2500,
  /** sessionStorage flag — plays once per browser session (each fresh app open, not per route). */
  sessionKey: "mutebites.splash-shown",
  /** localStorage key; set it to "off" to disable on one device. */
  disableKey: "mutebites.splash",
  /** Never on these (admin tool, OAuth callback, Google's review bot on the legal pages). */
  skipPaths: ["/admin", "/auth", "/privacy", "/terms"],
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
