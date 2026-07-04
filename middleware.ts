import { NextResponse, type NextRequest } from "next/server";
import { AdminRoutes } from "@/routes/admin.routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL(AdminRoutes.dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
