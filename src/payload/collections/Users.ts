import type { CollectionConfig } from "payload";
import { adminRoleOnly, denySelfFieldMutation } from "../access";
import { USER_ROLES, USER_STATUSES } from "@/server/access/roles";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import { auditAuthAfterLogin } from "../hooks/audit-auth";
import { DEFAULT_ADMIN_TOKEN_TTL_SECONDS } from "@/constants";
import { positiveIntEnv } from "@/lib/env";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    // Short-lived sessions (default 2h) — Payload re-issues a token on each
    // authenticated request, so active admins stay logged in while idle
    // sessions expire quickly. AUTH-HARDENING §2.
    tokenExpiration: positiveIntEnv(
      "ADMIN_TOKEN_TTL_SECONDS",
      DEFAULT_ADMIN_TOKEN_TTL_SECONDS
    ),
    maxLoginAttempts: positiveIntEnv("ADMIN_MAX_LOGIN_ATTEMPTS", 5),
    // 15-minute lockout after repeated failures (was 10m). AUTH-HARDENING §3.
    lockTime: positiveIntEnv("ADMIN_LOCK_TIME_SECONDS", 60 * 15),
  },
  admin: {
    useAsTitle: "email",
    group: "Admin",
    defaultColumns: ["name", "email", "role", "status", "updatedAt"],
  },
  access: {
    // Team management is admin-only; capability-scoped writes are enforced at
    // the /api/admin/users route layer for the custom admin.
    read: adminRoleOnly,
    create: adminRoleOnly,
    update: adminRoleOnly,
    delete: adminRoleOnly,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      // Least privilege for invited users. Pre-RBAC rows are promoted to admin
      // by the roles migration, not by an implicit fallback.
      defaultValue: "contributor",
      required: true,
      options: USER_ROLES.map((value) => ({ label: value, value })),
      access: { update: denySelfFieldMutation },
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      required: true,
      options: USER_STATUSES.map((value) => ({ label: value, value })),
      access: { update: denySelfFieldMutation },
      admin: { position: "sidebar" },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
    {
      // SHA-256 hash of the single-use invite token. The raw token is emailed
      // once and never stored. Never exposed through the API.
      name: "inviteTokenHash",
      type: "text",
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: "inviteTokenExpiresAt",
      type: "date",
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      // SHA-256 hash of the single-use password-reset token. Mirrors the invite
      // pair above — raw token emailed once, never persisted. 30-min TTL.
      name: "resetTokenHash",
      type: "text",
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: "resetTokenExpiresAt",
      type: "date",
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
  ],
  hooks: {
    afterLogin: [auditAuthAfterLogin],
    afterChange: [auditAfterChange("users")],
    afterDelete: [auditAfterDelete("users")],
  },
};
