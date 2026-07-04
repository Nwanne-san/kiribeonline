"use client";

import { useEffect } from "react";
import { EmptyState } from "@/modules/shared/components/feedback";
import { BrokenProjectorIllustration } from "@/modules/shared/components/illustrations";
import { Container } from "@/modules/shared/components/tw";
import { PublicRoutes } from "@/routes/public.routes";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the digest so it can be correlated with server logs.
    console.error("Site error boundary:", error.digest ?? error.message, error);
  }, [error]);

  return (
    <Container className="py-16 md:py-24">
      <EmptyState
        illustration={<BrokenProjectorIllustration />}
        title="Something went wrong"
        description="A reel jammed on our end. Try again — if it keeps happening, head back to the homepage."
        action={{ label: "Try again", onClick: () => reset() }}
        secondaryAction={{ label: "Back to home", href: PublicRoutes.home }}
      />
    </Container>
  );
}
