// Resolución de los umbrales de alerta en el cliente. Es el equivalente de los
// COALESCE que hace el servidor (ver src/app/api/cron/route.ts y
// src/app/api/inventory-validations/route.ts): el valor propio del lote /
// producto gana, y null cae al valor global de configuracion.

// Días de anticipación de la alerta de vencimiento: lote → global.
export const resolveExpiryAlertDays = (
  own: number | null | undefined,
  global: number
): number => own ?? global;

// Umbral de bajo stock: producto → global.
export const resolveLowStockThreshold = (
  own: number | null | undefined,
  global: number
): number => own ?? global;

// Días hasta el vencimiento (negativo si ya venció), o null si no hay fecha válida.
export function getDaysUntilExpiry(
  expiryDate: string | null | undefined
): number | null {
  if (!expiryDate) return null;
  const parsed = new Date(expiryDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function isExpired(expiryDate: string | null | undefined): boolean {
  const days = getDaysUntilExpiry(expiryDate);
  return days !== null && days < 0;
}

export function isAboutToExpire(
  expiryDate: string | null | undefined,
  alertDays: number
): boolean {
  const days = getDaysUntilExpiry(expiryDate);
  return days !== null && days >= 0 && days <= alertDays;
}

export const isLowStock = (quantity: number, threshold: number): boolean =>
  quantity <= threshold;
