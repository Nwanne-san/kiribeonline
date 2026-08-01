import { ImageResponse } from "next/og";
import {
  brandedOgCard,
  MUSTARD,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/seo/branded-og-card";

/** About page social card. */

export const alt = "About Kiribé Online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return new ImageResponse(
    brandedOgCard({
      kicker: "About Kiribé",
      title: "Premium entertainment journalism for audiences who take culture seriously.",
      accentColor: MUSTARD,
      subtitle: "Twelve years of film, television, and cultural criticism",
      showMark: true,
    }),
    size
  );
}
