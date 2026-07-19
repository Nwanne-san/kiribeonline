import type { Metadata } from "next";
import { SearchPage } from "@/modules/editorial/pages/SearchPage";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();

  const title = query ? `Search — ${query}` : "Search";
  const description = query
    ? `Search results for "${query}" across the Kiribé Online archive.`
    : "Search Kiribé Online by title, topic, or author.";

  return {
    title,
    description,
    // Query result pages should not be indexed; the archive and category
    // pages are the canonical, crawlable surfaces.
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

export default function Page() {
  return <SearchPage />;
}
