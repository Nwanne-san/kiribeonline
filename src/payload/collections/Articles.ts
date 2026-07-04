import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  articleBeforeChange,
  articleBeforeValidate,
} from "../hooks/article-workflow";
import { mediaUsageAfterChange } from "../hooks/media-usage";
import { revalidateArticlesAfterChange } from "../hooks/revalidate-articles";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "status", "featured", "viewCount", "publishedAt", "updatedAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: {
          equals: "published",
        },
      };
    },
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField("title"),
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Show on homepage featured modules",
      },
    },
    {
      name: "featuredPriority",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    {
      name: "viewCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "ogImage", type: "upload", relationTo: "media" },
      ],
    },
  ],
  hooks: {
    beforeValidate: [articleBeforeValidate],
    beforeChange: [articleBeforeChange],
    afterChange: [auditAfterChange("articles"), revalidateArticlesAfterChange, mediaUsageAfterChange],
    afterDelete: [auditAfterDelete("articles")],
  },
};
