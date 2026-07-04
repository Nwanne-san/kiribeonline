import type { Metadata } from "next";
import { ArticlesListPage } from "@/modules/admin/pages/ArticlesListPage";

export const metadata: Metadata = {
  title: "Articles — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ArticlesListPage />;
}
