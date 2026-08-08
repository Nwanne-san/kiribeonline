import { redirect } from "next/navigation";
import { AdminRoutes } from "@/routes/admin.routes";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  // Every authenticated admin lands on the dashboard. The dashboard adapts
  // its tiles and panels to the caller's capabilities (see
  // AdminDashboardPage + the dashboard service): writers/contributors see
  // the article-counter tiles and their recent work; editor-only panels
  // (Content Performance, Recent Activity, Homepage shortcuts) are hidden
  // when the role doesn't hold the matching capability.
  await requireAdminUser();
  redirect(AdminRoutes.dashboard);
}
