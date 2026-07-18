import type { CollectionAfterLoginHook } from "payload";
import { writeAuditLog } from "@/lib/audit";

/**
 * Record a successful login. Payload fires `afterLogin` only after credentials
 * verify, so this captures genuine sign-ins. Failures, lockouts, invites, and
 * role/status changes are logged at their own call sites (login route,
 * accept-invite service, Users afterChange). AUTH-HARDENING §8.
 */
export const auditAuthAfterLogin: CollectionAfterLoginHook = async ({ req, user }) => {
  await writeAuditLog(req.payload, {
    action: "auth.login",
    actorEmail: (user as { email?: string }).email,
    targetType: "users",
    targetId: String((user as { id: string | number }).id),
    metadata: { role: (user as { role?: string }).role },
  });
};
