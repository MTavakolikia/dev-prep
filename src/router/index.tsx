'use client';

// ============================================================
// Dev Prep — hash router
// The sandbox exposes a single entry route, so the entire
// multi-page platform lives behind `#/...` URLs. Deep links,
// back/forward and query strings all work; each view is a
// feature module that maps 1:1 to a future real route.
// ============================================================

import {
  createContext, useContext, useSyncExternalStore, useCallback, useEffect, useMemo,
  type AnchorHTMLAttributes, type ReactNode, forwardRef,
} from 'react';

export interface Route {
  /** decoded path, e.g. "/articles/some-slug" */
  path: string;
  segments: string[];
  query: Record<string, string>;
  /** raw hash without "#", e.g. "/articles/x?tab=1" */
  raw: string;
}

function parseHash(raw: string): Route {
  const hash = raw.startsWith('#') ? raw.slice(1) : raw;
  const [pathPart, queryPart = ''] = hash.split('?');
  const path = pathPart || '/';
  const segments = path.split('/').filter(Boolean);
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v = ''] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    }
  }
  return { path, segments, query, raw: hash };
}

let currentRaw: string | null = null;

function getSnapshot(): string {
  if (typeof window === 'undefined') return '#/';
  // memoize raw string so useSyncExternalStore compares cheaply
  currentRaw = window.location.hash || '#/';
  return currentRaw;
}

// ------------------------------------------------------------
// History guard: Next.js App Router normalizes the address bar
// via history.pushState('/') from a mount effect. That would
// strip the hash this SPA is built on (without firing
// hashchange, so the view survives but the deep link dies).
// Whenever a hash-less URL is pushed/replaced, re-append the
// current app hash. URLs that already carry a '#' pass through.
// ------------------------------------------------------------
declare global {
  interface Window { __dfHistoryPatched?: boolean }
}
if (typeof window !== 'undefined' && !window.__dfHistoryPatched) {
  window.__dfHistoryPatched = true;
  const rawPush = history.pushState.bind(history);
  const rawReplace = history.replaceState.bind(history);
  const keepHash = (url: unknown): unknown => {
    if (typeof url === 'string' && url && !url.includes('#')) {
      const h = window.location.hash;
      if (h && h.length > 1) return url + h;
    }
    return url;
  };
  history.pushState = function (data, unused, url) {
    return rawPush(data, unused, keepHash(url) as string | URL | null);
  };
  history.replaceState = function (data, unused, url) {
    return rawReplace(data, unused, keepHash(url) as string | URL | null);
  };
}

const listeners = new Set<() => void>();
let listening = false;

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (!listening && typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => listeners.forEach((l) => l()));
    listening = true;
  }
  return () => listeners.delete(cb);
}

export function useRoute(): Route {
  const raw = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => '#/',
  );
  return useMemo(() => parseHash(raw), [raw]);
}

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
  if (window.location.hash === target) return;
  if (opts.replace) {
    const url = new URL(window.location.href);
    url.hash = target.slice(1);
    window.history.replaceState(null, '', url.toString());
    listeners.forEach((l) => l());
  } else {
    window.location.hash = target;
  }
  if (!opts.keepScroll) {
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
  }
}

export function buildPath(base: string, query: Record<string, string | number | undefined | null>): string {
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
}

// ---------------- Link ----------------
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  keepScroll?: boolean;
  replace?: boolean;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, keepScroll, replace, onClick, children, ...rest }, ref,
) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href, { keepScroll, replace });
  }, [href, keepScroll, replace, onClick]);
  return (
    <a ref={ref} href={`#${href.startsWith('/') ? href : `/${href}`}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
});

/** True when the current path matches href (prefix or exact). */
export function useIsActive(href: string, exact = false): boolean {
  const { path } = useRoute();
  const target = href.split('?')[0];
  if (exact) return path === target;
  if (target === '/') return path === '/';
  return path === target || path.startsWith(`${target}/`);
}

/** Navigate programmatically from event handlers. */
export function useRouter() {
  return { navigate, route: useRoute() };
}

// ---------------- route helpers ----------------
export interface RouterContextValue { route: Route }
const RouterContext = createContext<RouterContextValue>({ route: { path: '/', segments: [], query: {}, raw: '/' } });
export const RouterProvider = RouterContext.Provider;
export function useRouterContext() { return useContext(RouterContext); }
