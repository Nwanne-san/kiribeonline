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
        // Kept intentionally generic — we don't promise any offline cache, so
        // the copy shouldn't imply cached articles are guaranteed to load.
        description="Check your connection and try again."
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    </Container>
  );
}
