import { requireAdminUser } from "@/lib/auth";
import { AdminShell } from "@/modules/admin/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminUser();

  return <AdminShell>{children}</AdminShell>;
}
