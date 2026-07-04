"use client";

import { EditorialContainer, EditorialSection, KiribeTypography } from "@/modules/shared/components/ui";

export function AboutPage() {
  return (
    <EditorialSection>
      <EditorialContainer>
        <KiribeTypography variant="h3">About Kiribe Online</KiribeTypography>
        <KiribeTypography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 640 }}>
          Premium editorial and entertainment platform. Content managed via Payload CMS.
        </KiribeTypography>
      </EditorialContainer>
    </EditorialSection>
  );
}
