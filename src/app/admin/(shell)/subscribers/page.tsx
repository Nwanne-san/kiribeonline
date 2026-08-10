import type { Metadata } from "next";
import { SubscribersPage } from "@/modules/admin/pages/SubscribersPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Subscribers — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("subscribers:manage");
  return <SubscribersPage />;
}
