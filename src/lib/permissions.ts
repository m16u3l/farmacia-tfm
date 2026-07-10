export type UserRole = "admin" | "farmaceutico" | "cajero";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  farmaceutico: "Farmacéutico",
  cajero: "Cajero",
};

// Permisos por rol. "*" = todas las secciones del panel.
export const ROLE_PERMISSIONS: Record<UserRole, string[] | "*"> = {
  admin: "*",
  farmaceutico: [
    "/dashboard",
    "/products",
    "/inventory",
    "/areas",
    "/sells",
    "/orders",
    "/suppliers",
    "/validations",
  ],
  cajero: ["/dashboard", "/sells", "/inventory"],
};

export function roleCanAccess(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  if (allowed === "*") return true;
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
