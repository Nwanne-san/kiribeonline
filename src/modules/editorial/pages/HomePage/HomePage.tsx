import type { HomepageData } from "@/lib/content/query-homepage";
import { BrowseArchiveCta } from "@/modules/editorial/components/BrowseArchiveCta";
import { CategoryModuleSection } from "@/modules/editorial/components/CategoryModuleSection";
import { HomeHero } from "@/modules/editorial/components/HomeHero";
import { MoreCreatorsGrid } from "@/modules/editorial/components/MoreCreatorsGrid";
import { MostReadList } from "@/modules/editorial/components/MostReadList";
import { ReelsSection } from "@/modules/editorial/components/ReelsSection";
import { SpotlightProfile } from "@/modules/editorial/components/SpotlightProfile";
import { SubscribeBand } from "@/modules/marketing/components/SubscribeBand";

type HomePageProps = {
  data: HomepageData;
};

/**
 * Fixed editorial layout per Figma 2001:2.
 * Every section renders its own header even with no content — admins see the
 * shape of the homepage from day one. No fallback hero.
 */
export function HomePage({ data }: HomePageProps) {
  return (
    <>
      <HomeHero heroArticle={data.heroArticle} editorsPicks={data.editorsPicks} />
      <ReelsSection reels={data.reelsEnabled ? data.reels : []} />

      {data.categoryModulesTop.map((mod, i) => (
        <CategoryModuleSection
          key={`top-${mod.sectionTitle}-${i}`}
          module={mod}
          alt={i % 2 === 1}
        />
      ))}

      <SpotlightProfile creator={data.spotlightCreator} />
      <MoreCreatorsGrid creators={data.featuredCreators} />

      {data.categoryModulesBottom.map((mod, i) => {
        const altIndex = data.categoryModulesTop.length + i;
        return (
          <CategoryModuleSection
            key={`bot-${mod.sectionTitle}-${i}`}
            module={mod}
            alt={altIndex % 2 === 1}
          />
        );
      })}

      <MostReadList articles={data.mostReadArticles} variant="homepage" />

      {data.archiveCtaEnabled && <BrowseArchiveCta />}
      <SubscribeBand />
    </>
  );
}
