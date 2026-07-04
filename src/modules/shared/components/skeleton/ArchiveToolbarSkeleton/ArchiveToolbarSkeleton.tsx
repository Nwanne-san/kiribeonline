import Stack from "@mui/material/Stack";
import { SkeletonBlock } from "../SkeletonBlock";

export function ArchiveToolbarSkeleton() {
  return (
    <Stack spacing={2} aria-hidden>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <SkeletonBlock height={48} sx={{ flex: 1, borderRadius: 1 }} />
        <Stack direction="row" spacing={1}>
          <SkeletonBlock width={40} height={40} />
          <SkeletonBlock width={40} height={40} />
        </Stack>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} width={80} height={36} sx={{ borderRadius: 999 }} />
        ))}
      </Stack>
      <SkeletonBlock width={96} height={16} />
    </Stack>
  );
}
