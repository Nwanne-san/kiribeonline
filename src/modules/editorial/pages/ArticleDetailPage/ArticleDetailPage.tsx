"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Suspense } from "react";
import type { Article } from "@/modules/shared/types/content";
import { KiribeImageViewer } from "@/modules/shared/components/media/KiribeImageViewer";
import { RichTextRenderer } from "@/modules/shared/components/feedback";
import {
  EditorialContainer,
  EditorialSection,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { formatDate } from "@/utils/helper";
import { useModalRoute } from "@/utils/hooks";

type ArticleDetailPageProps = {
  article: Article;
};

function ArticleDetailContent({ article }: ArticleDetailPageProps) {
  const { modal, openModal, closeModal } = useModalRoute();
  const isImageModalOpen = modal === "image";

  useEffect(() => {
    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: article.slug }),
    });
  }, [article.slug]);

  return (
    <EditorialSection>
      <EditorialContainer sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3} sx={{ maxWidth: 800, mx: "auto" }}>
          {article.publishedAt && (
            <KiribeTypography variant="caption" color="text.secondary">
              {formatDate(article.publishedAt)}
            </KiribeTypography>
          )}
          <KiribeTypography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {article.title}
          </KiribeTypography>
          {article.excerpt && (
            <KiribeTypography variant="body1" color="text.secondary">
              {article.excerpt}
            </KiribeTypography>
          )}

          {article.heroImage && (
            <Box>
              <KiribeImageViewer
                src={article.heroImage}
                alt={article.heroImage.alt ?? article.title}
                open={isImageModalOpen}
                onClose={closeModal}
                trigger={
                  <Box
                    onClick={() => openModal("image")}
                    sx={{ cursor: "zoom-in" }}
                  >
                    <KiribeImage
                      src={article.heroImage}
                      alt={article.heroImage.alt ?? article.title}
                      aspect="hero"
                    />
                  </Box>
                }
              />
            </Box>
          )}

          <Box sx={{ "& img": { maxWidth: "100%", height: "auto" } }}>
            <RichTextRenderer content={article.body as Record<string, unknown>} />
          </Box>
        </Stack>
      </EditorialContainer>
    </EditorialSection>
  );
}

export function ArticleDetailPage({ article }: ArticleDetailPageProps) {
  return (
    <Suspense fallback={null}>
      <ArticleDetailContent article={article} />
    </Suspense>
  );
}
