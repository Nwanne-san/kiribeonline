import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from "payload";

export const articleBeforeValidate: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  // Merge behavior: for PATCH-style updates Payload only passes changed fields
  // in `data`. Fall back to the persisted row so a partial patch that changes
  // only `status` still validates against the existing `publishedAt`.
  const status = data?.status ?? originalDoc?.status;
  const publishedAt = data?.publishedAt ?? originalDoc?.publishedAt;

  if (status === "scheduled" && !publishedAt) {
    throw new Error("Scheduled articles require a publish date.");
  }
  if (status === "published" && !data?.title && !originalDoc?.title) {
    throw new Error("Published articles require a title.");
  }
  return data;
};

export const articleBeforeChange: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data;

  if (data.status === "published" && !data.publishedAt) {
    data.publishedAt = new Date().toISOString();
  }

  if (data.status === "published") {
    data._status = "published";
  } else {
    // draft, in_review, scheduled, archived — all keep the versioned doc off
    // the published surface. `scheduled` is later promoted by the cron
    // publisher (which flips status → published, re-triggering this hook).
    data._status = "draft";
  }

  return data;
};
