/**
 * Role & capability model for the custom Kiribe admin.
 *
 * Access is capability-based: each role maps to a fixed set of capabilities,
 * and every admin mutation checks a capability (never a bare role string).
 * This keeps permission logic in one place and lets the UI reason about what a
 * user may do without duplicating rules.
 */

export const USER_ROLES = ["admin", "editor", "writer", "contributor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "pending", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  writer: "Writer",
  contributor: "Contributor",
};

/** Every capability guarded across the admin API. */
export const CAPABILITIES = [
  "articles:create",
  "articles:edit",
  "articles:publish",
  "articles:delete",
  "media:upload",
  "media:delete",
  "taxonomy:manage",
  "homepage:manage",
  "creators:manage",
  "reels:manage",
  "analytics:read",
  "audit:view",
  "subscribers:manage",
  "users:manage",
  "settings:manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const EDITOR_CAPS: Capability[] = [
  "articles:create",
  "articles:edit",
  "articles:publish",
  "articles:delete",
  "media:upload",
  "media:delete",
  "taxonomy:manage",
  "homepage:manage",
  "creators:manage",
  "reels:manage",
  "analytics:read",
  "audit:view",
];

const WRITER_CAPS: Capability[] = [
  "articles:create",
  "articles:edit",
  "media:upload",
  "analytics:read",
];

const CONTRIBUTOR_CAPS: Capability[] = [
  "articles:create",
  "articles:edit",
  "media:upload",
];

export const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  admin: CAPABILITIES,
  editor: EDITOR_CAPS,
  writer: WRITER_CAPS,
  contributor: CONTRIBUTOR_CAPS,
};

type RoleBearer = { role?: string | null } | null | undefined;

/**
 * Resolve the effective role for a user document.
 *
 * Fails CLOSED: a missing/unknown role resolves to the least-privileged role,
 * never admin. Legacy users are handled explicitly by the roles migration
 * (pre-RBAC rows are backfilled to `admin`), and the `role` column is NOT NULL,
 * so a genuine null should never reach here — but if one ever does (restored
 * backup, direct insert, schema rollback), it must not silently grant admin.
 */
export function resolveRole(user: RoleBearer): UserRole {
  const role = user?.role;
  if (role && (USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }
  return "contributor";
}

/** True when the role grants the capability. */
export function can(role: UserRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

/** True when the user's effective role grants the capability. */
export function userCan(user: RoleBearer, capability: Capability): boolean {
  return can(resolveRole(user), capability);
}

/**
 * True for roles that may edit/publish articles owned by anyone else (admin,
 * editor). Writers and contributors are ownership-scoped to their own articles
 * — enforced in the article routes and the collection access layer. See
 * DECISIONS.md (article edit ownership).
 */
export function isEditorOrAbove(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}
