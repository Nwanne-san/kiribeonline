"use client";

import Box from "@mui/material/Box";
import type { PublicCreator } from "@/lib/content/query-homepage";
import { CreatorCard } from "@/modules/editorial/components/CreatorCard";
import {
  EditorialContainer,
  EditorialSection,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { MobileCarousel } from "@/modules/shared/components/MobileCarousel";
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
          // Eight portraits stack into a very long column on a phone — swipe
          // instead. From `sm` up this is the original 2/3/4-up grid.
          <MobileCarousel
            breakpoint="sm"
            columns={{ sm: 2, md: 3, base: 4 }}
            gap={2}
            itemWidth="52vw"
          >
            {creators.slice(0, 8).map((creator) => (
              <Box key={creator.id}>
                <CreatorCard creator={creator} />
              </Box>
            ))}
          </MobileCarousel>
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
