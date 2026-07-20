import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import {
  AdminAuthError,
  handleAdminRouteError,
  requireAdminUserFromRequest,
} from "@/server/auth";
import { can } from "@/server/access/roles";
import { listAuthorPickerCandidates } from "@/server/modules/users";

export const dynamic = "force-dynamic";

/**
 * Author-picker candidate list for the article editor. Deliberately NOT
 * gated behind `users:manage` — that would deny publish holders who need
 * to file an article on behalf of another user. Instead, either capability
 * grants access:
 *
 *   - `users:manage` — team admins (full user list is theirs anyway)
 *   - `articles:publish` — editors reassigning a byline
 *
 * The response omits email/role/status — id + display name only — so this
 * endpoint can't be used to enumerate the team (a prior review flagged the
 * full-user-list endpoint's email exposure; this one avoids that entirely).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminUserFromRequest(request);
    const allowed =
      can(user.role, "users:manage") || can(user.role, "articles:publish");
    if (!allowed) {
      throw new AdminAuthError("Forbidden", 403);
    }
    const docs = await listAuthorPickerCandidates();
    return apiSuccess({ docs });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
