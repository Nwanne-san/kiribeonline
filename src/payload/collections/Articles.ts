import type { CollectionConfig } from "payload";
import { denyFieldWrite, requireCapability } from "../access";
import {
  articleAuthorFieldAccess,
  articleDeleteAccess,
  articleStatusFieldAccess,
  articleUpdateAccess,
} from "@/server/modules/articles/articles.access";
import { slugField } from "../fields/slug";
import { auditAfterChange, auditAfterDelete } from "../hooks/audit";
import {
  articleBeforeChange,
  articleBeforeValidate,
} from "../hooks/article-workflow";
import { mediaUsageAfterChange } from "../hooks/media-usage";
import {
  revalidateArticlesAfterChange,
  revalidateArticlesAfterDelete,
  scrubHomepageBeforeArticleDelete,
} from "../hooks/revalidate-articles";

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
    create: requireCapability("articles:create"),
    update: articleUpdateAccess,
    delete: articleDeleteAccess,
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
      name: "author",
      type: "relationship",
      relationTo: "users",
      access: {
        create: articleAuthorFieldAccess,
        update: articleAuthorFieldAccess,
      },
      admin: {
        position: "sidebar",
        description: "Byline shown on the article and used for author stats",
      },
    },
    {
      // Opt-out only affects the PUBLIC byline. `author` stays populated so the
      // admin module, author stats, and the audit trail always know who wrote
      // the piece — this flag never anonymises the record itself.
      name: "hideByline",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Publish without the writer's name. The public byline reads “Kiribé Editor”; the author is still recorded in the admin.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      access: {
        update: articleStatusFieldAccess,
      },
      options: [
        { label: "Draft", value: "draft" },
        { label: "In review", value: "in_review" },
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
      access: {
        // System-managed (incremented via overrideAccess); never API-writable.
        update: denyFieldWrite,
      },
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      // Set atomically the first time subscribers are notified of a publish.
      // Both the cron and on-demand promotion paths claim this row before
      // sending — if the claim finds it already set, the send is skipped.
      name: "publishNotifiedAt",
      type: "date",
      access: {
        update: denyFieldWrite,
      },
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Timestamp of the subscriber notification for this article. Set once and never reset.",
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
    beforeDelete: [scrubHomepageBeforeArticleDelete],
    afterDelete: [auditAfterDelete("articles"), revalidateArticlesAfterDelete],
  },
};
