import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import {
  EditorialContainer,
  EditorialSection,
} from "@/modules/shared/components/ui";

export default function HomeLoading() {
  return (
    <>
      <EditorialSection sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 5, md: 8 } }}>
        <EditorialContainer>
          <Grid container spacing={{ xs: 4, base: 6 }}>
            <Grid size={{ xs: 12, base: 8 }}>
              <Stack spacing={2.5}>
                <Skeleton
                  variant="rectangular"
                  sx={{ width: "100%", aspectRatio: "16/9", borderRadius: 1 }}
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
                <Skeleton width={48} height={4} sx={{ mb: 2 }} />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Stack key={i} spacing={0.5} sx={{ py: 1.75, borderBottom: "1px solid", borderColor: "divider" }}>
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

      <EditorialSection sx={{ bgcolor: "#F9FAFB", py: { xs: 6, md: 8 } }}>
        <EditorialContainer>
          <Stack alignItems="center" spacing={1} sx={{ mb: { xs: 3, md: 4 } }}>
            <Skeleton width={200} height={32} />
            <Skeleton width={48} height={4} />
            <Skeleton width={180} height={16} />
          </Stack>
          <Box sx={{ display: "flex", gap: 2, overflowX: "hidden" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                sx={{ flex: "0 0 auto", width: { xs: 180, sm: 200 }, height: { xs: 320, sm: 356 }, borderRadius: 2 }}
              />
            ))}
          </Box>
        </EditorialContainer>
      </EditorialSection>

      {[0, 1, 2].map((s) => (
        <EditorialSection
          key={s}
          sx={{ py: { xs: 5, md: 8 }, bgcolor: s % 2 === 1 ? "#F9FAFB" : "background.paper" }}
        >
          <EditorialContainer>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 3 }}>
              <Box>
                <Skeleton width={140} height={28} />
                <Skeleton width={48} height={4} sx={{ mt: 1 }} />
              </Box>
              <Skeleton width={70} height={16} />
            </Stack>
            <Grid container spacing={{ xs: 3, md: 2 }}>
              {[0, 1, 2].map((c) => (
                <Grid size={{ xs: 12, md: 6, base: 4 }} key={c}>
                  <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "16/10", borderRadius: 1 }} />
                  <Skeleton width={60} height={16} sx={{ mt: 2 }} />
                  <Skeleton width="92%" height={26} sx={{ mt: 1 }} />
                  <Skeleton width="80%" height={26} />
                  <Skeleton width="100%" height={16} sx={{ mt: 1 }} />
                  <Skeleton width="60%" height={16} />
                </Grid>
              ))}
            </Grid>
          </EditorialContainer>
        </EditorialSection>
      ))}

      <EditorialSection sx={{ bgcolor: "#F9FAFB", py: { xs: 6, md: 8 } }}>
        <EditorialContainer>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, base: 6 }}>
              <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "4/5", borderRadius: 2 }} />
            </Grid>
            <Grid size={{ xs: 12, base: 6 }}>
              <Stack spacing={2}>
                <Skeleton width="70%" height={56} />
                <Skeleton width="50%" height={24} />
                <Skeleton width={96} height={4} sx={{ my: 1 }} />
                <Skeleton width="100%" height={18} />
                <Skeleton width="95%" height={18} />
                <Skeleton width="90%" height={18} />
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Grid size={{ xs: 6 }} key={i}>
                      <Skeleton width={80} height={32} />
                      <Skeleton width={120} height={14} sx={{ mt: 0.5 }} />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </EditorialContainer>
      </EditorialSection>

      <EditorialSection sx={{ py: { xs: 5, md: 8 } }}>
        <EditorialContainer>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 3 }}>
            <Box>
              <Skeleton width={180} height={28} />
              <Skeleton width={48} height={4} sx={{ mt: 1 }} />
            </Box>
            <Skeleton width={70} height={16} />
          </Stack>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {[0, 1, 2, 3].map((i) => (
              <Grid size={{ xs: 6, md: 4, base: 3 }} key={i}>
                <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "3/4", borderRadius: 2 }} />
                <Skeleton width="70%" height={22} sx={{ mt: 1.5 }} />
                <Skeleton width="50%" height={16} sx={{ mt: 0.5 }} />
              </Grid>
            ))}
          </Grid>
        </EditorialContainer>
      </EditorialSection>

      <Box sx={{ bgcolor: "primary.main", py: { xs: 6, md: 8 } }}>
        <EditorialContainer>
          <Stack spacing={2} alignItems="center" sx={{ maxWidth: 640, mx: "auto" }}>
            <Skeleton variant="circular" width={64} height={64} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
            <Skeleton width={320} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
            <Skeleton width="100%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
            <Skeleton width="80%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
            <Skeleton width="100%" height={48} sx={{ bgcolor: "rgba(255,255,255,0.2)", maxWidth: 480 }} />
          </Stack>
        </EditorialContainer>
      </Box>
    </>
  );
}
