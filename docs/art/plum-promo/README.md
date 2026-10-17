# MuteBites Plum promo art (17 Oct 2026)

Source art for Home's promo card under the MuteBites Plum theme
(`PlumScene` in `src/components/home/promo-card.tsx`). Generated with
ChatGPT from the prompts in the session that built it, by the client's
choice.

| File | Used as |
|---|---|
| `scene.png` | `public/photos/promo/plum-scene.webp` (1200 px wide) |
| `rider-side.png` | `public/photos/promo/plum-rider.webp` (trimmed, 360 px) |
| `rider-front.png` | `public/photos/promo/plum-rider-front.webp` (trimmed, 360 px) |
| `sun-unused.png`, `clouds-unused.png` | not used: the scene already has its sun and clouds |

To rebuild the WebPs: clean each PNG with
`node scripts/clean-art-fringe.mjs <in.png> <out.png>`, then resize and
encode with sharp (WebP quality 84–86, alpha quality 90). The rider's run
follows this scene's road in scene percentages (`plum-route` in
`globals.css`), so a new scene with a different road needs new keyframes.
