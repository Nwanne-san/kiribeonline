"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Breakpoints in **rem**, mirroring the `--breakpoint-*` tokens in
 * `src/theme/tailwind.css` and `breakpointValues` in `src/theme/muiTheme.ts`.
 *
 * rem (not px) because that is what Tailwind v4 emits: a rem media query keys
 * off the browser's default font size, so readers who enlarge theirs get the
 * roomier layout sooner. Mixing units across the two stacks would put them back
 * out of step for exactly those readers.
 *
 * Never hardcode a width in a `matchMedia` call — use these so all three
 * definitions stay in lockstep.
 *
 * Note `xs`: Tailwind's `xs` is a 24rem min-width query, while MUI's `xs` is
 * its zero-floor. It is the one key the two stacks cannot agree on; `up("xs")`
 * here follows Tailwind.
 */
export const BREAKPOINTS = {
  xs: 24,
  sm: 30,
  md: 48,
  base: 64,
  lg: 80,
  xl: 90,
  "2xl": 100,
  "3xl": 120,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Matches Tailwind's max-width epsilon and MUI's configured `step`. */
const STEP = 0.02;

/**
 * Subscribes to a media query.
 *
 * This deliberately does not wrap MUI's `useMediaQuery`: it is used by
 * Tailwind-only components (the admin shell among them) that should not have to
 * pull in the MUI theme, and it must keep working after MUI is fully migrated
 * out. Both read the same `BREAKPOINTS`, so they cannot drift.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect` so the first
 * client render already reflects the real viewport — an effect would paint the
 * `false` (mobile) branch and then swap, which is a visible flash for any
 * render-time consumer. On the server it returns `false`, so SSR markup is
 * mobile-first and widens on hydration, never the reverse.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True at or above `key` — the mobile-first direction. Prefer this. */
export function useBreakpointUp(key: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[key]}rem)`);
}

/**
 * True below `key`. Use only where a value must be computed in JS (e.g. MUI's
 * `fullScreen` dialog prop); for show/hide, prefer CSS utilities so nothing
 * depends on hydration.
 */
export function useBreakpointDown(key: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[key] - STEP}rem)`);
}
