import type { GlobalConfig } from "payload";
import { anyone, requireCapability } from "../access";
import { auditGlobalAfterChange } from "../hooks/audit-global";
import { revalidateHomepageGlobalAfterChange } from "../hooks/revalidate-homepage";

/**
 * The homepage section order is fixed to the Figma editorial layout
 * (hero → reels → film/tv/opinion → spotlight → creators → news → archive →
 *  subscribe → footer). Admins manage the *content within* each section, not
 * the order between them.
 */
export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Homepage",
  access: {
    read: anyone,
    update: requireCapability("homepage:manage"),
  },
  hooks: {
    afterChange: [auditGlobalAfterChange("homepage"), revalidateHomepageGlobalAfterChange],
  },
  fields: [
    {
      name: "heroArticle",
      type: "relationship",
      relationTo: "articles",
      admin: { description: "Main hero feature (2/3 layout)" },
    },
    {
      name: "editorsPicks",
      type: "array",
      maxRows: 5,
      labels: { singular: "Pick", plural: "Editor's Picks" },
      fields: [
        {
          name: "article",
          type: "relationship",
          relationTo: "articles",
          required: true,
        },
        {
          name: "sortOrder",
          type: "number",
          defaultValue: 0,
        },
      ],
    },
    {
      name: "categoryModules",
      type: "array",
      labels: { singular: "Category module", plural: "Category modules" },
      admin: {
        description:
          "Each module renders as one category section on the homepage. The first three appear above the Spotlight, the rest below it.",
      },
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: true },
        {
          name: "category",
          type: "relationship",
          relationTo: "categories",
          required: true,
        },
        { name: "sectionTitle", type: "text" },
        {
          name: "layout",
          type: "select",
          defaultValue: "grid-3",
          options: [
            { label: "3-column grid", value: "grid-3" },
            { label: "2-column grid", value: "grid-2" },
            { label: "List", value: "list" },
            { label: "Hero + grid", value: "hero-plus-grid" },
          ],
        },
        { name: "maxItems", type: "number", defaultValue: 3, min: 1, max: 12 },
        {
          name: "articleSelection",
          type: "select",
          defaultValue: "auto",
          options: [
            { label: "Auto (latest published)", value: "auto" },
            { label: "Manual picks", value: "manual" },
          ],
        },
        {
          name: "manualArticles",
          type: "relationship",
          relationTo: "articles",
          hasMany: true,
        },
        { name: "sortOrder", type: "number", defaultValue: 0 },
        { name: "accentColor", type: "text" },
      ],
    },
    {
      name: "spotlightCreator",
      type: "relationship",
      relationTo: "creators",
      admin: { description: "Featured spotlight profile section" },
    },
    {
      name: "featuredCreators",
      type: "array",
      maxRows: 4,
      labels: { singular: "Creator", plural: "Featured creators" },
      fields: [
        {
          name: "creator",
          type: "relationship",
          relationTo: "creators",
          required: true,
        },
        { name: "sortOrder", type: "number", defaultValue: 0 },
      ],
    },
    {
      name: "reelsEnabled",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "reels",
      type: "relationship",
      relationTo: "reels",
      hasMany: true,
      admin: { description: "Reels & Shorts carousel items" },
    },
    {
      name: "archiveCtaEnabled",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
