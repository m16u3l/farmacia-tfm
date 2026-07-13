export type ValidationType = 'area' | 'expiring' | 'expired' | 'low_stock';
export type ValidationStatus = 'in_progress' | 'completed' | 'cancelled';
export type ValidationItemStatus = 'pending' | 'confirmed' | 'inconsistent' | 'not_found';

export const DISCREPANCY_REASONS = ['vencido', 'dañado', 'merma', 'error_conteo', 'otro'] as const;
export type DiscrepancyReason = typeof DISCREPANCY_REASONS[number];

export const DISCREPANCY_REASON_LABELS: Record<DiscrepancyReason, string> = {
  vencido: 'Vencido',
  dañado: 'Dañado',
  merma: 'Merma',
  error_conteo: 'Error de conteo',
  otro: 'Otro',
};

export interface InventoryValidation {
  validation_id: number;
  type: ValidationType;
  area_id?: number | null;
  status: ValidationStatus;
  notes?: string | null;
  started_by?: number | null;
  started_at: string;
  completed_at?: string | null;
  inventory_adjusted_at?: string | null;
  inventory_adjusted_by?: number | null;
  area_name?: string; // For joined queries
}

export interface InventoryValidationItem {
  validation_item_id: number;
  validation_id: number;
  inventory_id: number | null;
  expected_quantity: number;
  actual_quantity: number | null;
  // Fecha de vencimiento real observada al verificar (opcional; NULL = no se
  // corrigió). El "esperado" es el `expiry_date` de abajo, leído en vivo.
  actual_expiry_date?: string | null;
  status: ValidationItemStatus;
  discrepancy_reason?: DiscrepancyReason | null;
  notes?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  // For joined queries (product/lot details at the time of validation)
  product_name?: string;
  batch_number?: string | null;
  expiry_date?: string | null;
}

export interface InventoryValidationWithItems extends InventoryValidation {
  items: InventoryValidationItem[];
}

export interface ValidationAdjustmentApplied {
  inventory_id: number;
  quantity?: { from: number; to: number };
  expiry_date?: { from: string | null; to: string };
}

export interface ValidationAdjustmentResult {
  validation: InventoryValidation;
  applied: ValidationAdjustmentApplied[];
  skipped: { validation_item_id: number; inventory_id: number | null; reason: string }[];
}

// Estado de cobertura por área (GET /api/inventory-validations/coverage):
// validated: última validación conciliada dentro del período de vigencia.
// due_soon:  vigente, pero le quedan pocos días.
// overdue:   la última validación conciliada ya expiró.
// never:     nunca tuvo una validación conciliada.
// no_stock:  sin lotes con stock — no requiere conteo, excluida del %.
export type AreaCoverageStatus = 'validated' | 'due_soon' | 'overdue' | 'never' | 'no_stock';

export interface AreaCoverage {
  area_id: number;
  name: string;
  parent_area_id: number | null;
  active_lots: number;
  last_validation_id: number | null;
  last_validated_at: string | null;
  validated_by_name: string | null;
  days_since_validated: number | null;
  days_remaining: number | null;
  // Hay una validación completada posterior a la última conciliada cuyos
  // ajustes al inventario aún no se aplicaron.
  has_pending_adjustments: boolean;
  status: AreaCoverageStatus;
}

export interface ValidationCoverage {
  validation_period_days: number;
  total_areas: number;
  validated_areas: number;
  coverage_percent: number;
  fully_validated: boolean;
  areas: AreaCoverage[];
}
