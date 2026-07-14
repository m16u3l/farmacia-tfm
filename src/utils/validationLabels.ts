import { ValidationItemStatus, ValidationType } from "@/types";

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
