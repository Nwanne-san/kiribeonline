import { ImageResponse } from "next/og";
import {
  brandedOgCard,
  MUSTARD,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/seo/branded-og-card";

/** Categories index — branded card ("All Categories"). */

export const alt = "Kiribé Online — categories";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return new ImageResponse(
    brandedOgCard({
      kicker: "Kiribé Categories",
      title: "Browse the archive by section — Film, TV, Opinion, News, and more.",
      accentColor: MUSTARD,
    }),
    size
  );
}
