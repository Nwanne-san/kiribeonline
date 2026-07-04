"use client";

import Box from "@mui/material/Box";
import { RichText } from "@payloadcms/richtext-lexical/react";

export type RichTextRendererProps = {
  // Payload Lexical serialized state
  content?: Record<string, unknown> | null;
  className?: string;
};

/** Render Payload Lexical JSON for article bodies. */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) return null;

  return (
    <Box
      className={className}
      sx={{
        "& p": { mb: 2, lineHeight: 1.7 },
        "& h2, & h3": { mt: 3, mb: 1.5, fontFamily: "var(--font-headline)" },
        "& a": { color: "primary.main", textDecoration: "underline" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
      }}
    >
      <RichText data={content as never} />
    </Box>
  );
}
