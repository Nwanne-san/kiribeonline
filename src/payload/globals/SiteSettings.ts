import type { GlobalConfig } from "payload";
import { NAV_MAX_HEADER_LINKS } from "@/constants";
import { anyone, requireCapability } from "../access";
import { auditGlobalAfterChange } from "../hooks/audit-global";
import { revalidateSiteChromeAfterChange } from "../hooks/revalidate-site-chrome";

/** Header/footer link row — shared shape for both nav arrays. */
const navLinkFields = [
  { name: "label", type: "text" as const, required: true },
  { name: "href", type: "text" as const, required: true },
  { name: "visible", type: "checkbox" as const, defaultValue: true },
];

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: anyone,
    update: requireCapability("settings:manage"),
  },
  hooks: {
    afterChange: [
      auditGlobalAfterChange("site-settings"),
      revalidateSiteChromeAfterChange,
    ],
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
    {
      name: "navigation",
      type: "group",
      admin: {
        description:
          "Public header and footer chrome. Leave empty to fall back to the " +
          "category-derived defaults.",
      },
      fields: [
        {
          name: "headerLinks",
          type: "array",
          // Hard cap — see NAV_MAX_HEADER_LINKS. The admin PATCH schema and the
          // header resolver enforce the same number.
          maxRows: NAV_MAX_HEADER_LINKS,
          labels: { singular: "Header link", plural: "Header links" },
          fields: navLinkFields,
        },
        {
          name: "footerColumns",
          type: "array",
          labels: { singular: "Footer column", plural: "Footer columns" },
          fields: [
            { name: "title", type: "text", required: true },
            {
              name: "links",
              type: "array",
              labels: { singular: "Link", plural: "Links" },
              fields: navLinkFields,
            },
          ],
        },
      ],
    },
  ],
};
