import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ACCESS_TOKEN = "qtrai";
const ACCESS_COOKIE = "access";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const urlToken = request.nextUrl.searchParams.get("token");
  const cookieValue = request.cookies.get(ACCESS_COOKIE)?.value;

  if (urlToken === ACCESS_TOKEN) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("token");
    const res = NextResponse.redirect(url);
    res.cookies.set(ACCESS_COOKIE, ACCESS_TOKEN, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  }

  if (cookieValue === ACCESS_TOKEN) {
    if (pathname.startsWith("/app")) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next();
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/((?!_next|favicon\\.ico).*)"]
};
