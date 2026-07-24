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

type BrandedOgCardProps = {
  /** Small uppercase eyebrow above the title (e.g. "Kiribé Online", "Film Category"). */
  kicker?: string;
  title: string;
  /** Accent bar color — defaults to Kiribé mustard. */
  accentColor?: string;
  /** Bottom-line subtitle (optional). Defaults to blank. */
  subtitle?: string;
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
        <div style={{ display: "flex", height: 12, width: 200, backgroundColor: accentColor }} />
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
