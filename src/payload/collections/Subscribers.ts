import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";

export const Subscribers: CollectionConfig = {
  slug: "subscribers",
  admin: {
    useAsTitle: "email",
    group: "Marketing",
    defaultColumns: ["email", "confirmed", "confirmedAt", "createdAt"],
  },
  access: {
    read: adminOnly,
    create: () => true,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
    },
    {
      name: "consent",
      type: "checkbox",
      required: true,
      defaultValue: true,
    },
    {
      name: "source",
      type: "text",
      defaultValue: "website",
    },
    {
      name: "confirmed",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "True once the subscriber clicks the confirmation link in their email.",
      },
    },
    {
      name: "confirmationToken",
      type: "text",
      admin: { position: "sidebar", readOnly: true, hidden: false },
    },
    {
      name: "confirmedAt",
      type: "date",
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  timestamps: true,
};
