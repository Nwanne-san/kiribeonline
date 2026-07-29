"use client";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import type { Article } from "@/modules/shared/types/content";
import type { ArticleCardDoc } from "@/lib/content/types";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import {
  EditorialContainer,
  EditorialSection,
  KiribeLink,
  KiribeTypography,
  publicRoute,
} from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { formatDate } from "@/utils/helper";
import { EditorsPicksList } from "../EditorsPicksList";

type HomeHeroProps = {
  heroArticle: Article | null;
  editorsPicks: ArticleCardDoc[];
};

export function HomeHero({ heroArticle, editorsPicks }: HomeHeroProps) {
  const heroHref = heroArticle
    ? publicRoute(PublicRoutes.articleDetail, { slug: heroArticle.slug })
    : undefined;
  const heroDate = heroArticle?.publishedAt ? formatDate(heroArticle.publishedAt) : undefined;
  const primaryCategory = heroArticle?.categories?.[0]?.name;

  return (
    <EditorialSection className="pt-8 md:pt-12 pb-10 md:pb-16">
      <EditorialContainer>
        <Grid container spacing={{ xs: 4, base: 6 }}>
          <Grid size={{ xs: 12, base: 8 }}>
            {heroArticle ? (
              <Stack spacing={2.5}>
                {heroHref && (
                  <KiribeLink href={heroHref} underline="none">
                    <KiribeImage
                      src={heroArticle.heroImage}
                      alt={heroArticle.heroImage?.alt ?? heroArticle.title}
                      aspect="hero"
                      priority
                    />
                  </KiribeLink>
                )}
                <KiribeTypography
                  variant="kicker"
                  color="secondary.main"
                  className="block"
                >
                  {primaryCategory ? `Featured · ${primaryCategory}` : "Featured Story"}
                </KiribeTypography>
                <KiribeLink href={heroHref!} underline="hover" color="inherit">
                  <KiribeTypography
                    variant="h1"
                    component="h1"
                    className="text-[clamp(1.875rem,1.5rem+1.6vw,2.75rem)] leading-[1.15] tracking-tight"
                  >
                    {heroArticle.title}
                  </KiribeTypography>
                </KiribeLink>
                {heroArticle.excerpt && (
                  <KiribeTypography
                    variant="body1"
                    color="text.secondary"
                    className="text-base leading-[1.6]"
                  >
                    {heroArticle.excerpt}
                  </KiribeTypography>
                )}
                {heroDate && (
                  <KiribeTypography variant="caption" color="text.secondary">
                    {heroDate}
                  </KiribeTypography>
                )}
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <KiribeTypography
                  variant="kicker"
                  color="secondary.main"
                  className="block"
                >
                  Featured Story
                </KiribeTypography>
                <KiribeTypography
                  variant="h1"
                  component="h1"
                  className="text-[1.875rem] md:text-[2.5rem] leading-[1.15] text-ink"
                >
                  Stories worth your time.
                </KiribeTypography>
                <KiribeTypography variant="body1" color="text.secondary">
                  Film, television, opinion, news, and spotlight features in a polished
                  magazine format. The featured story will appear here once the editor
                  publishes one.
                </KiribeTypography>
              </Stack>
            )}
          </Grid>
          <Grid size={{ xs: 12, base: 4 }}>
            <EditorsPicksList picks={editorsPicks} />
          </Grid>
        </Grid>
      </EditorialContainer>
    </EditorialSection>
  );
}
