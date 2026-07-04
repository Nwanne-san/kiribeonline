import type { Metadata } from "next";
import { ArticleEditorPage } from "@/modules/admin/pages/ArticleEditorPage";

export const metadata: Metadata = {
  title: "Edit article — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleEditorPage articleId={id} />;
}
