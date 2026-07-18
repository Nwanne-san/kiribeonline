import type { Metadata } from "next";
import { UsersRolesPage } from "@/modules/admin/pages/UsersRolesPage";

export const metadata: Metadata = {
  title: "Users & Roles — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <UsersRolesPage />;
}
