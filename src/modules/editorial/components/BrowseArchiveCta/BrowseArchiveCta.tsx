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
    <EditorialSection sx={{ py: { xs: 5, md: 7 }, bgcolor: "background.paper" }}>
      <EditorialContainer>
        <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
          <KiribeTypography variant="kicker" color="text.secondary" sx={{ display: "block" }}>
            Explore the full archive
          </KiribeTypography>
          <KiribeTypography
            variant="h2"
            sx={{
              color: "primary.main",
              fontSize: { xs: "1.75rem", md: "2rem" },
              letterSpacing: "-0.01em",
            }}
          >
            Browse All Articles
          </KiribeTypography>
          <KiribeButton
            component={NextLink}
            href={PublicRoutes.articles}
            sx={{
              mt: 1,
              px: 4,
              py: 1.25,
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            View All Articles
          </KiribeButton>
        </Stack>
      </EditorialContainer>
    </EditorialSection>
  );
}
