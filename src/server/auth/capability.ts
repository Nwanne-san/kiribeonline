import { can, type Capability } from "@/server/access/roles";
import {
  AdminAuthError,
  requireAdminUserFromRequest,
  type AdminUser,
} from "./session";
import { requireAdminWrite } from "./admin-write";

/**
 * Authenticate a read request and assert the session role grants `capability`.
 * Use for admin GET handlers that expose privileged data (e.g. team list).
 */
export async function requireAdminCapability(
  request: Request,
  capability: Capability
): Promise<AdminUser> {
  const user = await requireAdminUserFromRequest(request);
  if (!can(user.role, capability)) {
    throw new AdminAuthError("Forbidden", 403);
  }
  return user;
}

/**
 * Authenticate a write request (auth + shared admin rate-limit) and assert the
 * session role grants `capability`. Use in every admin POST/PATCH/DELETE that
 * needs a capability beyond bare authentication.
 */
export async function requireAdminWriteCapability(
  request: Request,
  capability: Capability
): Promise<AdminUser> {
  const user = await requireAdminWrite(request);
  if (!can(user.role, capability)) {
    throw new AdminAuthError("Forbidden", 403);
  }
  return user;
}
