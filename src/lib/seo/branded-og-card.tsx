/**
 * Shared branded OG card renderer for `opengraph-image.tsx` routes.
 *
 * These files are compiled to Edge-runtime route handlers by Next; the JSX
 * inside `ImageResponse` is rendered by satori (not React), which supports a
 * narrow subset of CSS-in-flex layout. Keep this file self-contained so any
 * OG route can import + render without pulling in application code.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

export const CREAM = "#faf8f5";
export const BURGUNDY = "#6b1d2a";
export const MUSTARD = "#c9a227";
export const INK = "#1a1a1a";

/**
 * The Kiribé "K" mark, inlined from `public/brand/kiribe-mark.svg`.
 *
 * Copied rather than fetched: these routes render in the Edge runtime where a
 * network round-trip to our own `/brand` asset would add latency to every
 * social scrape and fail the whole card if it 404s.
 */
const KIRIBE_MARK_VIEWBOX = "35 402 306 400";
const KIRIBE_MARK_PATH =
  "M 206.3 411.9 C 201.3 414.2, 193.8 420.9, 190 426.5 C 187.7 429.9, 187.5 431, 188.2 433.5 C 188.7 435.1, 189.2 441.9, 189.2 448.5 C 189.4 466.4, 185 482.1, 174.3 502 C 166.2 517.1, 144.5 547.1, 143 545.3 C 142.6 544.9, 140.6 534.8, 138.6 523 C 135.3 504.4, 134.1 499.5, 129.3 487 C 118.6 458.8, 109.6 443, 105 444.5 C 94.8 447.7, 51.3 468.2, 50.3 470.2 C 44.7 481.2, 41.5 530.3, 44 565.5 C 48.3 624.9, 70.2 736.4, 82.9 763.6 C 93 785, 108.9 793.7, 139.5 794.6 L 155.5 795.1 173.3 786.7 L 191.1 778.3 194.6 772.6 C 196.5 769.5, 198 766.1, 198 765.2 C 198 764.3, 191.1 736.3, 182.6 703 C 174.1 669.7, 167.3 642.4, 167.4 642.2 C 167.9 641.7, 182.8 652.8, 191.8 660.2 C 209.9 675.3, 241 703.6, 274.3 735.3 L 289.8 750 298.6 746.9 C 317.8 740.2, 330.6 731.9, 333 724.6 C 334.3 720.4, 320.9 664.9, 315.9 654.1 C 305.5 631.5, 280.3 610.5, 237 588.2 C 227.9 583.5, 220.4 579.6, 220.2 579.5 C 220.1 579.4, 222.9 573.3, 226.4 565.9 C 235.8 546.2, 243.8 527, 251.7 505 C 263 473.8, 262.2 478.5, 258.3 463.8 C 250.7 434.7, 240.2 416.9, 227.4 411.5 C 222.2 409.4, 211.5 409.6, 206.3 411.9";

/** The Kiribé K, sized in px and tinted. Safe inside satori's SVG subset. */
export function kiribeMark({ size = 96, color = BURGUNDY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox={KIRIBE_MARK_VIEWBOX} fill={color}>
      <path d={KIRIBE_MARK_PATH} />
    </svg>
  );
}

type BrandedOgCardProps = {
  /** Small uppercase eyebrow above the title (e.g. "Kiribé Online", "Film Category"). */
  kicker?: string;
  title: string;
  /** Accent bar color — defaults to Kiribé mustard. */
  accentColor?: string;
  /** Bottom-line subtitle (optional). Defaults to blank. */
  subtitle?: string;
  /**
   * Render the Kiribé K alongside the accent bar. Used by pages that have no
   * artwork of their own (categories, tags) so the card is still unmistakably
   * Kiribé rather than a bare slab of text.
   */
  showMark?: boolean;
};

/**
 * Returns the JSX tree used inside `new ImageResponse(...)`. Callers pass it
 * as the first `ImageResponse` argument together with `OG_SIZE`.
 */
export function brandedOgCard({
  kicker,
  title,
  accentColor = MUSTARD,
  subtitle,
  showMark = false,
}: BrandedOgCardProps) {
  const trimmedTitle = title.length > 140 ? `${title.slice(0, 137)}…` : title;
  const fontSize = trimmedTitle.length > 80 ? 60 : 76;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: CREAM,
        padding: "72px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", height: 12, width: 200, backgroundColor: accentColor }} />
          {showMark ? kiribeMark({ size: 84, color: accentColor }) : null}
        </div>
        {kicker ? (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: BURGUNDY,
            }}
          >
            {kicker}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          fontSize,
          fontWeight: 700,
          lineHeight: 1.1,
          color: INK,
          maxWidth: 1000,
        }}
      >
        {trimmedTitle}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 4,
            color: BURGUNDY,
          }}
        >
          KIRIBÉ
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: INK,
              opacity: 0.7,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
