import type { Metadata } from "next";
import { TagsPage } from "@/modules/admin/pages/TagsPage";

export const metadata: Metadata = {
  title: "Tags — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TagsPage />;
}
