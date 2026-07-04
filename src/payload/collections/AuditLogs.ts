import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";

export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "action",
    group: "Admin",
    defaultColumns: ["action", "actorEmail", "targetType", "createdAt"],
  },
  access: {
    read: adminOnly,
    create: () => false,
    update: () => false,
    delete: adminOnly,
  },
  fields: [
    {
      name: "action",
      type: "text",
      required: true,
    },
    {
      name: "actorEmail",
      type: "email",
    },
    {
      name: "targetType",
      type: "text",
    },
    {
      name: "targetId",
      type: "text",
    },
    {
      name: "metadata",
      type: "json",
    },
  ],
  timestamps: true,
};
