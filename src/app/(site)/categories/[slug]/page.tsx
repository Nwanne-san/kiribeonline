import type { Metadata } from "next";
import { CategoryArchivePage } from "@/modules/editorial/pages/CategoryArchivePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ");
  return {
    title: `${title} — Category`,
    description: `Browse ${title} articles on Kiribé Online.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <CategoryArchivePage slug={slug} />;
}
