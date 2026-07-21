import type { ComponentType } from "react";
import { ClapperboardIllustration } from "./ClapperboardIllustration";
import { DocumentaryCameraIllustration } from "./DocumentaryCameraIllustration";
import { EmptyShelfIllustration } from "./EmptyShelfIllustration";
import { EventsTicketIllustration } from "./EventsTicketIllustration";
import { NewspaperIllustration } from "./NewspaperIllustration";
import { OpinionBubbleIllustration } from "./OpinionBubbleIllustration";
import { SpotlightLampIllustration } from "./SpotlightLampIllustration";
import { TvSetIllustration } from "./TvSetIllustration";
import { VideoPlayIllustration } from "./VideoPlayIllustration";
import type { IllustrationProps } from "./IllustrationBase";

/**
 * Category slug → themed empty-state illustration. Slugs mirror
 * `CATEGORY_COLORS` in `src/theme/category-colors.ts` (plus `videos`).
 */
const CATEGORY_EMPTY_ILLUSTRATIONS: Record<
  string,
  ComponentType<IllustrationProps>
> = {
  film: ClapperboardIllustration,
  tv: TvSetIllustration,
  opinion: OpinionBubbleIllustration,
  news: NewspaperIllustration,
  spotlight: SpotlightLampIllustration,
  documentary: DocumentaryCameraIllustration,
  events: EventsTicketIllustration,
  videos: VideoPlayIllustration,
};

export type CategoryEmptyIllustrationProps = IllustrationProps & {
  /** Category slug; unknown or missing slugs fall back to the generic shelf. */
  slug?: string;
};

/**
 * Empty-state illustration matched to the category being browsed, so each
 * archive's "no articles" state carries that desk's own line-art scene.
 */
export function CategoryEmptyIllustration({
  slug,
  ...props
}: CategoryEmptyIllustrationProps) {
  const Illustration =
    (slug && CATEGORY_EMPTY_ILLUSTRATIONS[slug]) || EmptyShelfIllustration;
  return <Illustration {...props} />;
}
