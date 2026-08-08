import type { Metadata } from "next";
import { EditorsPicksPage } from "@/modules/admin/pages/EditorsPicksPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Editor's picks — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("homepage:manage");
  return <EditorsPicksPage />;
}
