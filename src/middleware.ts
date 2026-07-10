import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { roleCanAccess } from "@/lib/permissions";

const PUBLIC_PATHS = ["/", "/login"];
const PUBLIC_API_PATHS = ["/api/auth/login"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Restricción por rol en páginas del panel (no en /api, para no romper
  // llamadas cruzadas legítimas entre secciones que ya filtra la UI).
  if (!isApi && !roleCanAccess(session.role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todo excepto: _next/static, _next/image, favicon.ico,
     * y archivos estáticos comunes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
