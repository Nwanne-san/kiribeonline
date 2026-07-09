import type { CollectionConfig } from "payload";
import { adminRoleOnly, denySelfFieldMutation } from "../access";
import { USER_ROLES, USER_STATUSES } from "@/server/access/roles";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 5,
    lockTime: 600,
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
  ],
  hooks: {
    afterChange: [auditAfterChange("users")],
    afterDelete: [auditAfterDelete("users")],
  },
};
