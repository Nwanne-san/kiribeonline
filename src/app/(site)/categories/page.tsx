import type { Metadata } from "next";
import { getCategoriesIndexForPublic } from "@/lib/content";
import { CategoriesPage } from "@/modules/editorial/pages/CategoriesPage";

const title = "Categories";
const description =
  "Browse Kiribé Online by category — film, television, opinion, news, spotlight, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/categories" },
  openGraph: { type: "website", title, description, url: "/categories" },
};

export default async function Page() {
  const categories = await getCategoriesIndexForPublic();
  return <CategoriesPage categories={categories} />;
}
