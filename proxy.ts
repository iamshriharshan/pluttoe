import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/profile", "/dashboard", "/freelancer", "/startup"];

const roleProtectedPrefixes: Record<string, Array<"freelancer" | "startup">> = {
  "/freelancer": ["freelancer"],
  "/startup": ["startup"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const session = request.cookies.get("pluto_session")?.value;
  const role = request.cookies.get("pluto_role")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  for (const [prefix, allowedRoles] of Object.entries(roleProtectedPrefixes)) {
    if (pathname.startsWith(prefix) && !allowedRoles.includes(role as never)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
