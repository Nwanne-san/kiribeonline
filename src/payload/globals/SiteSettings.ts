import type { GlobalConfig } from "payload";
import { adminOnly, anyone } from "../access";
import { auditGlobalAfterChange } from "../hooks/audit-global";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: anyone,
    update: adminOnly,
  },
  hooks: {
    afterChange: [auditGlobalAfterChange("site-settings")],
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
      defaultValue: "Kiribe Online",
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "brandColors",
      type: "group",
      fields: [
        { name: "mustard", type: "text", defaultValue: "#C9A227" },
        { name: "burgundy", type: "text", defaultValue: "#6B1D2A" },
      ],
    },
    {
      name: "socialLinks",
      type: "array",
      fields: [
        { name: "platform", type: "text", required: true },
        { name: "url", type: "text", required: true },
      ],
    },
    {
      name: "seoDefaults",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "ogImage", type: "upload", relationTo: "media" },
      ],
    },
  ],
};
