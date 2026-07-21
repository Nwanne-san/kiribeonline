import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api";
import { getPayloadClient } from "@/lib/payload/get-payload";

export const dynamic = "force-dynamic";

/**
 * Clears the browser cookie AND removes the current session from
 * `user.sessions` so a stolen copy of the cookie stops authenticating
 * immediately, not just in the same browser. Without the server-side clear,
 * "logout" would only rotate the local state — matching the reset-password
 * fix in AUTH-HARDENING §6.
 *
 * Best-effort: if the incoming cookie has already been forged out or the
 * session record is gone, we still clear the cookie and return success.
 */
export async function POST() {
  const payload = await getPayloadClient();
  const prefix = payload.config.cookiePrefix;
  const response = NextResponse.json(apiSuccess({ loggedOut: true }).body);
  response.cookies.set(`${prefix}-token`, "", { httpOnly: true, path: "/", maxAge: 0 });

  try {
    const headerList = await nextHeaders();
    // `_sid` is attached by Payload's JWT strategy (jwt.js:80) when it verifies
    // the token — pull it back out so we can drop just this session, not the
    // user's other logged-in devices.
    const { user } = await payload.auth({ headers: headerList });
    const sid = (user as { _sid?: string } | null)?._sid;
    if (user && sid) {
      const sessions = ((user as { sessions?: { id: string }[] }).sessions ?? [])
        .filter((s) => s.id !== sid);
      await payload.update({
        collection: "users",
        id: user.id,
        data: { sessions } as never,
        overrideAccess: true,
      });
    }
  } catch (err) {
    console.warn("[auth] logout session cleanup skipped", err);
  }

  return response;
}
