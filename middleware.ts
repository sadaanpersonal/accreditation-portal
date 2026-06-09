import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route → required role codes (any match grants access)
const PROTECTED: Record<string, string[]> = {
  "/admin":      ["SUPER_ADMIN", "FA_OWNER", "ZONE_OWNER", "MEDIA_OWNER", "MOI_OFFICER"],
  "/requestor":  ["REQUESTOR"],
  "/accredited": ["ACCREDITED"],
};

/**
 * Decode the JWT payload without verifying the signature.
 * We trust the server already verified it; here we just need the role claim.
 */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find which protected prefix matches
  const matchedPrefix = Object.keys(PROTECTED).find(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!matchedPrefix) return NextResponse.next();

  // Read token from cookie (set by login page) OR from Authorization header
  const cookieToken = request.cookies.get("access_token")?.value;

  // If no token → redirect to login
  if (!cookieToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodePayload(cookieToken);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check token expiry
  const exp = payload["exp"] as number | undefined;
  if (exp && Date.now() / 1000 > exp) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("access_token");
    return res;
  }

  // Check role
  const userRole = (payload["role"] ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? "") as string;
  const allowed  = PROTECTED[matchedPrefix];

  if (!allowed.includes(userRole)) {
    // Logged in but wrong role → redirect to their own area
    if (["SUPER_ADMIN", "FA_OWNER", "ZONE_OWNER", "MEDIA_OWNER", "MOI_OFFICER"].includes(userRole)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (userRole === "REQUESTOR") {
      return NextResponse.redirect(new URL("/requestor", request.url));
    }
    if (userRole === "ACCREDITED") {
      return NextResponse.redirect(new URL("/accredited", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/requestor/:path*", "/accredited/:path*"],
};
