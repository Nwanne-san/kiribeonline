import type { Metadata } from "next";
import { HomepageBuilderPage } from "@/modules/admin/pages/HomepageBuilderPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Homepage — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("homepage:manage");
  return <HomepageBuilderPage />;
}
