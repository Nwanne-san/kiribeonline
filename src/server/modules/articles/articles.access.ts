import type { Access, FieldAccess } from "payload";
import { isEditorOrAbove, resolveRole, userCan } from "@/server/access/roles";

type BearerLike = { id?: string | number; role?: string | null } | null;

function idsEqual(a: unknown, b: unknown): boolean {
  return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
}

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

/**
 * Row-level access for article updates. Editors and admins can edit any
 * article; writers and contributors are scoped to articles where they are
 * the author. See DECISIONS.md — "article edit ownership". Custom admin
 * routes use `overrideAccess`, so this only gates the native REST surface;
 * the equivalent check is duplicated in the admin route handlers.
 */
export const articleUpdateAccess: Access = ({ req: { user } }) => {
  const bearer = user as BearerLike;
  if (!userCan(bearer, "articles:edit")) return false;
  if (isEditorOrAbove(resolveRole(bearer))) return true;
  if (!bearer?.id) return false;
  return { author: { equals: bearer.id } };
};

/**
 * Row-level access for article deletes. Same ownership rule as update:
 * writer/contributor may only delete their own; editor/admin may delete any.
 */
export const articleDeleteAccess: Access = ({ req: { user } }) => {
  const bearer = user as BearerLike;
  if (!userCan(bearer, "articles:delete")) return false;
  if (isEditorOrAbove(resolveRole(bearer))) return true;
  if (!bearer?.id) return false;
  return { author: { equals: bearer.id } };
};

/**
 * Field-level guard for the `author` relation. Editors and admins may assign
 * or reassign any user as the byline; writers and contributors may only
 * write their own id. Closes the native-REST bypass where a non-editor
 * could hand off or claim authorship on a row they otherwise pass the
 * row-level update filter for.
 */
export const articleAuthorFieldAccess: FieldAccess = ({ req: { user }, siblingData, data }) => {
  const bearer = user as BearerLike;
  if (!bearer?.id) return false;
  if (isEditorOrAbove(resolveRole(bearer))) return true;
  const proposed =
    (siblingData as { author?: unknown } | undefined)?.author ??
    (data as { author?: unknown } | undefined)?.author;
  if (proposed === undefined) return true;
  return idsEqual(proposed, bearer.id);
};
