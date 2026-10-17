import fs from "node:fs";
// MuteBites Plum's promo ride (PlumScene in src/components/home/promo-card.tsx).
// Samples a smooth curve along the scene's road (public/photos/promo/
// plum-scene-v2.webp; lane centre measured on the 1602 x 982 source art in
// docs/art/plum-promo/scene.png) and writes plain CSS keyframes in scene
// percentages, so the shipped animation is CSS-only and scales with the card:
// position, size from depth, lean into curves, which pose shows (left /
// right / front, hard swaps hidden by a squash), behind / in front of the
// bushes, the brake, dust on the bends.
// Run: node scripts/build-plum-promo-route.mjs   (rewrites the CSS file below)
const W = 1602, H = 982;            // source-art pixels of the scene
const T = 11;                        // loop, seconds
const RIDE = [0.5, 6.9];             // seconds: leaves the gate .. stops
// Lane centre, from the gate (far, small) to the braking spot (near, big).
const P = [
  [1196, 596], [1150, 603], [1080, 613], [1010, 623], [952, 633], [914, 642],
  [902, 652], [926, 661], [1008, 667], [1083, 678], [1152, 690], [1207, 705], [1238, 724],
  [1239, 746], [1212, 769], [1150, 795], [1063, 823],
];
const HAIRPIN = [902, 652], BEND = [1239, 735];
// Catmull-Rom through P, densely sampled.
const pts = [];
for (let i = 0; i < P.length - 1; i++) {
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
  for (let t = 0; t < 1; t += 0.02) {
    const t2 = t * t, t3 = t2 * t;
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
}
pts.push(P[P.length - 1]);
const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
const L = s[s.length - 1];
const near = (p, q, r) => Math.exp(-((Math.hypot(p[0] - q[0], p[1] - q[1]) / r) ** 2));
// Speed along the road: slow into the hairpin and the bend, gentle pull-away, brake at the end.
const speed = (i) => {
  const p = pts[i], u = s[i] / L;
  let v = 1 - 0.55 * near(p, HAIRPIN, 55) - 0.4 * near(p, BEND, 60);
  v *= Math.min(1, 0.25 + u / 0.08);             // pull away
  v *= Math.max(0.06, Math.min(1, (1 - u) / 0.16)); // brake
  return v;
};
// Time to each sample ∝ ∫ ds / v, scaled into the ride window.
const tt = [0]; for (let i = 1; i < pts.length; i++) tt.push(tt[i - 1] + (s[i] - s[i - 1]) / speed(i));
const k = (RIDE[1] - RIDE[0]) / tt[tt.length - 1];
const time = tt.map((x) => RIDE[0] + x * k);
// Depth: size from how far up the road it is.
const depth = [[596, 0.21], [645, 0.3], [700, 0.44], [735, 0.56], [823, 0.82]];
const scaleAt = (y) => { for (let i = 1; i < depth.length; i++) if (y <= depth[i][0]) { const [y0, s0] = depth[i - 1], [y1, s1] = depth[i]; return s0 + ((y - y0) / (y1 - y0)) * (s1 - s0); } return depth[depth.length - 1][1]; };
// Sample N keyframes evenly in time.
const N = 72, frames = [];
for (let n = 0; n <= N; n++) {
  const t = RIDE[0] + (n / N) * (RIDE[1] - RIDE[0]);
  let j = time.findIndex((x) => x >= t); if (j < 1) j = 1;
  const a = (t - time[j - 1]) / (time[j] - time[j - 1] || 1);
  const x = pts[j - 1][0] + a * (pts[j][0] - pts[j - 1][0]), y = pts[j - 1][1] + a * (pts[j][1] - pts[j - 1][1]);
  const j2 = Math.min(pts.length - 1, j + 3), dx = pts[j2][0] - pts[j - 1][0], dy = pts[j2][1] - pts[j - 1][1];
  frames.push({ t, x, y, dx, dy });
}
// Lean: turning rate (heading change), clamped, smoothed.
for (let n = 0; n < frames.length; n++) {
  const a = frames[Math.max(0, n - 2)], b = frames[Math.min(frames.length - 1, n + 2)];
  let d = Math.atan2(b.dy, b.dx) - Math.atan2(a.dy, a.dx);
  while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  frames[n].lean = Math.max(-8, Math.min(8, d * 18));
}
const pc = (t) => ((t / T) * 100).toFixed(2) + "%";
const fx = (v) => ((v / W) * 100).toFixed(2) + "%", fy = (v) => ((v / H) * 100).toFixed(2) + "%";
let css = "";
// Position (outer), size + lean (inner).
css += "@keyframes pr-route {\n  0% { translate: " + fx(P[0][0]) + " " + fy(P[0][1]) + "; }\n";
for (const f of frames) css += `  ${pc(f.t)} { translate: ${fx(f.x)} ${fy(f.y)}; }\n`;
css += "  100% { translate: " + fx(P[P.length - 1][0]) + " " + fy(P[P.length - 1][1]) + "; }\n}\n";
css += "@keyframes pr-size {\n  0% { scale: " + (scaleAt(P[0][1]) * 0.6).toFixed(3) + "; rotate: 0deg; }\n";
css += `  ${pc(RIDE[0])} { scale: ${scaleAt(P[0][1]).toFixed(3)}; rotate: 0deg; }\n`;
for (const f of frames) css += `  ${pc(f.t)} { scale: ${scaleAt(f.y).toFixed(3)}; rotate: ${f.lean.toFixed(2)}deg; }\n`;
css += "  100% { scale: " + scaleAt(P[P.length - 1][1]).toFixed(3) + "; rotate: 0deg; }\n}\n";
// Which way it faces: left on the far lane, right on the middle lane, front after the bend.
const dir = frames.map((f) => (f.y > 745 || (f.x > 1225 && f.y > 728 && f.dy > 0 && f.dx < 2) ? "front" : f.dx < 0 ? "left" : "right"));
const swaps = []; for (let n = 1; n < frames.length; n++) if (dir[n] !== dir[n - 1]) swaps.push([frames[n].t, dir[n - 1], dir[n]]);
// A hard swap at each turn (no ghosting): the new pose cuts in on top,
// the old one drops out a beat later, and a quick squash (pr-turn) hides the cut.
const poseKf = (name) => {
  const on = (d) => (d === name ? 1 : 0);
  let out = `@keyframes pr-${name} {
  0% { opacity: ${on(dir[0])}; }
`;
  for (const [t, from, to] of swaps) {
    if (name === to) out += `  ${pc(t - 0.07)} { opacity: 0; }
  ${pc(t - 0.06)} { opacity: 1; }
`;
    else if (name === from) out += `  ${pc(t - 0.02)} { opacity: 1; }
  ${pc(t + 0.04)} { opacity: 0; }
`;
  }
  return out + `  100% { opacity: ${on(dir[dir.length - 1])}; }
}
`;
};
let turn = `@keyframes pr-turn {
  0% { scale: 1 1; }
`;
for (const [t] of swaps) turn += `  ${pc(t - 0.16)} { scale: 1 1; }
  ${pc(t - 0.05)} { scale: 0.78 1.04; }
  ${pc(t + 0.1)} { scale: 1.04 0.98; }
  ${pc(t + 0.22)} { scale: 1 1; }
`;
css += turn + `  100% { scale: 1 1; }
}
`;
css += poseKf("left") + poseKf("right") + poseKf("front");
// Behind the bushes until it has left the hairpin.
const behindUntil = frames.find((f, n) => n > 4 && f.dx > 0).t + 0.25;
css += `@keyframes pr-depth {\n  0%, ${pc(behindUntil)} { z-index: 1; }\n  ${pc(behindUntil + 0.01)}, 100% { z-index: 3; }\n}\n`;
// Visibility: fades in at the gate, holds after braking, fades out.
css += `@keyframes pr-fade {\n  0%, ${pc(0.2)} { opacity: 0; }\n  ${pc(0.7)}, ${pc(9.5)} { opacity: 1; }\n  ${pc(10.1)}, 100% { opacity: 0; }\n}\n`;
// The brake: a little forward squash and rebound as it stops.
const st = RIDE[1];
css += `@keyframes pr-brake {\n  0%, ${pc(st - 0.25)} { scale: 1; }\n  ${pc(st)} { scale: 1.06 0.9; }\n  ${pc(st + 0.18)} { scale: 0.97 1.04; }\n  ${pc(st + 0.38)}, 100% { scale: 1; }\n}\n`;
// Dust at the hairpin and the bend, steam and a sparkle on arrival.
const at = (pt) => frames.reduce((b, f) => (Math.hypot(f.x - pt[0], f.y - pt[1]) < Math.hypot(b.x - pt[0], b.y - pt[1]) ? f : b));
const hp = at(HAIRPIN), bd = at(BEND);
const puff = (name, t) => `@keyframes ${name} {\n  0%, ${pc(t - 0.05)} { opacity: 0; scale: 0.4; translate: 0 0; }\n  ${pc(t + 0.1)} { opacity: 0.75; }\n  ${pc(t + 0.75)}, 100% { opacity: 0; scale: 1.5; translate: -40% -50%; }\n}\n`;
css += puff("pr-dust-hairpin", hp.t) + puff("pr-dust-bend", bd.t);
css += `@keyframes pr-arrive {\n  0%, ${pc(st)} { opacity: 0; scale: 0.4; }\n  ${pc(st + 0.25)} { opacity: 1; scale: 1.1; }\n  ${pc(st + 0.6)} { opacity: 0.9; scale: 1; }\n  ${pc(9.4)}, 100% { opacity: 0; scale: 1; }\n}\n`;
css += `@keyframes pr-steam {\n  0%, ${pc(st + 0.2)} { opacity: 0; }\n  ${pc(st + 0.5)}, ${pc(9.2)} { opacity: 1; }\n  ${pc(9.6)}, 100% { opacity: 0; }\n}\n`;
const meta = { T, stop: st, hairpin: { x: hp.x / W * 100, y: hp.y / H * 100, t: hp.t }, bend: { x: bd.x / W * 100, y: bd.y / H * 100, t: bd.t }, end: { x: P[P.length - 1][0] / W * 100, y: P[P.length - 1][1] / H * 100 }, swaps, behindUntil, path: pts.filter((_, i) => i % 3 === 0).map(([x, y]) => [+(x / W * 100).toFixed(2), +(y / H * 61.3).toFixed(2)]) };
// Rest pose (reduced motion) and the dust spots, from the same numbers.
css += `
.plum-pos { translate: ${fx(P[P.length - 1][0])} ${fy(P[P.length - 1][1])}; }
.plum-size { scale: ${scaleAt(P[P.length - 1][1]).toFixed(3)}; }
`;
css += `.plum-dust.hairpin { left: ${(hp.x / W * 100).toFixed(2)}%; top: ${(hp.y / H * 100).toFixed(2)}%; }
.plum-dust.bend { left: ${(bd.x / W * 100).toFixed(2)}%; top: ${(bd.y / H * 100).toFixed(2)}%; }
`;
const header = `/* GENERATED by scripts/build-plum-promo-route.mjs — do not edit by hand.
   ${T} s loop; leaves the gate at ${RIDE[0]} s, stops at ${RIDE[1]} s. */
`;
fs.writeFileSync(new URL("../src/components/home/plum-promo-route.css", import.meta.url), header + css.replaceAll("pr-", "plum-pr-"));
console.log("wrote plum-promo-route.css", { swaps: meta.swaps, behindUntil: meta.behindUntil, stop: meta.stop });
