import type { Metadata } from "next";
import { UsersRolesPage } from "@/modules/admin/pages/UsersRolesPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "Users & Roles — Kiribe Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("users:manage");
  return <UsersRolesPage />;
}
