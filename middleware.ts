import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET!;

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const signupPending = req.cookies.get("signup_pending")?.value === "true";
  const { pathname } = req.nextUrl;

  if (signupPending && pathname !== "/verify") {
    return NextResponse.redirect(new URL("/verify", req.url));
  }

  const protectedPaths = ["/dashboard", "/admin", "/creator"];
  if (!token && protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role: string };

      if (pathname.startsWith("/admin") && decoded.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (pathname.startsWith("/creator") && decoded.role !== "EVENT_CREATOR") {
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (
        pathname.startsWith("/dashboard") &&
        decoded.role === "ADMIN"
      ) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      if (
        decoded &&
        (pathname === "/login" ||
          pathname.startsWith("/signup") )
      ) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (err) {
      console.error("JWT error:", err);
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete("token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/creator/:path*",
    "/account/:path*",
    "/login",
    "/signup/:path*",
    "/verify",
  ],
};
