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
import { cn } from "@/modules/shared/components/tw";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { SectionHeader } from "@/modules/shared/components/SectionHeader";
import { PublicRoutes } from "@/routes/public.routes";

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
      className={cn("py-10 md:py-16", alt ? "bg-surface-alt" : "bg-surface")}
    >
      <EditorialContainer>
        <SectionHeader title={module.sectionTitle} viewAllHref={viewAllHref} />

        {!hasArticles && (
          <Box className="py-8 md:py-12 border border-dashed border-border rounded text-center text-ink-secondary">
            <KiribeTypography variant="body2" className="text-inherit">
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
          <Grid container spacing={3}>
            {module.articles.map((article) => (
              <Grid key={article.id} size={{ xs: 12, md: 6 }}>
                <ArticleCard article={article} />
              </Grid>
            ))}
          </Grid>
        )}

        {hasArticles && (module.layout === "grid-3" || !module.layout) && (
          <Grid container spacing={{ xs: 3, md: 2 }}>
            {module.articles.map((article) => (
              <Grid key={article.id} size={{ xs: 12, md: 6, base: 4 }}>
                <ArticleCard article={article} />
              </Grid>
            ))}
          </Grid>
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
        <KiribeTypography variant="h4" className="mt-4">
          {article.title}
        </KiribeTypography>
      </KiribeLink>
    </Box>
  );
}
