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
    <EditorialSection className="py-10 md:py-16 bg-surface">
      <EditorialContainer>
        <SectionHeader title="More Creators" viewAllHref={PublicRoutes.about} />

        {hasCreators ? (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {creators.slice(0, 8).map((creator) => (
              <Grid key={creator.id} size={{ xs: 6, md: 4, base: 3 }}>
                <CreatorCard creator={creator} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box className="py-8 md:py-12 border border-dashed border-border rounded text-center text-ink-secondary">
            <KiribeTypography variant="body2" className="text-inherit">
              Featured creators will appear here.
            </KiribeTypography>
          </Box>
        )}
      </EditorialContainer>
    </EditorialSection>
  );
}
