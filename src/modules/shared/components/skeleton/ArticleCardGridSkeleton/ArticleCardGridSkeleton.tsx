import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { SkeletonBlock } from "../SkeletonBlock";

export function ArticleCardGridSkeleton() {
  return (
    <Box component="article" aria-hidden>
      <Stack spacing={1.5}>
        <SkeletonBlock variant="rectangular" sx={{ width: "100%", aspectRatio: "16/10" }} />
        <SkeletonBlock width={56} height={12} />
        <SkeletonBlock width="100%" height={24} />
        <SkeletonBlock width="85%" height={24} />
        <SkeletonBlock width="100%" height={16} />
        <SkeletonBlock width="75%" height={16} />
        <Stack direction="row" spacing={1.5}>
          <SkeletonBlock width={96} height={12} />
          <SkeletonBlock width={64} height={12} />
        </Stack>
      </Stack>
    </Box>
  );
}
