import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { roleCanAccess, roleCanAccessApi } from "@/lib/permissions";

const PUBLIC_PATHS = ["/", "/login"];
// /api/cron se autentica con CRON_SECRET (bearer token), no con sesión —
// Vercel Cron lo invoca sin cookie de sesión.
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/cron"];

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

  if (isApi) {
    if (!roleCanAccessApi(session.role, pathname)) {
      return NextResponse.json(
        { error: "No tiene permiso para acceder a este recurso" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Restricción por rol en páginas del panel.
  if (!roleCanAccess(session.role, pathname)) {
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
