"use client";

import { useEffect } from "react";
import { EmptyState } from "@/modules/shared/components/feedback";
import { BrokenProjectorIllustration } from "@/modules/shared/components/illustrations";
import { AdminRoutes } from "@/routes/admin.routes";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error boundary:", error.digest ?? error.message, error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-card-lg border border-border bg-surface px-6 py-8 shadow-card">
        <EmptyState
          size="compact"
          illustration={<BrokenProjectorIllustration />}
          title="This screen hit an error"
          description="The admin ran into an unexpected problem. Retry, or head back to the dashboard."
          action={{ label: "Try again", onClick: () => reset() }}
          secondaryAction={{ label: "Go to dashboard", href: AdminRoutes.dashboard }}
        />
      </div>
    </div>
  );
}
