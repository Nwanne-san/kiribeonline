import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  admin: {
    useAsTitle: "subject",
    group: "Marketing",
    defaultColumns: ["name", "email", "subject", "createdAt"],
  },
  access: {
    read: adminOnly,
    create: () => true,
    update: () => false,
    delete: adminOnly,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "subject", type: "text", required: true },
    { name: "message", type: "textarea", required: true },
    { name: "ipAddress", type: "text" },
  ],
  timestamps: true,
};
