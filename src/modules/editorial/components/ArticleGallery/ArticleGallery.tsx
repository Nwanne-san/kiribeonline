"use client";

import Box from "@mui/material/Box";
import { useState } from "react";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeImageViewer } from "@/modules/shared/components/media/KiribeImageViewer";
import { cn } from "@/modules/shared/components/tw";

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
  const mdCols = Math.min(valid.length, 3);

  return (
    <Box component="figure" className="my-8 md:my-10 mx-0">
      <Box
        className={cn(
          "grid gap-2 grid-cols-2",
          mdCols === 1 && "md:grid-cols-1",
          mdCols === 2 && "md:grid-cols-2",
          mdCols === 3 && "md:grid-cols-3"
        )}
      >
        {valid.map((item, index) => (
          <Box
            key={`${item.id}-${index}`}
            component="button"
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={item.alt ? `View image: ${item.alt}` : "View image"}
            className="[all:unset] cursor-pointer block rounded overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-mustard focus-visible:outline-offset-2"
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
