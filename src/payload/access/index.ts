import type { Access, FieldAccess } from "payload";
import { resolveRole, userCan, type Capability } from "@/server/access/roles";

/** Any authenticated CMS user may perform the action. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/** Public read for published-facing collections. */
export const anyone: Access = () => true;

/** Any authenticated CMS user; public cannot create/update/delete. */
export const adminOnly: Access = ({ req: { user } }) => Boolean(user);

/** Restrict to users whose role grants a specific capability. */
export function requireCapability(capability: Capability): Access {
  return ({ req: { user } }) => userCan(user as { role?: string | null } | null, capability);
}

/** Restrict to full admins (role management, settings). */
export const adminRoleOnly: Access = ({ req: { user } }) =>
  Boolean(user) && resolveRole(user as { role?: string | null }) === "admin";

/** Field-level: only capability-holders may write this field (native REST/studio). */
export function requireFieldCapability(capability: Capability): FieldAccess {
  return ({ req: { user } }) => userCan(user as { role?: string | null } | null, capability);
}

/** Field-level: system-managed field, never writable through the API. */
export const denyFieldWrite: FieldAccess = () => false;

/**
 * Field-level: a user may not change this field on their OWN record (prevents an
 * admin locking themselves out by editing their own role/status via native REST).
 * Custom admin routes use `overrideAccess`, so this only gates the REST surface.
 */
export const denySelfFieldMutation: FieldAccess = ({ req: { user }, id }) =>
  !user || String((user as { id: string | number }).id) !== String(id);

export { resolveRole, userCan, can } from "@/server/access/roles";
export type { Capability, UserRole, UserStatus } from "@/server/access/roles";
