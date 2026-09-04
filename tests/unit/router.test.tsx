// ============================================================
// Dev Prep — hash router unit tests
// Covers URL parsing via useRoute, programmatic navigation,
// the Link component and active-route matching.
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, renderHook, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate, buildPath, Link, useRoute, useIsActive } from '@/router';

function hashOf(): string {
  return window.location.hash;
}

beforeEach(() => {
  // NOTE: the router patches history.pushState/replaceState to re-append
  // string URLs' hashes. Passing a URL object bypasses the patch so the
  // hash is genuinely cleared between tests.
  window.history.replaceState(null, '', new URL('http://localhost:3000/'));
});

describe('navigate()', () => {
  it('sets the location hash for a plain path', () => {
    navigate('/articles');
    expect(hashOf()).toBe('#/articles');
  });

  it('normalizes paths without a leading slash', () => {
    navigate('dashboard');
    expect(hashOf()).toBe('#/dashboard');
  });

  it('accepts an explicit # prefix', () => {
    navigate('#/interview');
    expect(hashOf()).toBe('#/interview');
  });

  it('is a no-op when the hash is unchanged', () => {
    navigate('/articles');
    const spy = vi.spyOn(window.history, 'replaceState');
    navigate('/articles');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('replace mode rewrites history without adding an entry', () => {
    navigate('/articles');
    const spy = vi.spyOn(window.history, 'replaceState');
    navigate('/articles/x', { replace: true });
    expect(hashOf()).toBe('#/articles/x');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('buildPath()', () => {
  it('appends encoded query params', () => {
    expect(buildPath('/search', { q: 'react hooks', page: 2 })).toBe('/search?q=react%20hooks&page=2');
  });

  it('drops undefined, null and empty-string values', () => {
    expect(buildPath('/articles', { tech: 'react', page: undefined, q: null, sort: '' })).toBe('/articles?tech=react');
  });

  it('returns the bare path when every value is filtered out', () => {
    expect(buildPath('/articles', { page: undefined })).toBe('/articles');
  });

  it('round-trips through useRoute parsing', () => {
    const built = buildPath('/search', { q: 'a&b=c' });
    navigate(built);
    // rendered below via hook assertion
    const { result } = renderHook(() => useRoute());
    expect(result.current.query.q).toBe('a&b=c');
  });
});

describe('useRoute()', () => {
  it('parses path, segments and query from the hash', () => {
    window.location.hash = '#/articles/my-slug?tab=2&sort=new';
    const { result } = renderHook(() => useRoute());
    expect(result.current.path).toBe('/articles/my-slug');
    expect(result.current.segments).toEqual(['articles', 'my-slug']);
    expect(result.current.query).toEqual({ tab: '2', sort: 'new' });
    expect(result.current.raw).toBe('/articles/my-slug?tab=2&sort=new');
  });

  it('falls back to "/" for the empty hash', () => {
    window.location.hash = '';
    const { result } = renderHook(() => useRoute());
    expect(result.current.path).toBe('/');
    expect(result.current.segments).toEqual([]);
  });

  it('decodes percent-encoded query values', () => {
    window.location.hash = '#/search?q=hello%20world';
    const { result } = renderHook(() => useRoute());
    expect(result.current.query.q).toBe('hello world');
  });

  it('treats "+" as a space in query values', () => {
    window.location.hash = '#/search?q=react+hooks';
    const { result } = renderHook(() => useRoute());
    expect(result.current.query.q).toBe('react hooks');
  });

  it('updates after navigation', async () => {
    const { result } = renderHook(() => useRoute());
    act(() => {
      navigate('/learning-paths');
    });
    await waitFor(() => expect(result.current.path).toBe('/learning-paths'));
  });
});

describe('Link', () => {
  it('renders an anchor whose href carries the hash scheme', () => {
    render(<Link href="/articles">Browse</Link>);
    const a = screen.getByRole('link', { name: 'Browse' });
    expect(a).toHaveAttribute('href', '#/articles');
  });

  it('navigates on a plain left click', async () => {
    const user = userEvent.setup();
    render(<Link href="/interview">Start</Link>);
    await user.click(screen.getByRole('link', { name: 'Start' }));
    expect(hashOf()).toBe('#/interview');
  });

  it('does not hijack modified clicks (ctrl/cmd open in new tab)', () => {
    render(<Link href="/interview">Start</Link>);
    const a = screen.getByRole('link', { name: 'Start' });
    let prevented = false;
    a.addEventListener('click', (e) => { prevented = e.defaultPrevented; });
    fireEvent.click(a, { ctrlKey: true });
    // The router must step aside and let the browser handle the new tab —
    // i.e. NOT preventDefault. (jsdom then performs its own default hash
    // navigation, which is the browser's business, not the router's.)
    expect(prevented).toBe(false);
  });

  it('respects onClick handlers that preventDefault', () => {
    // fireEvent dispatches the raw event (jsdom honors preventDefault for
    // the anchor's default action; user-event would follow the href itself).
    render(
      <Link href="/interview" onClick={(e) => e.preventDefault()}>
        Start
      </Link>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Start' }));
    expect(hashOf()).not.toBe('#/interview');
  });
});

describe('useIsActive()', () => {
  function Probe({ href, exact }: { href: string; exact?: boolean }) {
    const active = useIsActive(href, exact);
    return <span data-testid="probe">{active ? 'yes' : 'no'}</span>;
  }

  // render one probe at a time and read its rendered verdict
  function probeActive(href: string, exact?: boolean): 'yes' | 'no' {
    const { unmount } = render(<Probe href={href} exact={exact} />);
    const state = screen.getByTestId('probe').textContent as 'yes' | 'no';
    unmount();
    return state;
  }

  it('matches the exact path', () => {
    window.location.hash = '#/articles';
    expect(probeActive('/articles')).toBe('yes');
  });

  it('matches nested paths as a prefix', () => {
    window.location.hash = '#/articles/react-batching';
    expect(probeActive('/articles')).toBe('yes');
  });

  it('does not match unrelated prefixes', () => {
    window.location.hash = '#/articles-page';
    expect(probeActive('/articles')).toBe('no');
  });

  it('treats "/" as active only on the root path', () => {
    window.location.hash = '#/articles';
    expect(probeActive('/')).toBe('no');
    window.location.hash = '#/';
    expect(probeActive('/')).toBe('yes');
  });

  it('ignores the query part of the href', () => {
    window.location.hash = '#/search';
    expect(probeActive('/search?q=react')).toBe('yes');
  });

  it('with exact=true, rejects nested paths', () => {
    window.location.hash = '#/articles/react-batching';
    expect(probeActive('/articles', true)).toBe('no');
  });
});
