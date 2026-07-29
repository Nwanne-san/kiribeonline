import type { Metadata } from "next";
import { NavigationAdminPage } from "@/modules/admin/pages/NavigationAdminPage";

export const metadata: Metadata = {
  title: "Navigation & Footer — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NavigationAdminPage />;
}
