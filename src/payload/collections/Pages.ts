import type { CollectionConfig } from "payload";
import { requireCapability } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  revalidatePagesAfterChange,
  revalidatePagesAfterDelete,
} from "../hooks/revalidate-pages";

/**
 * Standalone CMS pages rendered at `/<slug>` by `src/app/(site)/[slug]/page.tsx`.
 *
 * The hand-built marketing routes (`/about`, `/contact`, `/privacy`, `/terms`)
 * stay as React pages — Next resolves static segments before the dynamic one,
 * so a CMS page can never shadow them. Use this for editor-owned pages that
 * don't warrant bespoke layout work.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
  },
  access: {
    // Anonymous readers only ever see published pages; any signed-in CMS user
    // can read drafts so the admin list and preview work.
    read: ({ req: { user } }) => {
      if (user) return true;
      return { status: { equals: "published" } };
    },
    create: requireCapability("settings:manage"),
    update: requireCapability("settings:manage"),
    delete: requireCapability("settings:manage"),
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
      admin: {
        description: "Short summary used for the page meta description.",
      },
    },
    {
      name: "body",
      type: "richText",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
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
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "showInFooter",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Offer this page in the Navigation & Footer link picker.",
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
    afterChange: [auditAfterChange("pages"), revalidatePagesAfterChange],
    afterDelete: [auditAfterDelete("pages"), revalidatePagesAfterDelete],
  },
};
