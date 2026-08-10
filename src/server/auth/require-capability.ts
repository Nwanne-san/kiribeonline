import { redirect } from "next/navigation";
import { AdminRoutes } from "@/routes/admin.routes";
import { can, type Capability } from "@/server/access/roles";
import { requireAdminUser, type AdminUser } from "./session";

/**
 * Server-component guard: authenticate the caller, then redirect away if they
 * don't have `capability`. Use in page-level `page.tsx` files for admin routes
 * gated by a specific capability (dashboard, users, settings, audit, etc.).
 *
 * The sidebar in `AdminShell` already hides these entries from roles that
 * lack the capability, but direct URL navigation (bookmark, typed URL, share
 * link) still hits the page. Without this guard, a writer/contributor who
 * types `/admin/dashboard` sees an empty dashboard scaffold and 403 tiles
 * from the analytics fetches instead of being sent somewhere they can use.
 *
 * Redirect target is `/admin` (the app router index page) so the caller
 * lands wherever their role is meant to start — the index picks
 * dashboard-vs-articles based on `analytics:read`. That keeps the "where do
 * I go if I don't belong here" answer in ONE place.
 */
export async function requireAdminCapabilityOrRedirect(
  capability: Capability
): Promise<AdminUser> {
  const user = await requireAdminUser();
  if (!can(user.role, capability)) {
    redirect(AdminRoutes.home);
  }
  return user;
}
