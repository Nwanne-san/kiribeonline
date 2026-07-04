import { KIRIBE_ACCENT_IDS, KIRIBE_GLYPHS, KIRIBE_VIEWBOX } from "../kiribe-glyphs";
import styles from "./BrandMark.module.css";

const ACCENT_IDS = new Set<string>(KIRIBE_ACCENT_IDS);

export interface BrandMarkProps {
  /** Rendered height in px (width scales to the wordmark aspect ratio). */
  height?: number;
  /** "brand" = burgundy (default), "light" = cream for dark surfaces. */
  tone?: "brand" | "light";
  /** When true, accents flick — the header "wink" during route transitions. */
  loading?: boolean;
  className?: string;
}

/**
 * Inline SVG Kiribé wordmark. Crisp at every size (fixes scaling a 4375px PNG to
 * 40px) and tintable via `currentColor`, so it can wink during navigation.
 */
export function BrandMark({
  height = 40,
  tone = "brand",
  loading = false,
  className,
}: BrandMarkProps) {
  const classes = [
    styles.mark,
    tone === "light" && styles.light,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={{ height }}>
      <svg
        className={styles.svg}
        viewBox={KIRIBE_VIEWBOX}
        fill="currentColor"
        role="img"
        aria-label="Kiribé"
      >
        {KIRIBE_GLYPHS.map((g) => (
          <path
            key={g.id}
            className={ACCENT_IDS.has(g.id) ? styles.accent : undefined}
            d={g.d}
          />
        ))}
      </svg>
    </span>
  );
}
