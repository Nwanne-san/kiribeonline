"use client";

import { EditorialContainer, EditorialSection, KiribeTypography } from "@/modules/shared/components/ui";

export function CategoriesPage() {
  return (
    <EditorialSection>
      <EditorialContainer>
        <KiribeTypography variant="h3">Categories</KiribeTypography>
        <KiribeTypography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Browse by category — Phase 2.
        </KiribeTypography>
      </EditorialContainer>
    </EditorialSection>
  );
}
