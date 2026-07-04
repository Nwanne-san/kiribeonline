import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";
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
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
  hooks: {
    afterChange: [auditAfterChange("users")],
    afterDelete: [auditAfterDelete("users")],
  },
};
