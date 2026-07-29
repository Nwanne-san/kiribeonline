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
      className="my-8 md:my-10 mx-0 border-l-4 border-burgundy pl-5 md:pl-7"
    >
      <KiribeTypography
        component="blockquote"
        className="font-headline m-0 text-2xl leading-[1.3] font-semibold text-ink md:text-3xl"
      >
        {quote}
      </KiribeTypography>
      {attribution ? (
        <KiribeTypography
          component="figcaption"
          className="font-headline mt-3 text-[0.8125rem] font-bold tracking-[0.08em] text-mustard uppercase"
        >
          {attribution}
        </KiribeTypography>
      ) : null}
    </Box>
  );
}
