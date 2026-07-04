import { EmptyState } from "@/modules/shared/components/feedback";
import { LostSceneIllustration } from "@/modules/shared/components/illustrations";
import { Container } from "@/modules/shared/components/tw";
import { PublicRoutes } from "@/routes/public.routes";

/** Branded 404 body — rendered inside the site chrome by app/not-found. */
export function NotFoundPage() {
  return (
    <Container className="py-16 md:py-24">
      <EmptyState
        illustration={<LostSceneIllustration />}
        title="This scene didn't make the cut."
        description="The page you're looking for was moved, renamed, or never existed. Let's get you back to the good stuff."
        action={{ label: "Back to home", href: PublicRoutes.home }}
        secondaryAction={{ label: "All articles", href: PublicRoutes.articles }}
      />
    </Container>
  );
}
