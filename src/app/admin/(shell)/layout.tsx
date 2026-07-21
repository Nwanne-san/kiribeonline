import { requireAdminUser } from "@/server/auth";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { AdminSessionGuard } from "@/modules/admin/components/AdminSessionGuard";

export const dynamic = "force-dynamic";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminUser();

  return (
    <>
      <AdminSessionGuard />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
