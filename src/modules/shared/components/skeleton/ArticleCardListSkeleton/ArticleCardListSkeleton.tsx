import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { SkeletonBlock } from "../SkeletonBlock";

export function ArticleCardListSkeleton() {
  return (
    <Box component="article" aria-hidden>
      <Stack direction="row" spacing={2.5} sx={{ py: 3 }}>
        <SkeletonBlock variant="rectangular" sx={{ width: { xs: 160, sm: 176 }, height: { xs: 112, sm: 128 }, flexShrink: 0 }} />
        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1}>
            <SkeletonBlock width={56} height={20} sx={{ borderRadius: 999 }} />
            <SkeletonBlock width={80} height={20} sx={{ borderRadius: 999 }} />
          </Stack>
          <SkeletonBlock width="100%" height={24} />
          <SkeletonBlock width="85%" height={24} />
          <SkeletonBlock width="100%" height={16} />
          <SkeletonBlock width="92%" height={16} />
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <SkeletonBlock width={112} height={12} />
            <SkeletonBlock width={96} height={12} />
            <SkeletonBlock width={80} height={12} />
          </Stack>
        </Stack>
        <SkeletonBlock width={12} height={20} sx={{ display: { xs: "none", sm: "block" }, alignSelf: "center" }} />
      </Stack>
      <Divider />
    </Box>
  );
}
