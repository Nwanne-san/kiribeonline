import Skeleton, { SkeletonProps } from "@mui/material/Skeleton";

/**
 * Base skeleton block — MUI's pulse plus a sweeping "shimmer" sheen overlay for
 * a more premium loading feel. See `.skeleton-shimmer` in tailwind.css.
 */
export function SkeletonBlock({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      variant="rounded"
      {...props}
      className={["skeleton-shimmer", className].filter(Boolean).join(" ")}
    />
  );
}
