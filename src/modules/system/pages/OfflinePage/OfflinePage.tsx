"use client";

import { EmptyState } from "@/modules/shared/components/feedback";
import { OfflineAntennaIllustration } from "@/modules/shared/components/illustrations";
import { Container } from "@/modules/shared/components/tw";

export function OfflinePage() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16 md:py-24">
      <EmptyState
        illustration={<OfflineAntennaIllustration />}
        title="Connection unavailable"
        description="You're offline. Cached articles remain readable when available — retry once your connection returns."
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    </Container>
  );
}
