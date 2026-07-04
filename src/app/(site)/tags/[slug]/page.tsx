import type { Metadata } from "next";
import { TagArchivePage } from "@/modules/editorial/pages/TagArchivePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ");
  return {
    title: `${title} — Tag`,
    description: `Articles tagged ${title} on Kiribé Online.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <TagArchivePage slug={slug} />;
}
