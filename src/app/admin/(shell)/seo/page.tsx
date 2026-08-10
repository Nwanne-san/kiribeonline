import type { Metadata } from "next";
import { SeoAdminPage } from "@/modules/admin/pages/SeoAdminPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "SEO — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("settings:manage");
  return <SeoAdminPage />;
}
