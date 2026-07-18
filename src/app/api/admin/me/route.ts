import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminUserFromRequest } from "@/server/auth";
import { ROLE_CAPABILITIES } from "@/server/access/roles";

export const dynamic = "force-dynamic";

/**
 * The "receiving the restrictions" seam: the admin client fetches its own
 * identity + the flattened capability list for its role once, caches it, and
 * gates nav/actions off `capabilities` (mirrors BrandDrive's permissions API).
 * Authoritative enforcement still happens server-side on every mutation.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminUserFromRequest(request);
    return apiSuccess({
      id: String(user.id),
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      status: user.status ?? "active",
      capabilities: ROLE_CAPABILITIES[user.role],
    });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
