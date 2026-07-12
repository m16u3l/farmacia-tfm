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
    "/inventory-validations",
    "/sells",
    "/cash-register-closures",
    "/orders",
    "/suppliers",
    "/reports",
  ],
  cajero: ["/dashboard", "/sells", "/cash-register-closures", "/inventory"],
};

export function roleCanAccess(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  if (allowed === "*") return true;
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Mapea el primer segmento de una ruta /api/<dominio>/... a la sección del
// panel equivalente en ROLE_PERMISSIONS, para aplicar la misma restricción de
// rol también a la API (antes solo se ocultaba en la UI — cualquier usuario
// autenticado podía llamar cualquier endpoint mutante directamente).
const API_DOMAIN_TO_PAGE_PATH: Record<string, string> = {
  products: "/products",
  inventory: "/inventory",
  "inventory-areas": "/areas",
  "inventory-validations": "/inventory-validations",
  sells: "/sells",
  "cash-register-closures": "/cash-register-closures",
  orders: "/orders",
  suppliers: "/suppliers",
  employees: "/employees",
  users: "/users",
  configuracion: "/configuracion",
};

export function roleCanAccessApi(role: UserRole, pathname: string): boolean {
  // pathname es del tipo "/api/<dominio>/...". Dominios sin página asociada
  // (auth, cron) no tienen restricción de rol aquí — se autentican por su
  // propio mecanismo (sesión ya verificada antes de llegar aquí, o CRON_SECRET).
  const domain = pathname.split("/")[2];
  const pagePath = API_DOMAIN_TO_PAGE_PATH[domain];
  if (!pagePath) return true;
  return roleCanAccess(role, pagePath);
}
