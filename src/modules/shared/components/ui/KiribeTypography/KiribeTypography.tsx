"use client";

import Typography, { TypographyProps } from "@mui/material/Typography";

/** Kiribe typography — use instead of raw MUI Typography for brand variants. */
export function KiribeTypography(props: TypographyProps) {
  return <Typography {...props} />;
}
