import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {
  EditorialContainer,
  EditorialSection,
} from "@/modules/shared/components/ui";
import {
  ArchiveToolbarSkeleton,
  ArticleCardGridSkeleton,
} from "@/modules/shared/components/skeleton";

export default function ArchiveLoading() {
  return (
    <EditorialSection>
      <EditorialContainer>
        <Stack spacing={4}>
          <ArchiveToolbarSkeleton />
          <Grid container spacing={3}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                <ArticleCardGridSkeleton />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </EditorialContainer>
    </EditorialSection>
  );
}
