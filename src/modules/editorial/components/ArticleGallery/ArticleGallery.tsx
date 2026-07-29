"use client";

import Box from "@mui/material/Box";
import { useSearchParams } from "next/navigation";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { KiribeImageViewer } from "@/modules/shared/components/media/KiribeImageViewer";
import { useModalRoute } from "@/utils/hooks";

/** Query param carrying which gallery tile is open, alongside `?modal=image`. */
const IMAGE_PARAM = "image";
const IMAGE_MODAL = "image";

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
  // URL-driven (`?modal=image&image=<index>`) so a lightbox is linkable and
  // closes with the browser Back button.
  const { modal, openModal, closeModal } = useModalRoute();
  const searchParams = useSearchParams();

  const valid = items.filter((it) => it && it.url);

  const rawIndex = searchParams.get(IMAGE_PARAM);
  const parsedIndex = rawIndex === null ? Number.NaN : Number(rawIndex);
  // An out-of-range or non-numeric `?image=` resolves to nothing rather than
  // rendering an empty lightbox.
  const activeIndex =
    modal === IMAGE_MODAL &&
    Number.isInteger(parsedIndex) &&
    parsedIndex >= 0 &&
    parsedIndex < valid.length
      ? parsedIndex
      : null;

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
            onClick={() => openModal(IMAGE_MODAL, { [IMAGE_PARAM]: String(index) })}
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
          onClose={() => closeModal([IMAGE_PARAM])}
        />
      ) : null}
    </Box>
  );
}
