import Box from "@mui/material/Box";
import { KiribeTypography } from "@/modules/shared/components/ui";

export type PullQuoteProps = {
  quote: string;
  attribution?: string;
};

/**
 * Branded pull quote (PLAN-EMBEDS Step 3): burgundy rule, Outfit display type
 * for the quote, mustard attribution — per DESIGN.md article typography.
 * Distinct from a standard blockquote.
 */
export function PullQuote({ quote, attribution }: PullQuoteProps) {
  if (!quote) return null;

  return (
    <Box
      component="figure"
      sx={{
        my: { xs: 4, md: 5 },
        mx: 0,
        pl: { xs: 2.5, md: 3.5 },
        borderLeft: "4px solid",
        borderColor: "var(--color-burgundy)",
      }}
    >
      <KiribeTypography
        component="blockquote"
        sx={{
          m: 0,
          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
          fontWeight: 600,
          fontSize: { xs: "1.5rem", md: "1.875rem" },
          lineHeight: 1.3,
          color: "#1F2937",
        }}
      >
        {quote}
      </KiribeTypography>
      {attribution ? (
        <KiribeTypography
          component="figcaption"
          sx={{
            mt: 1.5,
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-mustard)",
          }}
        >
          {attribution}
        </KiribeTypography>
      ) : null}
    </Box>
  );
}
