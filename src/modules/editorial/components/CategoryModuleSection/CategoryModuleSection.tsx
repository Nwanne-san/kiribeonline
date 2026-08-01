"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import type { HomepageCategoryModule } from "@/lib/content/query-homepage";
import { ArticleCard } from "@/modules/editorial/components/ArticleCard";
import {
  EditorialContainer,
  EditorialSection,
  KiribeLink,
  KiribeTypography,
  publicRoute,
} from "@/modules/shared/components/ui";
import { MobileCarousel } from "@/modules/shared/components/MobileCarousel";
import { SectionHeader } from "@/modules/shared/components/SectionHeader";
import { PublicRoutes } from "@/routes/public.routes";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";

type CategoryModuleSectionProps = {
  module: HomepageCategoryModule;
  alt?: boolean;
};

export function CategoryModuleSection({ module, alt = false }: CategoryModuleSectionProps) {
  if (!module.enabled) {
    return null;
  }

  const viewAllHref = module.categorySlug
    ? publicRoute(PublicRoutes.categoryDetail, { slug: module.categorySlug })
    : undefined;

  const hasArticles = module.articles.length > 0;

  return (
    <EditorialSection
      sx={{
        py: { xs: 5, md: 8 },
        bgcolor: alt ? "#F9FAFB" : "background.paper",
      }}
    >
      <EditorialContainer>
        <SectionHeader title={module.sectionTitle} viewAllHref={viewAllHref} />

        {!hasArticles && (
          <Box
            sx={{
              py: { xs: 4, md: 6 },
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <KiribeTypography variant="body2" sx={{ color: "inherit" }}>
              New stories in this section are on the way. Browse the full archive →
            </KiribeTypography>
          </Box>
        )}

        {hasArticles && module.layout === "list" && (
          <Stack>
            {module.articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="list" />
            ))}
          </Stack>
        )}

        {hasArticles && module.layout === "grid-2" && (
          <MobileCarousel gap={3} columns={{ md: 2 }}>
            {module.articles.map((article) => (
              <Box key={article.id}>
                <ArticleCard article={article} />
              </Box>
            ))}
          </MobileCarousel>
        )}

        {hasArticles && (module.layout === "grid-3" || !module.layout) && (
          // Mobile swipes through the module; md is 2-up and base+ the
          // original 3-up grid.
          <MobileCarousel columns={{ md: 2, base: 3 }}>
            {module.articles.map((article) => (
              <Box key={article.id}>
                <ArticleCard article={article} />
              </Box>
            ))}
          </MobileCarousel>
        )}

        {hasArticles && module.layout === "hero-plus-grid" && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, base: 8 }}>
              <HeroPlusLead article={module.articles[0]!} />
            </Grid>
            <Grid size={{ xs: 12, base: 4 }}>
              <Stack spacing={2}>
                {module.articles.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} variant="list" />
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}
      </EditorialContainer>
    </EditorialSection>
  );
}

function HeroPlusLead({ article }: { article: HomepageCategoryModule["articles"][number] }) {
  const href = publicRoute(PublicRoutes.articleDetail, { slug: article.slug });
  return (
    <Box>
      <KiribeLink href={href} underline="none">
        <KiribeImage
          src={article.heroImage}
          alt={article.heroImage?.alt ?? article.title}
          aspect="hero"
        />
      </KiribeLink>
      <KiribeLink href={href} underline="hover" color="inherit">
        <KiribeTypography variant="h4" sx={{ mt: 2 }}>
          {article.title}
        </KiribeTypography>
      </KiribeLink>
    </Box>
  );
}
