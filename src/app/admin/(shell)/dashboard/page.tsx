import type { Metadata } from "next";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";

export const metadata: Metadata = {
  title: "Dashboard — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminDashboardPage />;
}
