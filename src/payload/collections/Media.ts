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
    // Focal point drives smart cropping for the fixed-ratio sizes below.
    focalPoint: true,
    adminThumbnail: "thumbnail",
    // Pre-generated responsive variants (via sharp). Names map to how the
    // public UI uses images: list thumbnails, grid/featured cards, wide heros,
    // and a 1200×630 OpenGraph crop for social/link previews.
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 576, position: "centre" },
      { name: "wide", width: 1600, height: 900, position: "centre" },
      { name: "og", width: 1200, height: 630, position: "centre" },
    ],
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
