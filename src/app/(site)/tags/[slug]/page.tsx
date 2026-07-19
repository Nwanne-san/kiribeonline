import type { Metadata } from "next";
import { TagArchivePage } from "@/modules/editorial/pages/TagArchivePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ");
  const canonical = `/tags/${slug}`;
  const title = `${name} — Tag`;
  const description = `Articles tagged ${name} on Kiribé Online.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title, description, url: canonical },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <TagArchivePage slug={slug} />;
}
