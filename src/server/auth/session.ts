import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { resolveRole, type UserRole, type UserStatus } from "@/server/access/roles";

export type AdminUser = {
  id: string | number;
  email: string;
  name?: string | null;
  role: UserRole;
  status?: UserStatus | null;
};

function toAdminUser(user: unknown): AdminUser | null {
  if (!user) return null;
  const doc = user as {
    id: string | number;
    email: string;
    name?: string | null;
    role?: UserRole | null;
    status?: UserStatus | null;
  };
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name ?? null,
    role: resolveRole(doc),
    status: doc.status ?? null,
  };
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const payload = await getPayloadClient();
  const headerList = await headers();
  const { user } = await payload.auth({ headers: headerList });
  return toAdminUser(user);
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  // Only active accounts may use the admin. `pending` = invited but not yet
  // activated; `suspended` = revoked. Both are turned away here.
  if (user.status === "suspended" || user.status === "pending") {
    redirect("/admin/login");
  }
  return user;
}

export async function getAdminUserFromRequest(
  request: Request
): Promise<AdminUser | null> {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });
  return toAdminUser(user);
}

export async function requireAdminUserFromRequest(
  request: Request
): Promise<AdminUser> {
  const user = await getAdminUserFromRequest(request);
  if (!user) {
    throw new AdminAuthError("Unauthorized");
  }
  // Only active accounts may act. `pending` (invited, not activated) and
  // `suspended` (revoked) are both rejected regardless of role/capabilities.
  if (user.status === "suspended") {
    throw new AdminAuthError("Account suspended", 403);
  }
  if (user.status === "pending") {
    throw new AdminAuthError("Account not activated", 403);
  }
  return user;
}

export class AdminAuthError extends Error {
  statusCode: number;
  constructor(message = "Unauthorized", statusCode = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.statusCode = statusCode;
  }
}
