import type { MetadataRoute } from "next";

// Two install profiles: the student app (opens Home) and the admin app
// (opens /admin, its own icon). Served as route handlers rather than an
// app/manifest.ts file because file-based metadata outranks a layout's
// `manifest` field — the admin layout couldn't point elsewhere otherwise.
// Root layout links /manifest.webmanifest, the admin layout overrides it
// with /admin.webmanifest. Both URLs skip the sign-in guard (src/proxy.ts).

const BASE = {
  display: "standalone",
  // Android's own launch screen (this colour + the icon) hands straight
  // over to the in-app splash, which uses the same ivory.
  background_color: "#f5eae1",
  theme_color: "#faf3ec",
} satisfies MetadataRoute.Manifest;

export const STUDENT_MANIFEST: MetadataRoute.Manifest = {
  ...BASE,
  id: "/",
  name: "MuteBites",
  short_name: "MuteBites",
  description: "Good food. Campus mood. Food delivery for VIT-AP students.",
  start_url: "/",
  icons: [
    { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export const ADMIN_MANIFEST: MetadataRoute.Manifest = {
  ...BASE,
  id: "/admin",
  name: "MuteBites Admin",
  short_name: "MB Admin",
  description: "MuteBites operations: orders, restaurants and students.",
  start_url: "/admin",
  scope: "/admin",
  icons: [
    { src: "/icons/admin-192", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/admin-512", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/admin-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function manifestResponse(manifest: MetadataRoute.Manifest) {
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
