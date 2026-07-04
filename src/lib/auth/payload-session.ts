import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload/get-payload";

export type AdminUser = {
  id: string | number;
  email: string;
  name?: string | null;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  const payload = await getPayloadClient();
  const headerList = await headers();
  const { user } = await payload.auth({ headers: headerList });
  return (user as AdminUser | undefined) ?? null;
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export async function getAdminUserFromRequest(
  request: Request
): Promise<AdminUser | null> {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });
  return (user as AdminUser | undefined) ?? null;
}

export async function requireAdminUserFromRequest(
  request: Request
): Promise<AdminUser> {
  const user = await getAdminUserFromRequest(request);
  if (!user) {
    throw new AdminAuthError("Unauthorized");
  }
  return user;
}

export class AdminAuthError extends Error {
  statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AdminAuthError";
  }
}
