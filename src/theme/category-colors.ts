/** Category accent colors for filters and badges — Figma V5 exact fills. */
export const CATEGORY_COLORS = {
  all: { border: "#1A1A1A", text: "#FFFFFF", bg: "#1A1A1A" },
  film: { border: "#7F0400", text: "#7F0400", bg: "#7F0400" },
  tv: { border: "#1E2939", text: "#1E2939", bg: "#1E2939" },
  opinion: { border: "#E6A313", text: "#E6A313", bg: "#E6A313" },
  news: { border: "#2563EB", text: "#2563EB", bg: "#2563EB" },
  spotlight: { border: "#6E11B0", text: "#6E11B0", bg: "#6E11B0" },
  documentary: { border: "#016630", text: "#016630", bg: "#016630" },
  events: { border: "#0D9488", text: "#0D9488", bg: "#0D9488" },
} as const;

export type CategorySlug = keyof typeof CATEGORY_COLORS;

export const CATEGORY_FILTER_OPTIONS: { slug: CategorySlug; label: string }[] = [
  { slug: "all", label: "ALL" },
  { slug: "film", label: "FILM" },
  { slug: "tv", label: "TV" },
  { slug: "opinion", label: "OPINION" },
  { slug: "news", label: "NEWS" },
  { slug: "spotlight", label: "SPOTLIGHT" },
  { slug: "documentary", label: "DOCUMENTARY" },
  { slug: "events", label: "EVENTS" },
];
