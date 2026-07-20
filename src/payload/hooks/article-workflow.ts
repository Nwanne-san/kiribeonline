import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from "payload";

export const articleBeforeValidate: CollectionBeforeValidateHook = ({ data }) => {
  if (data?.status === "scheduled" && !data?.publishedAt) {
    throw new Error("Scheduled articles require a publish date.");
  }
  if (data?.status === "published" && !data?.title) {
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
