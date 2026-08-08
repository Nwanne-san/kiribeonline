import type { Metadata } from "next";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Dashboard — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("analytics:read");
  return <AdminDashboardPage />;
}
