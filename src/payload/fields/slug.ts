import type { Field } from "payload";

export function slugField(sourceField = "title"): Field {
  return {
    name: "slug",
    type: "text",
    required: true,
    unique: true,
    index: true,
    admin: {
      position: "sidebar",
    },
    hooks: {
      beforeValidate: [
        ({ data, value }) => {
          if (value) return value;
          const source = data?.[sourceField];
          if (typeof source !== "string") return value;
          return source
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        },
      ],
    },
  };
}
