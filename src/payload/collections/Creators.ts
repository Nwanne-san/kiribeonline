import type { CollectionConfig } from "payload";
import { adminOnly, anyone } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  revalidateHomepageAfterChange,
  revalidateHomepageAfterDelete,
} from "../hooks/revalidate-homepage";

export const Creators: CollectionConfig = {
  slug: "creators",
  admin: {
    useAsTitle: "name",
    group: "Content",
    defaultColumns: ["name", "role", "featuredOnHomepage", "updatedAt"],
  },
  access: {
    read: anyone,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: "name", type: "text", required: true },
    slugField("name"),
    { name: "role", type: "text", required: true },
    { name: "bio", type: "textarea" },
    { name: "portrait", type: "upload", relationTo: "media", required: true },
    { name: "quote", type: "textarea" },
    {
      name: "badges",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "color", type: "text", defaultValue: "#6B1D2A" },
      ],
    },
    {
      name: "achievements",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
        { name: "icon", type: "select", options: ["award", "star", "trending", "medal"], defaultValue: "award" },
      ],
    },
    {
      name: "featuredOnHomepage",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
  ],
  hooks: {
    afterChange: [auditAfterChange("creators"), revalidateHomepageAfterChange],
    afterDelete: [auditAfterDelete("creators"), revalidateHomepageAfterDelete],
  },
};
