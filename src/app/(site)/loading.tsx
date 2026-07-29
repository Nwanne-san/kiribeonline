import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import {
  EditorialContainer,
  EditorialSection,
} from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";

export default function HomeLoading() {
  return (
    <>
      <EditorialSection className="pt-8 md:pt-12 pb-10 md:pb-16">
        <EditorialContainer>
          <Grid container spacing={{ xs: 4, base: 6 }}>
            <Grid size={{ xs: 12, base: 8 }}>
              <Stack spacing={2.5}>
                <Skeleton
                  variant="rectangular"
                  className="w-full aspect-video rounded"
                />
                <Skeleton width={140} height={16} />
                <Skeleton width="90%" height={48} />
                <Skeleton width="80%" height={48} />
                <Skeleton width="95%" height={20} />
                <Skeleton width="85%" height={20} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, base: 4 }}>
              <Stack spacing={1}>
                <Skeleton width={160} height={28} />
                <Skeleton width={48} height={4} className="mb-4" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Stack key={i} spacing={0.5} className="py-3.5 border-b border-border">
                    <Skeleton width={80} height={12} />
                    <Skeleton width="95%" height={20} />
                    <Skeleton width="70%" height={20} />
                  </Stack>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </EditorialContainer>
      </EditorialSection>

      <EditorialSection className="bg-surface-alt py-12 md:py-16">
        <EditorialContainer>
          <Stack alignItems="center" spacing={1} className="mb-6 md:mb-8">
            <Skeleton width={200} height={32} />
            <Skeleton width={48} height={4} />
            <Skeleton width={180} height={16} />
          </Stack>
          <Box className="flex gap-4 overflow-x-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                className="shrink-0 w-[180px] sm:w-[200px] h-[320px] sm:h-[356px] rounded-lg"
              />
            ))}
          </Box>
        </EditorialContainer>
      </EditorialSection>

      {[0, 1, 2].map((s) => (
        <EditorialSection
          key={s}
          className={cn(
            "py-10 md:py-16",
            s % 2 === 1 ? "bg-surface-alt" : "bg-surface"
          )}
        >
          <EditorialContainer>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" className="mb-6">
              <Box>
                <Skeleton width={140} height={28} />
                <Skeleton width={48} height={4} className="mt-2" />
              </Box>
              <Skeleton width={70} height={16} />
            </Stack>
            <Grid container spacing={{ xs: 3, md: 2 }}>
              {[0, 1, 2].map((c) => (
                <Grid size={{ xs: 12, md: 6, base: 4 }} key={c}>
                  <Skeleton variant="rectangular" className="w-full aspect-[16/10] rounded" />
                  <Skeleton width={60} height={16} className="mt-4" />
                  <Skeleton width="92%" height={26} className="mt-2" />
                  <Skeleton width="80%" height={26} />
                  <Skeleton width="100%" height={16} className="mt-2" />
                  <Skeleton width="60%" height={16} />
                </Grid>
              ))}
            </Grid>
          </EditorialContainer>
        </EditorialSection>
      ))}

      <EditorialSection className="bg-surface-alt py-12 md:py-16">
        <EditorialContainer>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, base: 6 }}>
              <Skeleton variant="rectangular" className="w-full aspect-[4/5] rounded-lg" />
            </Grid>
            <Grid size={{ xs: 12, base: 6 }}>
              <Stack spacing={2}>
                <Skeleton width="70%" height={56} />
                <Skeleton width="50%" height={24} />
                <Skeleton width={96} height={4} className="my-2" />
                <Skeleton width="100%" height={18} />
                <Skeleton width="95%" height={18} />
                <Skeleton width="90%" height={18} />
                <Grid container spacing={2} className="mt-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Grid size={{ xs: 6 }} key={i}>
                      <Skeleton width={80} height={32} />
                      <Skeleton width={120} height={14} className="mt-1" />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </EditorialContainer>
      </EditorialSection>

      <EditorialSection className="py-10 md:py-16">
        <EditorialContainer>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" className="mb-6">
            <Box>
              <Skeleton width={180} height={28} />
              <Skeleton width={48} height={4} className="mt-2" />
            </Box>
            <Skeleton width={70} height={16} />
          </Stack>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {[0, 1, 2, 3].map((i) => (
              <Grid size={{ xs: 6, md: 4, base: 3 }} key={i}>
                <Skeleton variant="rectangular" className="w-full aspect-[3/4] rounded-lg" />
                <Skeleton width="70%" height={22} className="mt-3" />
                <Skeleton width="50%" height={16} className="mt-1" />
              </Grid>
            ))}
          </Grid>
        </EditorialContainer>
      </EditorialSection>

      <Box className="bg-burgundy py-12 md:py-16">
        <EditorialContainer>
          <Stack spacing={2} alignItems="center" className="max-w-[640px] mx-auto">
            <Skeleton variant="circular" width={64} height={64} className="bg-white/20" />
            <Skeleton width={320} height={36} className="bg-white/20" />
            <Skeleton width="100%" height={20} className="bg-white/15" />
            <Skeleton width="80%" height={20} className="bg-white/15" />
            <Skeleton width="100%" height={48} className="bg-white/20 max-w-[480px]" />
          </Stack>
        </EditorialContainer>
      </Box>
    </>
  );
}
