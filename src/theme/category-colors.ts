/** Category accent colors for filters and badges — V5 design */
export const CATEGORY_COLORS = {
  all: { border: "#1A1A1A", text: "#FFFFFF", bg: "#1A1A1A" },
  film: { border: "#6B1D2A", text: "#6B1D2A", bg: "#6B1D2A" },
  tv: { border: "#1A1A1A", text: "#1A1A1A", bg: "#1A1A1A" },
  opinion: { border: "#C9A227", text: "#C9A227", bg: "#C9A227" },
  news: { border: "#2563EB", text: "#2563EB", bg: "#2563EB" },
  spotlight: { border: "#7C3AED", text: "#7C3AED", bg: "#7C3AED" },
  documentary: { border: "#15803D", text: "#15803D", bg: "#15803D" },
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
