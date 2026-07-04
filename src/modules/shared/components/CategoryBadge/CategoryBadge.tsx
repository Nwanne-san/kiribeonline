import Box from "@mui/material/Box";
import { KiribeTypography } from "@/modules/shared/components/ui";

type CategoryBadgeProps = {
  label: string;
  color?: string;
  variant?: "solid" | "outline";
};

export function CategoryBadge({ label, color = "#6B1D2A", variant = "outline" }: CategoryBadgeProps) {
  const isSolid = variant === "solid";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        px: 0.75,
        py: 0.25,
        borderRadius: 0.5,
        border: `1px solid ${color}`,
        bgcolor: isSolid ? color : "transparent",
        color: isSolid ? "#fff" : color,
        lineHeight: 1.4,
      }}
    >
      <KiribeTypography component="span" variant="caption" sx={{ color: "inherit", fontWeight: 700 }}>
        {label}
      </KiribeTypography>
    </Box>
  );
}
