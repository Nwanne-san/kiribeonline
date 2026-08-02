import type { CollectionConfig } from "payload";
import { requireCapability } from "../access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  revalidateHomepageAfterChange,
  revalidateHomepageAfterDelete,
} from "../hooks/revalidate-homepage";
import { resolveReelExternalUrl } from "../hooks/resolve-reel-url";

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
    create: requireCapability("reels:manage"),
    update: requireCapability("reels:manage"),
    delete: requireCapability("reels:manage"),
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
          "Paste the original post URL. Instagram /reel/, TikTok /video/, and YouTube /shorts/ or /watch all auto-embed. TikTok mobile short links (vm.tiktok.com/…) and web share links (tiktok.com/t/…) are resolved to their canonical URL on save so they embed too.",
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
    beforeChange: [resolveReelExternalUrl],
    afterChange: [auditAfterChange("reels"), revalidateHomepageAfterChange],
    afterDelete: [auditAfterDelete("reels"), revalidateHomepageAfterDelete],
  },
};
