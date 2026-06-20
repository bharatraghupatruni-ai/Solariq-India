import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/webhook",
  "/favicon.ico",
  "/_next",
];

function isPublicPath(path: string) {
  return (
    PUBLIC_PATHS.some((pp) => path === pp || path.startsWith(`${pp}/`)) ||
    path.startsWith("/_next") ||
    /\.(ico|svg|png|jpg|jpeg|gif|webp|css|js|json)$/.test(path)
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Supabase environment variables are missing! Auth middleware bypassed.");
    }
    return response;
  }

  // Supabase auth setup for middleware
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach((c: any) =>
            request.cookies.set(c.name, c.value),
          );
          cookiesToSet.forEach((c: any) =>
            response.cookies.set(c.name, c.value, c.options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicPath(pathname) && (pathname.startsWith("/dashboard") || pathname.startsWith("/analysis") || pathname.startsWith("/reports") || pathname.startsWith("/settings"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // API rate limiting (skip auth/webhook paths)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const clientId = user?.id ?? request.ip ?? "anonymous";
    const limitResult = checkRateLimit(clientId, 100, 3600);

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: limitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limitResult.retryAfter ?? 0),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(limitResult.resetAt),
          },
        },
      );
    }

    recordRequest(clientId);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
