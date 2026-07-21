"use client";

import Box from "@mui/material/Box";
import { useState } from "react";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeImageViewer } from "@/modules/shared/components/media/KiribeImageViewer";

export type ArticleGalleryItem = {
  id: string;
  url: string;
  alt: string;
};

export type ArticleGalleryProps = {
  items: ArticleGalleryItem[];
};

/**
 * Public gallery renderer (PLAN-EMBEDS Step 3): responsive grid of
 * KiribeImage tiles that open the shared KiribeImageViewer lightbox on click.
 * Alt text comes from the media docs captured at insert time.
 */
export function ArticleGallery({ items }: ArticleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const valid = items.filter((it) => it && it.url);
  if (valid.length === 0) return null;

  const active = activeIndex !== null ? valid[activeIndex] : null;

  return (
    <Box component="figure" sx={{ my: { xs: 4, md: 5 }, mx: 0 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: `repeat(${Math.min(valid.length, 3)}, 1fr)`,
          },
          gap: 1,
        }}
      >
        {valid.map((item, index) => (
          <Box
            key={`${item.id}-${index}`}
            component="button"
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={item.alt ? `View image: ${item.alt}` : "View image"}
            sx={{
              all: "unset",
              cursor: "pointer",
              display: "block",
              borderRadius: 1,
              overflow: "hidden",
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "secondary.main",
                outlineOffset: 2,
              },
            }}
          >
            <KiribeImage
              src={item.url}
              alt={item.alt}
              aspect="square"
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </Box>
        ))}
      </Box>

      {active ? (
        <KiribeImageViewer
          src={active.url}
          alt={active.alt}
          open={activeIndex !== null}
          onClose={() => setActiveIndex(null)}
        />
      ) : null}
    </Box>
  );
}
