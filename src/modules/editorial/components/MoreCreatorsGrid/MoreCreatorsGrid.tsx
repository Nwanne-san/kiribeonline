"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { PublicCreator } from "@/lib/content/query-homepage";
import { CreatorCard } from "@/modules/editorial/components/CreatorCard";
import {
  EditorialContainer,
  EditorialSection,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { SectionHeader } from "@/modules/shared/components/SectionHeader";
import { PublicRoutes } from "@/routes/public.routes";

type MoreCreatorsGridProps = {
  creators: PublicCreator[];
};

export function MoreCreatorsGrid({ creators }: MoreCreatorsGridProps) {
  const hasCreators = creators.length > 0;

  return (
    <EditorialSection sx={{ py: { xs: 5, md: 8 }, bgcolor: "background.paper" }}>
      <EditorialContainer>
        <SectionHeader title="More Creators" viewAllHref={PublicRoutes.about} />

        {hasCreators ? (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {creators.slice(0, 8).map((creator) => (
              <Grid key={creator.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <CreatorCard creator={creator} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box
            sx={{
              py: { xs: 4, md: 6 },
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <KiribeTypography variant="body2" sx={{ color: "inherit" }}>
              Featured creators will appear here.
            </KiribeTypography>
          </Box>
        )}
      </EditorialContainer>
    </EditorialSection>
  );
}
