"use client";

import { useEffect, useRef, useState } from "react";

export type ReadingProgressProps = {
  /**
   * CSS selector for the element whose scroll-through progress is measured.
   * Defaults to `article` — matches the ArticleDetailPage body wrapper.
   */
  target?: string;
};

/**
 * 3px mustard progress bar pinned just under the sticky header, filling as the
 * reader scrolls through the article body (NOT the whole page — page-level
 * chrome such as the newsletter CTA and footer are excluded so the bar hits
 * 100% at the end of the story, which is what "done reading" means).
 *
 * rAF-throttled so scroll never runs the calculation more than once per frame.
 * Position (not animation) is fine under `prefers-reduced-motion`.
 */
export function ReadingProgress({ target = "article" }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el =
      typeof document !== "undefined"
        ? (document.querySelector(target) as HTMLElement | null)
        : null;
    if (!el) return;

    const compute = () => {
      rafRef.current = null;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      // Total scrollable distance across the article body: from the moment its
      // top reaches the top of the viewport, to the moment its bottom leaves.
      const total = Math.max(rect.height - viewport, 1);
      // How far we've scrolled *into* the article: 0 when the top is at the
      // viewport top, `total` when the bottom is at the viewport bottom.
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const ratio = total <= 1 ? (rect.bottom <= viewport ? 1 : 0) : scrolled / total;
      setProgress(Math.min(Math.max(ratio, 0), 1));
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        height: 3,
        // Sit above article content but below modals (drawer uses MUI z-index
        // 1200+). Header AppBar is sticky at ~1100.
        zIndex: 1099,
        pointerEvents: "none",
        // Faint mustard track so the unfilled remainder reads as a bar, not a
        // floating sliver. The whole thing stays hidden until reading starts.
        background: "color-mix(in srgb, var(--color-mustard) 22%, transparent)",
        opacity: progress > 0 ? 1 : 0,
        transition: "opacity var(--duration-base) var(--ease-out-soft)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "var(--color-mustard)",
          transform: `scaleX(${progress})`,
          transformOrigin: "left center",
          // scaleX instead of width — compositor-only, so the fill tracks the
          // scroll without layout work on every frame.
          transition: "transform var(--duration-fast) linear",
        }}
      />
    </div>
  );
}
