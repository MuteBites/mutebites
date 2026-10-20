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
  /** The light splash ("One Bite" pattern, for old phones / slow connections). */
  liteImages: string[];
  liteExitAt: number;
  /** A phone that hasn't got the full splash's images by now gets the light one. */
  liteFallbackMs: number;
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

  // Old phone or slow connection: the light splash (just the logo tile and
  // its name, ~8 KB) instead of the full cloche reveal. ?splash=lite /
  // ?splash=full force either one.
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const forceMode = (/[?&]splash=(lite|full)/.exec(location.search) || [])[1];
  let lite =
    forceMode === "lite" ||
    (forceMode !== "full" &&
      (!!(nav.connection && (nav.connection.saveData || /2g|3g/.test(nav.connection.effectiveType || ""))) ||
        (!!nav.deviceMemory && nav.deviceMemory <= 2) ||
        (!!navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)));
  const fetchImage = (src: string) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    const img = new Image();
    img.src = src;
    return img.decode();
  };
  const liteLoaded = Promise.all(C.liteImages.map(fetchImage));
  // The full splash's images only download on a phone that will play it.
  const fullLoaded = lite ? null : Promise.all(C.images.filter((x) => C.liteImages.indexOf(x) < 0).map(fetchImage));

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
    if (el && el.querySelector('[data-sp="tile"]')) {
      overlay = el;
      el.addEventListener("click", () => exit(true));
      if (lite) {
        liteLoaded.then(start, () => exit(true));
      } else {
        Promise.all([fullLoaded, liteLoaded]).then(start, () => exit(true));
        // Taking too long (a slow connection the browser didn't report):
        // fall back to the light splash once its one image is in.
        setTimeout(() => {
          if (started || ended) return;
          liteLoaded.then(() => {
            if (started || ended) return;
            lite = true;
            start();
          });
        }, C.liteFallbackMs);
      }
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
    html.setAttribute("data-splash-mode", lite ? "lite" : "full");
    html.setAttribute("data-splash-ran", "");
    setState("run");
    if (reduce) {
      // The resting state is the finished logo: the mascot in the open
      // cloche (full), or the tile and its name (light).
      const shown = lite ? [q("tile"), q("lite")] : [q("stage")];
      for (const el of shown) play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      setTimeout(() => exit(false), 220 + C.reducedHoldMs);
    } else if (lite) {
      liteStoryboard();
      setTimeout(() => exit(false), C.liteExitAt);
    } else {
      storyboard();
      setTimeout(() => exit(false), T(C.exitAt));
    }
  }

  // The light splash (College Bites' "One Bite" pattern): the logo tile
  // springs in with a sheen, its name rises under it, and it flies onto
  // the page's logo. Snappy, ~1.4 s, one 8 KB image.
  function liteStoryboard() {
    play(
      q("tile"),
      [
        { opacity: 0, transform: "translateY(14px) scale(0.72)" },
        { offset: 0.6, opacity: 1, transform: "translateY(-2px) scale(1.05)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 460, delay: 60, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    play(q("tile-sheen"), [{ translate: "-100% 0" }, { translate: "100% 0" }], {
      duration: 560,
      delay: 440,
      easing: "cubic-bezier(0.45, 0, 0.25, 1)",
    });
    play(
      q("lite"),
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 380, delay: 320, easing: outExpo },
    );
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

  // Both splashes end AS the logo: the splash's own logo tile flies onto
  // the page's (BrandLogo splashTarget) and lands exactly on it, while the
  // plum ground fades to the page. In the full splash the cloche shrinks
  // towards the tile and hands over to it on the way.
  function morph(target: HTMLElement, fast: boolean) {
    const tile = q("tile");
    setState("out");
    const dur = fast ? 340 : lite ? 460 : T(C.morphMs);
    const easing = "cubic-bezier(0.65, 0, 0.25, 1)";
    const t = target.getBoundingClientRect();
    const b = tile.getBoundingClientRect();
    // A transform that puts the tile over rect r (its centre and width).
    const over = (r: { left: number; top: number; width: number; height: number }) =>
      `translate(${r.left + r.width / 2 - (b.left + b.width / 2)}px, ${r.top + r.height / 2 - (b.top + b.height / 2)}px) scale(${r.width / b.width})`;
    const to = over(t);

    if (lite) {
      tile.animate([{ transform: "none", opacity: 1 }, { transform: to, opacity: 1 }], {
        duration: dur,
        easing,
        fill: "forwards",
      });
      q("lite").animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.4, easing: "ease-in", fill: "forwards" });
    } else {
      const stage = q("stage");
      const H = q("hero").getBoundingClientRect();
      const S = stage.getBoundingClientRect();
      // The cloche shrinks onto the target and fades as the tile takes over.
      const s = Math.min(t.width / H.width, t.height / H.height) * 0.92;
      const tx = t.left + (t.width - H.width * s) / 2 - S.left - (H.left - S.left) * s;
      const ty = t.top + (t.height - H.height * s) / 2 - S.top - (H.top - S.top) * s;
      stage.animate(
        [
          { transform: "none", opacity: 1 },
          { offset: 0.55, opacity: 1 },
          { transform: `translate(${tx}px, ${ty}px) scale(${s})`, opacity: 0 },
        ],
        { duration: dur, easing, fill: "forwards" },
      );
      for (const name of ["wordmark", "tagline", "spot"]) {
        q(name).animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.4, easing: "ease-in", fill: "forwards" });
      }
      // The tile starts over the cloche and rides along, fading in.
      const from = over({ left: H.left + H.width * 0.2, top: H.top + H.height * 0.1, width: H.width * 0.6, height: H.width * 0.6 });
      tile.animate(
        [
          { transform: from, opacity: 0 },
          { offset: 0.35, opacity: 0 },
          { offset: 0.7, opacity: 1 },
          { transform: to, opacity: 1 },
        ],
        { duration: dur, easing, fill: "forwards" },
      );
    }
    q("bg").animate([{ opacity: 1 }, { offset: 0.45, opacity: 1 }, { opacity: 0 }], {
      duration: dur,
      easing: "ease-in",
      fill: "forwards",
    });
    const main = document.querySelector("main");
    if (main) main.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: dur, easing: "ease-out" });
    // Hold the landed tile a beat on top of the page's own, then hand over.
    setTimeout(() => setState("done"), dur + 60);
  }

  // No logo tile on this page (or reduced motion): a short, plain fade.
  function fadeOut(fast: boolean) {
    const el = overlay!;
    setState("out");
    const dur = reduce ? 220 : T(fast ? 200 : 320);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: "ease-in", fill: "forwards" });
    if (!reduce && started) {
      q(lite ? "tile" : "stage").animate([{ transform: "none" }, { transform: "scale(0.96)" }], { duration: dur, easing: "ease-in", fill: "forwards" });
    }
    setTimeout(() => setState("done"), dur + 30);
  }
}
