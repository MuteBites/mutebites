import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MuteBites",
    short_name: "MuteBites",
    description: "Good food. Campus mood. Food delivery for VIT-AP students.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf3ec",
    theme_color: "#faf3ec",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
