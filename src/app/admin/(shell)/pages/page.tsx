import type { Metadata } from "next";
import { PagesAdminPage } from "@/modules/admin/pages/PagesAdminPage";

export const metadata: Metadata = {
  title: "Pages — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PagesAdminPage />;
}
