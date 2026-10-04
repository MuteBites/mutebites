import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Doesn't depend on request data, so read once at module scope (same
// pattern Next.js recommends for custom ImageResponse fonts). The mark is
// the mascot group cut from the transparent logo by
// scripts/build-brand-assets.mjs — the full logo's wordmark and tagline
// are unreadable at icon sizes.
const markData = await readFile(join(process.cwd(), "public/brand/mark.png"));
const MARK_SRC = `data:image/png;base64,${markData.toString("base64")}`;
/** Width / height of public/brand/mark.png. */
const MARK_ASPECT = 854 / 683;
/** Same warm ivory as the startup splash, so the icon, splash and app read as one. */
const IVORY = "#f5eae1";
/** Brand plum, for the admin icon's caption pill. */
const PLUM = "#552c4a";

/**
 * Shared MuteBites app-icon: the mascot mark centred on ivory — used by
 * every generated icon route (app/icons/*, app/apple-icon.tsx) so the
 * source image only ever needs updating in one place.
 */
export function appIconResponse({
  width,
  height,
  borderRadius = 0,
  markScale = 0.84,
  label,
}: {
  width: number;
  height: number;
  /** 0 (default) for full-bleed icons — maskable/apple-touch icons where the OS applies its own mask. */
  borderRadius?: number;
  /**
   * Mark width as a fraction of the icon. Maskable icons must keep the
   * whole mark inside the central 80%-diameter circle Android may crop to,
   * which for this mark's aspect means about 0.6.
   */
  markScale?: number;
  /** Small caption under the mark (the admin app's "Admin"), so the two installed apps are told apart on a home screen. */
  label?: string;
}) {
  const markWidth = Math.round(width * markScale);
  const markHeight = Math.round(markWidth / MARK_ASPECT);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius,
          background: IVORY,
          flexDirection: "column",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_SRC} alt="" width={markWidth} height={markHeight} />
        {label && (
          <div
            style={{
              marginTop: Math.round(height * 0.03),
              padding: `${Math.round(height * 0.012)}px ${Math.round(width * 0.06)}px`,
              borderRadius: 999,
              background: PLUM,
              color: IVORY,
              fontSize: Math.round(height * 0.11),
              fontWeight: 700,
            }}
          >
            {label}
          </div>
        )}
      </div>
    ),
    { width, height },
  );
}
