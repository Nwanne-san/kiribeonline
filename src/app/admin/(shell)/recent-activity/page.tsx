import type { Metadata } from "next";
import { RecentActivityPage } from "@/modules/admin/pages/RecentActivityPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Audit Log — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("audit:view");
  return <RecentActivityPage />;
}
