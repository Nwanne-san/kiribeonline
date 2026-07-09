import type { CollectionConfig } from "payload";
import { anyone, requireCapability } from "../access";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
    defaultColumns: ["filename", "alt", "usageCount", "updatedAt"],
  },
  access: {
    read: anyone,
    create: requireCapability("media:upload"),
    update: requireCapability("media:upload"),
    delete: requireCapability("media:delete"),
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
    },
    {
      name: "credit",
      type: "text",
    },
    {
      name: "usageCount",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
  hooks: {
    afterChange: [auditAfterChange("media")],
    afterDelete: [auditAfterDelete("media")],
  },
};
