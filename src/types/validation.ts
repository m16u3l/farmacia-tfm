export type ValidationType = 'area' | 'expiring' | 'expired' | 'low_stock';
export type ValidationStatus = 'in_progress' | 'completed' | 'cancelled';
export type ValidationItemStatus = 'pending' | 'confirmed' | 'inconsistent' | 'not_found';

export interface InventoryValidation {
  validation_id: number;
  type: ValidationType;
  area_id?: number | null;
  status: ValidationStatus;
  notes?: string | null;
  started_by?: number | null;
  started_at: string;
  completed_at?: string | null;
  area_name?: string; // For joined queries
}

export interface InventoryValidationItem {
  validation_item_id: number;
  validation_id: number;
  inventory_id: number | null;
  expected_quantity: number;
  actual_quantity: number | null;
  status: ValidationItemStatus;
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
