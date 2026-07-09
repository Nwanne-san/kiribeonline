import type { CollectionConfig } from "payload";
import { anyone, requireCapability } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  protectSystemTaxonomyBeforeChange,
  protectSystemTaxonomyBeforeDelete,
} from "../hooks/protect-system-taxonomy";
import {
  revalidateHomepageAfterChange,
  revalidateHomepageAfterDelete,
} from "../hooks/revalidate-homepage";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    group: "Content",
    defaultColumns: ["name", "brandColor", "displayOrder", "updatedAt"],
  },
  access: {
    read: anyone,
    create: requireCapability("taxonomy:manage"),
    update: requireCapability("taxonomy:manage"),
    delete: requireCapability("taxonomy:manage"),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    slugField("name"),
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "brandColor",
      type: "text",
      defaultValue: "#6B1D2A",
      admin: {
        description: "Hex color for nav badges and filter pills",
      },
    },
    {
      name: "showInNav",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "isSystem",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "System categories cannot be deleted",
      },
    },
    {
      name: "displayOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
  ],
  hooks: {
    beforeChange: [protectSystemTaxonomyBeforeChange],
    beforeDelete: [protectSystemTaxonomyBeforeDelete],
    afterChange: [auditAfterChange("categories"), revalidateHomepageAfterChange],
    afterDelete: [auditAfterDelete("categories"), revalidateHomepageAfterDelete],
  },
};
