import {
  KIRIBE_ACCENT_IDS,
  KIRIBE_GLYPHS,
  KIRIBE_MARK_PATH,
  KIRIBE_MARK_VIEWBOX,
  KIRIBE_VIEWBOX,
} from "../kiribe-glyphs";
import styles from "./KiribeLoader.module.css";

type KiribeLoaderSize = "sm" | "md" | "lg";

const SIZE_HEIGHT: Record<KiribeLoaderSize, number> = {
  sm: 24, // mark-only "K"
  md: 80,
  lg: 120,
};

/** Stagger order: letter bodies left-to-right, then accents/tittles flick in last. */
const ENTRANCE_ORDER = [
  "k",
  "i1",
  "r",
  "i2",
  "b",
  "e",
  "i1-accent",
  "i2-dot",
  "e-accent",
];
const STAGGER_MS = 70;

const ACCENT_IDS = new Set<string>(KIRIBE_ACCENT_IDS);

function delayFor(id: string): string {
  const i = ENTRANCE_ORDER.indexOf(id);
  return `${(i < 0 ? 0 : i) * STAGGER_MS}ms`;
}

export interface KiribeLoaderProps {
  size?: KiribeLoaderSize;
  className?: string;
  /** Accessible label announced to assistive tech. */
  label?: string;
}

/**
 * Signature Kiribé loading animation — the hand-drawn wordmark stamped in glyph
 * by glyph, accents flicking in last, looping softly. Pure CSS (no JS timers),
 * reduced-motion aware. `sm` renders the compact "K" mark only.
 */
export function KiribeLoader({
  size = "md",
  className,
  label = "Loading",
}: KiribeLoaderProps) {
  const height = SIZE_HEIGHT[size];
  const rootClass = [styles.root, className].filter(Boolean).join(" ");

  if (size === "sm") {
    return (
      <span
        className={rootClass}
        role="status"
        aria-label={label}
        style={{ height }}
      >
        <svg
          className={styles.svg}
          viewBox={KIRIBE_MARK_VIEWBOX}
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path className={styles.glyph} d={KIRIBE_MARK_PATH} />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={rootClass}
      role="status"
      aria-label={label}
      style={{ height }}
    >
      <svg
        className={styles.svg}
        viewBox={KIRIBE_VIEWBOX}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        {KIRIBE_GLYPHS.map((g) => (
          <path
            key={g.id}
            className={ACCENT_IDS.has(g.id) ? styles.accent : styles.glyph}
            d={g.d}
            style={{ animationDelay: delayFor(g.id) }}
          />
        ))}
      </svg>
    </span>
  );
}
