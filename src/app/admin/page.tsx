import { redirect } from "next/navigation";
import { AdminRoutes } from "@/routes/admin.routes";
import { requireAdminUser } from "@/server/auth";
import { can } from "@/server/access/roles";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  // Land each role somewhere they can actually use: the dashboard requires
  // analytics:read (contributors lack it and would hit a 403), so anyone
  // without it starts on the Articles list instead.
  const user = await requireAdminUser();
  redirect(
    can(user.role, "analytics:read") ? AdminRoutes.dashboard : AdminRoutes.articles
  );
}
