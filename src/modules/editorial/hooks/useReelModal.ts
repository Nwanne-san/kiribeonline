"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useModalRoute } from "@/utils/hooks";
import type { PublicReel } from "@/lib/content/query-homepage";

/** Query param carrying which reel is open, alongside `?modal=video`. */
export const REEL_PARAM = "reel";

/** `?modal=` value used by the video lightbox. */
export const VIDEO_MODAL = "video";

/**
 * Drives the video lightbox from the URL rather than local state, so an open
 * video is linkable, survives a refresh, and closes with the browser Back
 * button. Callers pass the reels currently on the page; the open reel is
 * resolved by id from `?reel=`.
 *
 * A `?reel=` id that isn't on this page resolves to `null` — the modal simply
 * stays shut rather than rendering an empty frame.
 */
export function useReelModal(reels: PublicReel[]) {
  const { modal, openModal, closeModal } = useModalRoute();
  const searchParams = useSearchParams();
  const reelId = searchParams.get(REEL_PARAM);

  const activeReel = useMemo(() => {
    if (modal !== VIDEO_MODAL || !reelId) return null;
    return reels.find((reel) => reel.id === reelId) ?? null;
  }, [modal, reelId, reels]);

  const open = useCallback(
    (reel: PublicReel) => openModal(VIDEO_MODAL, { [REEL_PARAM]: reel.id }),
    [openModal]
  );

  const close = useCallback(() => closeModal([REEL_PARAM]), [closeModal]);

  return { activeReel, open, close };
}
