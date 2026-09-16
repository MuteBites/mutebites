import { appIconResponse } from "@/lib/app-icon";

// Served at /icons/icon-192 — referenced from app/manifest.ts as the
// "any" purpose Android/Chrome install icon. Generated from code (no
// image file needed) so it always matches the brand color exactly.
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 192, height: 192, fontSize: 116, borderRadius: 40 });
}
