import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  revalidateHomepageAfterChange,
  revalidateHomepageAfterDelete,
} from "../hooks/revalidate-homepage";

export const Reels: CollectionConfig = {
  slug: "reels",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "platform", "published", "updatedAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { published: { equals: true } };
    },
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: "title", type: "text", required: true },
    slugField("title"),
    { name: "label", type: "text", required: true },
    {
      name: "platform",
      type: "select",
      required: true,
      options: [
        { label: "Instagram", value: "instagram" },
        { label: "TikTok", value: "tiktok" },
        { label: "YouTube", value: "youtube" },
      ],
    },
    { name: "thumbnail", type: "upload", relationTo: "media", required: true },
    {
      name: "externalUrl",
      type: "text",
      required: true,
      admin: {
        description:
          "Paste the original post URL (Instagram /reel/, TikTok /video/, YouTube /shorts/ or /watch). The card auto-embeds when recognised.",
      },
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: true,
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
    afterChange: [auditAfterChange("reels"), revalidateHomepageAfterChange],
    afterDelete: [auditAfterDelete("reels"), revalidateHomepageAfterDelete],
  },
};
