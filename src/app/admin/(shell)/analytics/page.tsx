import type { Metadata } from "next";
import { AnalyticsPage } from "@/modules/admin/pages/AnalyticsPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Analytics — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("analytics:read");
  return <AnalyticsPage />;
}
