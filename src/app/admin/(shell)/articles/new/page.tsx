import type { Metadata } from "next";
import { ArticleEditorPage } from "@/modules/admin/pages/ArticleEditorPage";

export const metadata: Metadata = {
  title: "New article — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ArticleEditorPage />;
}
