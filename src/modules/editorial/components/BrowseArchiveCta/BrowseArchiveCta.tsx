"use client";

import Stack from "@mui/material/Stack";
import NextLink from "next/link";
import {
  EditorialContainer,
  EditorialSection,
  KiribeButton,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";

export function BrowseArchiveCta() {
  return (
    <EditorialSection className="py-10 md:py-14 bg-surface">
      <EditorialContainer>
        <Stack spacing={2} alignItems="center" className="text-center">
          <KiribeTypography variant="kicker" color="text.secondary" className="block">
            Explore the full archive
          </KiribeTypography>
          <KiribeTypography
            variant="h2"
            className="text-burgundy text-[1.75rem] md:text-[2rem] tracking-tight"
          >
            Browse All Articles
          </KiribeTypography>
          <KiribeButton
            component={NextLink}
            href={PublicRoutes.articles}
            className="mt-2 px-8 py-2.5 text-[0.75rem] tracking-[0.08em] uppercase"
          >
            View All Articles
          </KiribeButton>
        </Stack>
      </EditorialContainer>
    </EditorialSection>
  );
}
