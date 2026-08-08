import type { Metadata } from "next";
import { NavigationAdminPage } from "@/modules/admin/pages/NavigationAdminPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Navigation & Footer — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("settings:manage");
  return <NavigationAdminPage />;
}
