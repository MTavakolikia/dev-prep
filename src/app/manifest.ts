import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dev Prep — The Developer Operating System",
    short_name: "Dev Prep",
    description:
      "Learn modern frontend development, practice interview questions and track your growth.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c11",
    theme_color: "#0c0c11",
    categories: ["education", "developer tools", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
