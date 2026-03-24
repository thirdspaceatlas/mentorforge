import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN = "qtrai";
const ACCESS_COOKIE = "access";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // ✅ Check access token FIRST — before touching Supabase
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

  if (cookieValue !== ACCESS_TOKEN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // ✅ Only initialize Supabase if the user has access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers }
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: { headers: request.headers }
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/app") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon\\.ico).*)"]
};