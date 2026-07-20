"use client";

import { useEffect, useRef, useState } from "react";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export type BackToTopProps = {
  /**
   * Show threshold as a multiple of the viewport height. Defaults to 1.5 —
   * the button reveals once the reader is roughly a screen-and-a-half in,
   * which is far enough that scrolling back manually feels noticeably long.
   */
  showAfterViewports?: number;
};

/**
 * Bottom-right circular jump-to-top button. Appears after ~1.5 viewport heights
 * of scroll. Smooth scroll on desktop; `prefers-reduced-motion` collapses to
 * instant to respect user preference.
 */
export function BackToTop({ showAfterViewports = 1.5 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      rafRef.current = null;
      const threshold = window.innerHeight * showAfterViewports;
      setVisible(window.scrollY >= threshold);
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
  }, [showAfterViewports]);

  const handleClick = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      // aria-hidden until visible so screen readers skip a control that isn't
      // interactive; `inert` also stops focus from landing on it when hidden.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className="group focus-visible:outline-none"
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        cursor: visible ? "pointer" : "default",
        backgroundColor: "var(--color-burgundy)",
        color: "#fff",
        boxShadow: "var(--shadow-elevated)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition:
          "opacity var(--duration-base) var(--ease-out-soft), transform var(--duration-base) var(--ease-out-soft), background-color var(--duration-fast) ease",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 1100,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-burgundy-dark)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-burgundy)";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 0 3px var(--color-mustard), var(--shadow-elevated)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-elevated)";
      }}
    >
      <KeyboardArrowUpIcon sx={{ fontSize: 24 }} aria-hidden="true" />
    </button>
  );
}
