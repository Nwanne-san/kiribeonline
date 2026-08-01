"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";

/**
 * Horizontal snap carousel on small screens that becomes a plain CSS grid from
 * `breakpoint` up.
 *
 * Long vertical stacks of cards are a poor mobile experience — a reader has to
 * scroll past six full-width cards to reach the next section. Swiping sideways
 * keeps a whole module inside one screen.
 *
 * One container, one set of children: the obvious alternative (render a
 * carousel *and* a grid, hiding one per breakpoint) duplicates every card in
 * the DOM, and browsers still fetch images inside `display: none` subtrees — so
 * every homepage module would download its artwork twice.
 *
 * Layout notes:
 * - The strip is pulled out to the viewport edge with a negative margin and
 *   given the container gutter back as padding, so cards bleed correctly but
 *   the first one still lines up with the headline above it.
 * - `scrollPaddingInline` matches that gutter so a snapped card lands on the
 *   text margin instead of flush against the screen edge.
 * - A trailing `::after` spacer guarantees room after the last card:
 *   `padding-right` on a scroll container is honoured inconsistently across
 *   engines, so an inline spacer is the portable way to get it.
 */

/** Container gutter (px) — matches `editorial-container` at the xs breakpoint. */
const GUTTER = 16;

type Breakpoint = "sm" | "md" | "base";

type MobileCarouselProps = {
  children: ReactNode;
  /** Breakpoint at which the carousel becomes a grid. */
  breakpoint?: Breakpoint;
  /**
   * Grid columns above `breakpoint`, keyed by breakpoint name. Mirrors what the
   * section used before it gained a carousel.
   */
  columns?: Partial<Record<Breakpoint | "lg", number>>;
  /** Gap between cards, in MUI spacing units. */
  gap?: number;
  /** Track width per card on mobile. Defaults to a peeking ~78vw. */
  itemWidth?: string;
};

function toTemplate(columns: MobileCarouselProps["columns"]) {
  const template: Record<string, string> = {};
  for (const [bp, count] of Object.entries(columns ?? {})) {
    template[bp] = `repeat(${count}, minmax(0, 1fr))`;
  }
  return template;
}

export function MobileCarousel({
  children,
  breakpoint = "md",
  columns = { md: 3 },
  gap = 2,
  itemWidth = "78vw",
}: MobileCarouselProps) {
  return (
    <Box
      sx={{
        display: { xs: "flex", [breakpoint]: "grid" },
        gridTemplateColumns: toTemplate(columns),
        gap,
        overflowX: { xs: "auto", [breakpoint]: "visible" },
        scrollSnapType: "x mandatory",
        scrollPaddingInline: `${GUTTER}px`,
        mx: { xs: `-${GUTTER}px`, [breakpoint]: 0 },
        px: { xs: `${GUTTER}px`, [breakpoint]: 0 },
        pb: { xs: 2, [breakpoint]: 0 },
        // Hide the scrollbar — the peeking next card is the affordance.
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "& > *": {
          flex: "0 0 auto",
          width: { xs: itemWidth, [breakpoint]: "auto" },
          maxWidth: { xs: 320, [breakpoint]: "none" },
          scrollSnapAlign: "start",
        },
        // Trailing gutter that survives in every engine. Collapsed once the
        // grid takes over, where it would otherwise occupy a whole column.
        "&::after": {
          content: '""',
          display: { xs: "block", [breakpoint]: "none" },
          flex: "0 0 auto",
          width: "1px",
        },
      }}
    >
      {children}
    </Box>
  );
}
