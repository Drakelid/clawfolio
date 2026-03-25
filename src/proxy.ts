import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "./lib/auth";
import { applyBasePath, BASE_PATH } from "./lib/base-path";

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isPassThroughRoute(pathname: string): boolean {
  return pathname === "/api/admin/auth" || pathname === "/api/admin/logout";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basePath = request.nextUrl.basePath || BASE_PATH;

  if (!isProtectedRoute(pathname) || isPassThroughRoute(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const authenticated = Boolean(secret && token && (await verifyToken(token, secret)));

  if (pathname === "/admin/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL(applyBasePath("/admin/site", basePath), request.url));
    }

    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL(applyBasePath("/admin/login", basePath), request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
