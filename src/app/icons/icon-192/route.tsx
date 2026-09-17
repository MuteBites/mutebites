import { appIconResponse } from "@/lib/app-icon";

// Served at /icons/icon-192 — referenced from app/manifest.ts as the
// "any" purpose Android/Chrome install icon. Generated from code (rather
// than a static file) so it's always cropped/rounded consistently from
// the one source logo.
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 192, height: 192, borderRadius: 40 });
}
