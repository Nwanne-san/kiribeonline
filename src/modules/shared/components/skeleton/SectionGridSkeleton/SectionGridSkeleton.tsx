import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { ArticleCardGridSkeleton } from "../ArticleCardGridSkeleton";
import { SkeletonBlock } from "../SkeletonBlock";

type SectionGridSkeletonProps = {
  columns?: 2 | 3;
  count?: number;
};

export function SectionGridSkeleton({ columns = 3, count = 3 }: SectionGridSkeletonProps) {
  return (
    <Box component="section" className="py-12" aria-hidden>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" className="mb-8">
        <Stack spacing={1}>
          <SkeletonBlock width={128} height={32} />
          <SkeletonBlock width={40} height={2} className="bg-mustard-light" />
        </Stack>
        <SkeletonBlock width={96} height={16} />
      </Stack>
      <Grid container spacing={3}>
        {Array.from({ length: count }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, md: 6, base: columns === 3 ? 4 : 6 }}>
            <ArticleCardGridSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
