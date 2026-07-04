import * as React from "react";

export type IllustrationProps = React.SVGProps<SVGSVGElement>;

/**
 * Shared shell for Kiribé editorial line-art illustrations.
 *
 * Every illustration draws on a 240×180 canvas, stretches to its parent's
 * width, is purely decorative (`aria-hidden`), and themes itself from the
 * brand CSS custom properties so it stays in sync with light/dark surfaces
 * without any network request.
 */
export function IllustrationBase({
  children,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 180"
      width="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Default ink (burgundy) stroke props shared by every illustration. */
export const inkStroke = {
  stroke: "var(--color-burgundy)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

/** Single mustard accent stroke props. */
export const accentStroke = {
  stroke: "var(--color-mustard)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

/** Soft background blob tint drawn behind the composition. */
export function BackgroundBlob({
  cx = 120,
  cy = 94,
  rx = 86,
  ry = 62,
}: {
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="var(--color-burgundy)"
      opacity={0.06}
    />
  );
}
