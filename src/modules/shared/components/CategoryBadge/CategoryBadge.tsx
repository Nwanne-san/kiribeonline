import Box from "@mui/material/Box";

type CategoryBadgeProps = {
  label: string;
  color?: string;
  variant?: "solid" | "outline";
};

/**
 * Category tag — Figma V5: sharp-edged, Outfit, uppercase with 0.1em tracking.
 * `solid` = filled accent chip (card overlays); `outline` = bordered accent chip (tag lists).
 */
export function CategoryBadge({ label, color = "#7F0400", variant = "outline" }: CategoryBadgeProps) {
  const isSolid = variant === "solid";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontFamily: "var(--font-headline), 'Outfit', sans-serif",
        fontSize: "0.75rem",
        fontWeight: 400,
        letterSpacing: "0.1em",
        lineHeight: "1rem",
        textTransform: "uppercase",
        px: 1.25,
        py: 0.5,
        borderRadius: 0,
        border: `1px solid ${color}`,
        bgcolor: isSolid ? color : "transparent",
        color: isSolid ? "#fff" : color,
      }}
    >
      {label}
    </Box>
  );
}
