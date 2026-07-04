import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api";
import { getPayloadClient } from "@/lib/payload/get-payload";

export const dynamic = "force-dynamic";

export async function POST() {
  const payload = await getPayloadClient();
  const prefix = payload.config.cookiePrefix;
  const response = NextResponse.json(apiSuccess({ loggedOut: true }).body);
  response.cookies.set(`${prefix}-token`, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
