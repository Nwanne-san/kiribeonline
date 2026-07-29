import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { SkeletonBlock } from "../SkeletonBlock";

export function ArticleCardListSkeleton() {
  return (
    <Box component="article" aria-hidden>
      <Stack direction="row" spacing={2.5} className="py-6">
        <SkeletonBlock variant="rectangular" className="w-40 sm:w-44 h-28 sm:h-32 shrink-0" />
        <Stack spacing={1.25} className="flex-1 min-w-0">
          <Stack direction="row" spacing={1}>
            <SkeletonBlock width={56} height={20} className="rounded-full" />
            <SkeletonBlock width={80} height={20} className="rounded-full" />
          </Stack>
          <SkeletonBlock width="100%" height={24} />
          <SkeletonBlock width="85%" height={24} />
          <SkeletonBlock width="100%" height={16} />
          <SkeletonBlock width="92%" height={16} />
          <Stack direction="row" spacing={2} className="pt-2">
            <SkeletonBlock width={112} height={12} />
            <SkeletonBlock width={96} height={12} />
            <SkeletonBlock width={80} height={12} />
          </Stack>
        </Stack>
        <SkeletonBlock width={12} height={20} className="hidden sm:block self-center" />
      </Stack>
      <Divider />
    </Box>
  );
}
