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
    <EditorialSection sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 5, md: 8 } }}>
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
                  sx={{ display: "block" }}
                >
                  {primaryCategory ? `Featured · ${primaryCategory}` : "Featured Story"}
                </KiribeTypography>
                <KiribeLink href={heroHref!} underline="hover" color="inherit">
                  <KiribeTypography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontSize: "clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem)",
                      lineHeight: 1.15,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {heroArticle.title}
                  </KiribeTypography>
                </KiribeLink>
                {heroArticle.excerpt && (
                  <KiribeTypography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontSize: "1rem", lineHeight: 1.6 }}
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
                  sx={{ display: "block" }}
                >
                  Featured Story
                </KiribeTypography>
                <KiribeTypography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: { xs: "1.875rem", md: "2.5rem" },
                    lineHeight: 1.15,
                    color: "text.primary",
                  }}
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
