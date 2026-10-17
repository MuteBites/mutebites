# MuteBites Plum promo art (17 Oct 2026)

Source art for Home's promo card under the MuteBites Plum theme
(`PlumScene` in `src/components/home/promo-card.tsx`). Generated with
ChatGPT from the prompts in the session that built it, by the client's
choice.

| File | Used as |
|---|---|
| `scene.png` | `public/photos/promo/plum-scene-v2.webp` (1200 px wide, clouds lifted out) |
| `rider-side.png` | the first, still rider (17 Oct); no longer shipped |
| `rider-front.png` | the first, still rider (17 Oct); no longer shipped |
| `sun-unused.png`, `clouds-unused.png` | not used: the scene already has its sun and clouds |

To rebuild the WebPs: clean each PNG with
`node scripts/clean-art-fringe.mjs <in.png> <out.png>`, then resize and
encode with sharp (WebP quality 84–86, alpha quality 90). The rider's run
follows this scene's road in scene percentages (`plum-route` in
`globals.css`), so a new scene with a different road needs new keyframes.

## The animated rider (18 Oct 2026)

`new/pose-*.png` are the four ChatGPT poses (left, right, approach, arrive);
`new/loop-*.mp4` are the Veo 3.1 Fast videos made from them in Google Flow
(Frames mode, the pose as start and end frame, solid green background,
720p, 8 s, 20 credits each). To rebuild the strips:

```bash
for p in left right approach arrive; do mkdir -p /tmp/strips/$p && ffmpeg -i docs/art/plum-promo/new/loop-$p.mp4 -vf fps=24 /tmp/strips/$p/f%03d.png; done
node scripts/build-rider-strips.mjs /tmp/strips public/photos/promo
```

then rename `rider-*.webp` to `plum-rider-*.webp` and update `PLUM_STRIPS`
(frames and frame widths, printed by the script) in `promo-card.tsx`.

The scene layers (`plum-scene-v2.webp` without its clouds, `plum-cloud-a|b`,
`plum-front-bushes`) were cut from the cleaned `scene.png`: the clouds by
their bounding boxes, the bushes as the greenish pixels below the far
lane's line. The route is `scripts/build-plum-promo-route.mjs`.
