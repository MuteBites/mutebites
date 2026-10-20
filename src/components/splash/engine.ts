/**
 * The startup splash's motion ("The Cloche Reveal", ./config.ts has the
 * storyboard), as one self-contained function. It is never imported by
 * client code: ./init-script.ts serialises it with `runSplash.toString()`
 * into a raw inline <script> at the top of <body>, so it runs before first
 * paint and needs no bundle or hydration. Everything it uses must live
 * inside it — no imports, no helpers from module scope — and it must stay
 * plain modern JS once types are stripped.
 *
 * All motion is the Web Animations API on transform and opacity only — no
 * clip-path, background-position or filters — so the GPU runs it and it
 * stays smooth while the app's own JS boots underneath. It drives `data-splash` on <html>:
 *   play → run → out → done
 * and never traps anyone: tap skips, slow images fade out, the CSS hides
 * the overlay after `failsafeMs` whatever happens.
 */

export type SplashRuntime = {
  speed: number;
  riseAt: number;
  riseMs: number;
  shakeAt: number;
  shakeMs: number;
  burstAt: number;
  popMs: number;
  popFrames: number;
  wordAt: number;
  taglineAt: number;
  exitAt: number;
  morphMs: number;
  targetWaitMs: number;
  reducedHoldMs: number;
  loadTimeoutMs: number;
  sessionKey: string;
  disableKey: string;
  skipPaths: readonly string[];
  images: string[];
};

