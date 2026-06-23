import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Extract token from incoming request cookies
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Route Guard: If trying to access protected dashboard routes and the token cookie is missing,
  // abort the request and redirect the user back to the /login page
  if (pathname.startsWith("/dashboard") && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Continue request execution if route matches public files or token validation succeeds
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
