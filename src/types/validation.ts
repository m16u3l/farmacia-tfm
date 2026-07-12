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