export function runSplash(C: SplashRuntime): void {
  const html = document.documentElement;
  const setState = (s: string) => html.setAttribute("data-splash", s);

  // ---- Play this load? ------------------------------------------------------
  try {
    const path = location.pathname;
    const query = location.search;
    for (const p of C.skipPaths) if (path === p || path.indexOf(p + "/") === 0) return;
    if (/[?&]nosplash(=|&|$)/.test(query)) return;
    const forced = /[?&](splash|intro)(=|&|$)/.test(query);
    if (!forced && localStorage.getItem(C.disableKey) === "off") return;
    if (!forced && sessionStorage.getItem(C.sessionKey)) return;
    if (document.visibilityState === "hidden") return;
    sessionStorage.setItem(C.sessionKey, "1");
  } catch {
    return;
  }

  setState("play");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = (ms: number) => ms * C.speed;
  const loaded = C.images.map((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    const img = new Image();
    img.src = src;
    return img.decode();
  });

  let overlay: HTMLElement | null = null;
  let started = false;
  let ended = false;
  const running: Animation[] = [];
  const t0 = Date.now();

  const q = (name: string) => overlay!.querySelector<HTMLElement>(`[data-sp="${name}"]`)!;
  const qa = (name: string) => Array.from(overlay!.querySelectorAll<HTMLElement>(`[data-sp="${name}"]`));
  const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, Object.assign({ fill: "both" }, opts) as KeyframeAnimationOptions);
    running.push(a);
    return a;
  };
  const spring = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const outExpo = "cubic-bezier(0.16, 1, 0.3, 1)";

  // ---- Wait for the overlay markup and the images ----------------------------
  (function find() {
    const el = document.getElementById("app-splash");
    // The HTML streams in; wait for the whole overlay, not just its opening tag.
    if (el && el.querySelector('[data-sp="tagline"]')) {
      overlay = el;
      el.addEventListener("click", () => exit(true));
      Promise.all(loaded).then(start, () => exit(true));
      return;
    }
    if (Date.now() - t0 > C.loadTimeoutMs) return setState("done");
    setTimeout(find, 16);
  })();
  setTimeout(() => {
    if (!started) exit(true);
  }, C.loadTimeoutMs);

  function start() {
    if (started || ended || !overlay) return;
    started = true;
    html.setAttribute("data-splash-ran", "");
    setState("run");
    if (reduce) {
      // The resting state is the finished logo: the mascot in the open cloche.
      play(q("stage"), [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      setTimeout(() => exit(false), 220 + C.reducedHoldMs);
    } else {
      storyboard();
      setTimeout(() => exit(false), T(C.exitAt));
    }
  }

  function storyboard() {
    const hero = q("hero");
    const h = hero.getBoundingClientRect().height;
    const rise = T(C.riseAt);
    const burst = T(C.burstAt);

    play(q("spot"), [{ opacity: 0 }, { opacity: 1 }], { duration: T(600), delay: T(60), easing: "ease-out" });

    // ---- The closed cloche rises into the light and settles ----
    const cloche = q("cloche");
    play(
      cloche,
      [
        { opacity: 0, transform: `translateY(${0.55 * h}px) scale(0.84)` },
        { offset: 0.35, opacity: 1 },
        { offset: 0.72, transform: `translateY(${-0.05 * h}px) scale(1.02, 0.98)` },
        { offset: 0.86, transform: `translateY(${0.012 * h}px) scale(0.99, 1.02)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: T(C.riseMs), delay: rise, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    play(
      q("shadow"),
      [
        { opacity: 0, transform: "scale(0.4)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: T(C.riseMs), delay: rise, easing: outExpo },
    );
    play(
      q("glow"),
      [
        { opacity: 0, transform: "scale(0.7)" },
        { opacity: 0.45, transform: "scale(1)" },
      ],
      { duration: T(700), delay: T(260), easing: "ease-out" },
    );

    // ---- Something's inside: a squash and a shake (on the image inside
    // the rising wrapper, so the two motions don't fight) ----
    const lid = cloche.firstElementChild as HTMLElement;
    play(
      lid,
      [
        { transform: "none" },
        { offset: 0.18, transform: "scale(1.05, 0.93)" },
        { offset: 0.36, transform: "scale(0.98, 1.04) rotate(-4deg)" },
        { offset: 0.54, transform: "rotate(4deg)" },
        { offset: 0.72, transform: "rotate(-2.5deg)" },
        { offset: 0.88, transform: "rotate(1deg)" },
        { transform: "none" },
      ],
      { duration: T(C.shakeMs), delay: T(C.shakeAt), easing: "ease-in-out" },
    );

    // ---- Burst: the lid gives, light and steam, and there it is ----
    // "forwards", not "both": a second animation on the same element must
    // not apply its start state before its delay, over the shake.
    play(
      lid,
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "scale(1.12, 1.08)" },
      ],
      { duration: T(150), delay: burst, easing: "ease-in", fill: "forwards" },
    );
    play(
      q("flash"),
      [
        { opacity: 0, transform: "scale(0.3)" },
        { offset: 0.18, opacity: 1, transform: "scale(0.9)" },
        { opacity: 0, transform: "scale(1.7)" },
      ],
      { duration: T(560), delay: burst - T(40), easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
    );
    const pop = q("pop");
    play(
      pop,
      [
        { opacity: 0, transform: `translateY(${0.05 * h}px) scale(0.86)` },
        { offset: 0.25, opacity: 1 },
        { opacity: 1, transform: "none" },
      ],
      { duration: T(460), delay: burst - T(20), easing: spring },
    );
    // The strip plays once and holds its last frame (the wave's end). A
    // transform, so the GPU moves it — no repaint per frame.
    const n = C.popFrames;
    play(
      q("strip"),
      [{ transform: "translateX(0%)" }, { transform: `translateX(${(-((n - 1) / n) * 100).toFixed(4)}%)` }],
      { duration: T(C.popMs), delay: burst, easing: `steps(${n}, jump-none)` },
    );
    play(
      q("glow"),
      [
        { opacity: 0.45, transform: "scale(1)" },
        { offset: 0.25, opacity: 0.95, transform: "scale(1.15)" },
        { opacity: 0.6, transform: "scale(1)" },
      ],
      { duration: T(700), delay: burst, easing: "ease-out", fill: "forwards" },
    );
    qa("steam").forEach((s, i) => {
      const dir = i ? 1 : -1;
      play(
        s,
        [
          { opacity: 0, transform: `translate(${-dir * 0.12 * h}px, ${0.1 * h}px) scale(0.45)` },
          { offset: 0.25, opacity: 0.95 },
          { opacity: 0, transform: `translate(${dir * 0.1 * h}px, ${-0.32 * h}px) scale(1.15)` },
        ],
        { duration: T(1100), delay: burst + T(i * 60), easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" },
      );
    });
    qa("sparkle").forEach((s, i) =>
      play(
        s,
        [
          { opacity: 0, transform: "scale(0.2) rotate(0deg)" },
          { offset: 0.3, opacity: 1, transform: "scale(1.15) rotate(30deg)" },
          { opacity: 0, transform: "scale(0.4) rotate(90deg)" },
        ],
        { duration: T(620), delay: burst + T(80 + i * 90), easing: "ease-out" },
      ),
    );

    // ---- "MuteBites" in gold, a shine across it, then the tagline ----
    // A left-to-right wipe from two opposite translates (the window slides
    // in, the word inside slides back), all on the GPU — not a clip-path.
    const wipeOpts = { duration: T(560), delay: T(C.wordAt), easing: outExpo };
    play(q("wipe"), [{ transform: "translateX(-101%)" }, { transform: "none" }], wipeOpts);
    play(q("wordmark"), [{ transform: "translateX(101%)" }, { transform: "none" }], wipeOpts);
    play(
      q("shine"),
      [{ translate: "-100% 0" }, { translate: "100% 0" }],
      { duration: T(620), delay: T(C.wordAt + 360), easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
    );
    play(
      q("tagline"),
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: T(340), delay: T(C.taglineAt), easing: outExpo },
    );
  }

  // ---- Into the app ------------------------------------------------------------
  function exit(fast: boolean) {
    if (ended || !overlay) {
      if (!overlay) setState("done");
      return;
    }
    ended = true;
    // A tap mid-way jumps straight to the finished logo before closing.
    for (const a of running) a.finish();
    if (!started || reduce) return fadeOut(fast);
    const deadline = Date.now() + (fast ? 0 : T(C.targetWaitMs));
    (function look() {
      const tile = document.querySelector<HTMLElement>("[data-splash-target]");
      const r = tile && tile.getBoundingClientRect();
      if (tile && r && r.width > 12 && r.bottom > 0 && r.top < innerHeight) return morph(tile, fast);
      // Only worth waiting while the page is still on its loading skeleton
      // (every loading.tsx marks itself aria-busy); a page without a logo
      // tile just gets the plain fade.
      if (Date.now() < deadline && document.querySelector('[aria-busy="true"]')) return void setTimeout(look, 60);
      fadeOut(fast);
    })();
  }

  // The stage shrinks onto the page's logo tile (the cloche and mascot land
  // on the tile) while the plum screen fades away to the page, handing over
  // to the tile's own logo.
  function morph(tile: HTMLElement, fast: boolean) {
    const el = overlay!;
    const stage = q("stage");
    const hero = q("hero");
    setState("out");
    const dur = T(fast ? 340 : C.morphMs);
    const easing = "cubic-bezier(0.65, 0, 0.25, 1)";
    const S = stage.getBoundingClientRect();
    const H = hero.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    const s = Math.min(t.width / H.width, t.height / H.height) * 0.92;
    const tx = t.left + (t.width - H.width * s) / 2 - S.left - (H.left - S.left) * s;
    const ty = t.top + (t.height - H.height * s) / 2 - S.top - (H.top - S.top) * s;
    stage.animate([{ transform: "none" }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], {
      duration: dur,
      easing,
      fill: "forwards",
    });
    for (const name of ["wordmark", "tagline", "spot"]) {
      q(name).animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.4, easing: "ease-in", fill: "forwards" });
    }
    // The plum screen fades as the cloche lands on the tile (opacity only —
    // a clip-path close stuttered while the app hydrated underneath).
    el.animate(
      [
        { opacity: 1 },
        { offset: 0.55, opacity: 1 },
        { opacity: 0 },
      ],
      { duration: dur, easing: "ease-in", fill: "forwards" },
    );
    const main = document.querySelector("main");
    if (main) main.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: dur, easing: "ease-out" });
    setTimeout(() => setState("done"), dur + 30);
  }

  // No logo tile on this page (or reduced motion): a short, plain fade.
  function fadeOut(fast: boolean) {
    const el = overlay!;
    setState("out");
    const dur = reduce ? 220 : T(fast ? 200 : 320);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: "ease-in", fill: "forwards" });
    if (!reduce && started) {
      q("stage").animate([{ transform: "none" }, { transform: "scale(0.96)" }], { duration: dur, easing: "ease-in", fill: "forwards" });
    }
    setTimeout(() => setState("done"), dur + 30);
  }
}
