// ============================================================
// Dev Prep — production readiness units
// Health endpoint contract, metadata routes (robots / sitemap /
// manifest) and JSON-LD invariants.
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- health endpoint ----------------------------------------
const queryRaw = vi.fn();
vi.mock('@/lib/db', () => ({
  db: { $queryRaw: (...args: unknown[]) => queryRaw(...args) },
}));

import { GET as healthGET } from '@/app/api/route';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import manifest from '@/app/manifest';
import { buildJsonLd, getSiteUrl } from '@/lib/site';

describe('GET /api — health probe', () => {
  beforeEach(() => queryRaw.mockReset());

  it('returns 200 ok with db latency when the database responds', async () => {
    queryRaw.mockResolvedValue([{ 1: 1 }]);
    const res = await healthGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('up');
    expect(typeof body.latencyMs).toBe('number');
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('returns 503 degraded when the database is unreachable', async () => {
    queryRaw.mockImplementationOnce(async () => {
      throw new Error('connect ECONNREFUSED');
    });
    const res = await healthGET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.db).toBe('down');
  });
});

describe('robots route', () => {
  it('allows crawling the app and blocks the API surface', () => {
    const r = robots();
    expect(r.rules).toHaveLength(1);
    const rule = (r.rules as { userAgent: string; allow: string; disallow: string[] }[])[0];
    expect(rule.userAgent).toBe('*');
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toContain('/api/');
  });

  it('points to the sitemap', () => {
    const r = robots();
    expect(String((r as { sitemap: string }).sitemap).endsWith('/sitemap.xml')).toBe(true);
  });
});

describe('sitemap route', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
    vi.resetModules();
  });

  it('emits the canonical document with SEO attributes', async () => {
    const mod = await import('@/app/sitemap');
    const entries = mod.default();
    expect(entries).toHaveLength(1);
    expect(entries[0].changeFrequency).toBe('daily');
    expect(entries[0].priority).toBe(1);
    expect(typeof entries[0].url).toBe('string');
  });

  it('honours NEXT_PUBLIC_SITE_URL', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://devprep.example.com';
    vi.resetModules();
    const mod = await import('@/app/sitemap');
    expect(mod.default()[0].url).toBe('https://devprep.example.com/');
  });
});

describe('web manifest', () => {
  it('is a valid installable PWA manifest', () => {
    const m = manifest();
    expect(m.name).toContain('Dev Prep');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/');
    expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    const icons = m.icons ?? [];
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    // maskable icon required for Android adaptive launchers
    expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });
});

describe('site metadata + JSON-LD contract', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
    vi.resetModules();
  });

  it('getSiteUrl defaults to localhost', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const mod = await import('@/lib/site');
    expect(mod.getSiteUrl()).toBe('http://localhost:3000');
  });

  it('getSiteUrl honours NEXT_PUBLIC_SITE_URL', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://devprep.example.com';
    vi.resetModules();
    const mod = await import('@/lib/site');
    expect(mod.getSiteUrl()).toBe('https://devprep.example.com');
  });

  it('builds a connected @graph of Organization + WebSite', () => {
    const ld = buildJsonLd('https://devprep.example.com');
    expect(ld['@context']).toBe('https://schema.org');
    const [org, site] = ld['@graph'];
    expect(org['@type']).toBe('Organization');
    expect(org.logo).toBe('https://devprep.example.com/icon-512.png');
    expect(site['@type']).toBe('WebSite');
    // publisher link resolves back to the org @id
    expect(site.publisher['@id']).toBe(org['@id']);
    expect(site.url).toBe('https://devprep.example.com');
    expect(site.name.length).toBeGreaterThan(0);
  });
});
