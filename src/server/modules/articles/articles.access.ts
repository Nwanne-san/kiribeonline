import type { FieldAccess } from "payload";
import { userCan } from "@/server/access/roles";

/**
 * Field-level guard for an article's `status`: transitions into `published` or
 * `archived` require `articles:publish`; draft/scheduled edits only need
 * `articles:edit`. Custom admin routes use `overrideAccess`, so this only gates
 * the native REST surface.
 */
export const articleStatusFieldAccess: FieldAccess = ({ req: { user }, siblingData }) => {
  const nextStatus = (siblingData as { status?: string } | undefined)?.status;
  const bearer = user as { role?: string | null } | null;
  if (nextStatus === "published" || nextStatus === "archived") {
    return userCan(bearer, "articles:publish");
  }
  return userCan(bearer, "articles:edit");
};
