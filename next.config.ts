import type { NextConfig } from "next";

// Security headers applied to every response. CSP is intentionally not
// forced here: Next.js dev + inline styles need a permissive policy and a
// broken CSP is worse than none. The headers below are the safe baseline.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // typecheck passes with zero errors — keep the build honest
  reactStrictMode: false,
  // Don't advertise the framework version
  poweredByHeader: false,
  // Allow Server Actions behind the preview proxy (x-forwarded-host differs from origin)
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.space-z.ai",
        "*.fcapp.run",
      ],
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
