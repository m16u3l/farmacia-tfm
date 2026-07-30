import { AreaCoverageStatus, ValidationItemStatus, ValidationType } from "@/types";

export const VALIDATION_TYPE_LABELS: Record<ValidationType, string> = {
  area: "Por área/ubicación",
  expiring: "Próximos a vencer",
  expired: "Vencidos",
  low_stock: "Bajo stock",
};

export const VALIDATION_ITEM_STATUS_LABELS: Record<
  ValidationItemStatus,
  { label: string; color: "default" | "success" | "warning" | "error" | "info" }
> = {
  pending: { label: "PENDIENTE", color: "default" },
  confirmed: { label: "VERIFICADO OK", color: "success" },
  inconsistent: { label: "INCONSISTENCIA", color: "warning" },
  not_found: { label: "NO ENCONTRADO", color: "error" },
  added: { label: "AGREGADO", color: "info" },
  moved: { label: "REUBICADO", color: "info" },
};

/**
 * Estado de cobertura de un área. Compartido entre la pestaña "Estado" de
 * /inventory-validations y el mapa de /areas, para que ambos muestren siempre
 * la misma etiqueta y el mismo color.
 */
export const COVERAGE_STATUS_LABELS: Record<
  AreaCoverageStatus,
  { label: string; color: "default" | "success" | "warning" | "error" | "info" }
> = {
  validated: { label: "Validada", color: "success" },
  due_soon: { label: "Por vencer", color: "warning" },
  overdue: { label: "Vencida", color: "error" },
  never: { label: "Nunca validada", color: "error" },
  no_stock: { label: "Sin stock", color: "default" },
};
