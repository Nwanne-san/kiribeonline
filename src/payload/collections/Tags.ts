import type { CollectionConfig } from "payload";
import { adminOnly, anyone } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  protectSystemTaxonomyBeforeChange,
  protectSystemTaxonomyBeforeDelete,
} from "../hooks/protect-system-taxonomy";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    group: "Content",
    defaultColumns: ["name", "brandColor", "updatedAt"],
  },
  access: {
    read: anyone,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    slugField("name"),
    {
      name: "brandColor",
      type: "text",
      defaultValue: "#C9A227",
      admin: {
        description: "Hex color for tag labels on cards",
      },
    },
    {
      name: "isSystem",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "System tags cannot be deleted",
      },
    },
  ],
  hooks: {
    beforeChange: [protectSystemTaxonomyBeforeChange],
    beforeDelete: [protectSystemTaxonomyBeforeDelete],
    afterChange: [auditAfterChange("tags")],
    afterDelete: [auditAfterDelete("tags")],
  },
};
