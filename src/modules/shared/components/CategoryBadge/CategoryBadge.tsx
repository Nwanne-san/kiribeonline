import Box from "@mui/material/Box";
import { cn } from "@/modules/shared/components/tw";

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
      className={cn(
        "font-headline inline-block px-2.5 py-1 text-xs leading-4 font-normal tracking-[0.1em] uppercase",
        !isSolid && "bg-transparent"
      )}
      style={{
        border: `1px solid ${color}`,
        backgroundColor: isSolid ? color : undefined,
        color: isSolid ? "#fff" : color,
      }}
    >
      {label}
    </Box>
  );
}
