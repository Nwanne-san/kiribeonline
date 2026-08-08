import type { Metadata } from "next";
import { SettingsPage } from "@/modules/admin/pages/SettingsPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Settings — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("settings:manage");
  return <SettingsPage />;
}
