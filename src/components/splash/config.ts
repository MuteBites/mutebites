/**
 * Every knob for the startup splash. Times are milliseconds at speed 1 and
 * are all scaled by `speed`; the motion itself lives in ./engine.ts.
 *
 * Storyboard (speed 1), "The Cloche Reveal":
 *   0–150      deep plum, the spotlight warms up
 *   120–700    the closed gold cloche rises into the light and settles
 *   700–960    it shakes once — something's inside
 *   960        burst: a flash of warm light, steam curls out both sides,
 *              sparkles — and the mascot is there in the open cloche,
 *              waving (12 frames at 12 fps)
 *   1280–1780  "MuteBites" sweeps in in gold, a shine runs across it
 *   1560–1900  the tagline follows
 *   1900–2200  hold
 *   2200–2680  the cloche shrinks towards the app's own logo tile and hands
 *              over to the splash's logo tile, which lands exactly on it
 *
 * The light splash (old phones — ≤ 2 GB memory or ≤ 2 cores — slow
 * connections — 2G / 3G / Data Saver — or the full images not in by
 * `liteFallbackMs`), College Bites' "One Bite" pattern, ~1.5 s:
 *   60–520     the logo tile springs in    440–1000  a sheen runs across it
 *   320–700    "MuteBites" and the tagline rise under it
 *   1000–1460  the tile flies onto the page's logo as the plum fades
 */
export const SPLASH = {
  /** Multiplies every time below. 1.2 = 20% slower, 0.85 = snappier. */
  speed: 1,
  /** When the cloche rises in, and when it's settled. */
  riseAt: 120,
  riseMs: 580,
  /** The anticipation shake. */
  shakeAt: 700,
  shakeMs: 260,
  /** The burst / the mascot appearing. */
  burstAt: 960,
  /** One pass of the waving strip (12 frames at 12 fps). */
  popMs: 1000,
  /** Wordmark, then tagline. */
  wordAt: 1280,
  taglineAt: 1560,
  /** The light splash: when the tile starts flying onto the page's logo (not scaled by `speed`). */
  liteExitAt: 1000,
  /** A phone that hasn't got the full splash's images by now gets the light one. */
  liteFallbackMs: 1200,
  /** When the logo starts closing into the app, and how long that takes. */
  exitAt: 2200,
  morphMs: 480,
  /** Longest the finished logo waits for the page's logo tile to render before just fading. */
  targetWaitMs: 1200,
  /** Reduced motion: how long the still logo holds before fading out. */
  reducedHoldMs: 700,
  /** Longest wait for the images; past this the splash just fades out. */
  loadTimeoutMs: 2500,
  /** Last resort (CSS): the splash hides itself after this no matter what. */
  failsafeMs: 9000,
  /** sessionStorage flag — plays once per browser session (each fresh app open, not per route). */
  sessionKey: "mutebites.splash-shown",
  /** localStorage key; set it to "off" to disable on one device. */
  disableKey: "mutebites.splash",
  /** Never on these (admin tool, OAuth callback, Google's review bot on the legal pages, the dev page). */
  skipPaths: ["/admin", "/auth", "/privacy", "/terms", "/dev"],
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
