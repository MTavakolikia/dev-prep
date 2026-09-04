import type { MetadataRoute } from "next";

// Dev Prep is a hash-routed SPA: every view lives behind `/#/...`, and per the
// sitemap spec URL fragments are not indexed separately — crawlers only see
// the canonical document at `/`. The sitemap therefore declares the canonical
// entry with a high priority; JSON-LD + Open Graph metadata carry the rest.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
