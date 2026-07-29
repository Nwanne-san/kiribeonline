import type { Metadata } from "next";
import { SeoAdminPage } from "@/modules/admin/pages/SeoAdminPage";

export const metadata: Metadata = {
  title: "SEO — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SeoAdminPage />;
}
