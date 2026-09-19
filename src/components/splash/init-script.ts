import { SPLASH } from "./config";
import { LAYERS } from "./layers";

const config = {
  speed: SPLASH.speed,
  exitAt: SPLASH.exitAt,
  exitMs: SPLASH.exitMs,
  reducedHoldMs: SPLASH.reducedHoldMs,
  loadTimeoutMs: SPLASH.loadTimeoutMs,
  sessionKey: SPLASH.sessionKey,
  disableKey: SPLASH.disableKey,
  skipPaths: SPLASH.skipPaths,
  images: Object.values(LAYERS).map((l) => l.src),
};

/**
 * Runs in <head> before the body is parsed (layout.tsx, beforeInteractive),
 * so the decision — play or skip — is made before first paint and the
 * splash never flashes on a page that shouldn't show it. It then drives
 * the whole splash by flipping `data-splash` on <html>:
 *
 *   play  ivory screen up, layer images loading (preloaded from here)
 *   run   images ready — the CSS storyboard plays
 *   out   exit fade into the app (also on tap)
 *   done  splash hidden for the rest of the session
 *
 * No React involved, so it starts as soon as the images arrive rather than
 * waiting for hydration, and a failed image or a slow network just fades
 * the splash out. The CSS also hides it on its own after 9 s as a last
 * resort. `?nosplash` skips it for one load, `?splash` forces it.
 */
export const SPLASH_INIT_SCRIPT = `
(function () {
  var C = ${JSON.stringify(config)};
  var d = document.documentElement;
  function set(s) { d.setAttribute("data-splash", s); }
  try {
    var p = location.pathname, q = location.search;
    for (var i = 0; i < C.skipPaths.length; i++) {
      var s = C.skipPaths[i];
      if (p === s || p.indexOf(s + "/") === 0) return;
    }
    if (/[?&]nosplash(=|&|$)/.test(q)) return;
    if (localStorage.getItem(C.disableKey) === "off") return;
    if (document.visibilityState === "hidden") return;
    if (!/[?&]splash(=|&|$)/.test(q) && sessionStorage.getItem(C.sessionKey)) return;
    sessionStorage.setItem(C.sessionKey, "1");
  } catch (e) {
    return;
  }

  set("play");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var started = false, ended = false, t0 = Date.now();

  C.images.forEach(function (src) {
    var l = document.createElement("link");
    l.rel = "preload";
    l.as = "image";
    l.href = src;
    l.setAttribute("fetchpriority", "high");
    document.head.appendChild(l);
  });

  function finish() {
    if (ended) return;
    ended = started = true;
    set("out");
    setTimeout(function () { set("done"); }, (reduce ? 250 : C.exitMs * C.speed) + 150);
  }
  function start() {
    if (started) return;
    started = true;
    // Marks that the logo was actually shown, so a fade-out after a failed
    // image load stays plain ivory instead of revealing half-loaded layers.
    d.setAttribute("data-splash-ran", "");
    set("run");
    setTimeout(finish, reduce ? C.reducedHoldMs + 250 : C.exitAt * C.speed);
  }
  function ready(el) {
    el.addEventListener("click", finish);
    var imgs = el.getElementsByTagName("img"), left = imgs.length;
    function one() { if (--left <= 0) start(); }
    // Loaded and decoded, so the first animated frame never shows a blank layer.
    function decoded(im) { if (im.decode) im.decode().then(one, one); else one(); }
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.complete && im.naturalWidth) decoded(im);
      else {
        im.addEventListener("load", decoded.bind(null, im));
        im.addEventListener("error", finish);
      }
    }
    if (!imgs.length) start();
  }
  (function find() {
    // Wait for the whole overlay (all layer <img>s), not just its opening
    // tag — the HTML streams in, and a chunk could end mid-splash.
    var el = document.getElementById("app-splash");
    if (el && el.getElementsByTagName("img").length >= C.images.length) return ready(el);
    if (Date.now() - t0 > C.loadTimeoutMs) return set("done");
    setTimeout(find, 16);
  })();
  setTimeout(function () { if (!started) finish(); }, C.loadTimeoutMs);
})();
`;
