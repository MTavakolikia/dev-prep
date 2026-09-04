// ============================================================
// Dev Prep — site constants shared by metadata routes, layout
// JSON-LD and tests. Pure module: safe in node, jsdom and edge.
// ============================================================

export const SITE_NAME = "Dev Prep — The Developer Operating System";
export const SITE_SHORT_NAME = "Dev Prep";
export const SITE_DESCRIPTION =
  "Learn modern frontend development, practice interview questions and track your growth. Articles, interview simulations, learning paths and a skill graph — built for developers who want to level up.";

/** Canonical origin for metadata, sitemap, robots and JSON-LD. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type JsonLdOrg = { "@type": "Organization"; "@id": string; name: string; url: string; logo: string };
export type JsonLdSite = {
  "@type": "WebSite"; "@id": string; url: string; name: string;
  description: string; publisher: { "@id": string }; inLanguage: string;
};

/** schema.org @graph: Organization + WebSite, connected via @id references. */
export function buildJsonLd(siteUrl: string = getSiteUrl()): { "@context": string; "@graph": [JsonLdOrg, JsonLdSite] } {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_SHORT_NAME,
        url: siteUrl,
        logo: `${siteUrl}/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en",
      },
    ],
  };
}
