// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public/") ||
    pathname.startsWith("/evidence/")
  ) return NextResponse.next();

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const uid = req.cookies.get("uid")?.value;
  const email = req.cookies.get("email")?.value;

  if (!uid || !email) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname || "/");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
