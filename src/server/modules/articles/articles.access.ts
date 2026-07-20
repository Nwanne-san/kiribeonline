import type { FieldAccess } from "payload";
import { userCan } from "@/server/access/roles";

/**
 * Field-level guard for an article's `status`: transitions into `published`,
 * `scheduled` (delayed publish), or `archived` (removing a published piece)
 * require `articles:publish`. `draft` and `in_review` (the submit-for-review
 * spine) only need `articles:edit`, so writers and contributors can move
 * their own work through the editorial pipeline. Custom admin routes use
 * `overrideAccess`, so this only gates the native REST surface.
 */
export const articleStatusFieldAccess: FieldAccess = ({ req: { user }, siblingData }) => {
  const nextStatus = (siblingData as { status?: string } | undefined)?.status;
  const bearer = user as { role?: string | null } | null;
  if (
    nextStatus === "published" ||
    nextStatus === "scheduled" ||
    nextStatus === "archived"
  ) {
    return userCan(bearer, "articles:publish");
  }
  return userCan(bearer, "articles:edit");
};
