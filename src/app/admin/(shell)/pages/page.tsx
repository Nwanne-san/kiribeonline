import type { Metadata } from "next";
import { PagesAdminPage } from "@/modules/admin/pages/PagesAdminPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Pages — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("settings:manage");
  return <PagesAdminPage />;
}
