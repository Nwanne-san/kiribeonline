import type { Metadata } from "next";
import { CategoriesPage } from "@/modules/admin/pages/CategoriesPage";

export const metadata: Metadata = {
  title: "Categories — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CategoriesPage />;
}
