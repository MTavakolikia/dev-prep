import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { buildJsonLd, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const siteUrl = getSiteUrl();

// Structured data for rich results (sitelinks searchbox, org knowledge panel).
// Static in the root layout: Dev Prep is a hash-routed SPA with one canonical document.
const jsonLd = buildJsonLd(siteUrl);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  title: {
    default: "Dev Prep — The Developer Operating System",
    template: "%s · Dev Prep",
  },
  description: SITE_DESCRIPTION,
  keywords: ["frontend", "react", "javascript", "typescript", "interview preparation", "learning paths", "developer education"],
  authors: [{ name: "Dev Prep" }],
  openGraph: {
    title: SITE_NAME,
    description: "Learn. Practice. Prepare. Become the developer companies want to hire.",
    siteName: "Dev Prep",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dev Prep — The Developer Operating System",
    description: "Learn. Practice. Prepare. Become the developer companies want to hire.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c11" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
