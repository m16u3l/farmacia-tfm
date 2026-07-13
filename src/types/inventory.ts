import { Product, SaleControl } from './products';

export interface Inventory {
  inventory_id: number;
  product_id: number;
  batch_number?: string | null;
  expiry_date?: string | null;
  expiry_is_approximate?: boolean;
  quantity_available: number;
  area_id?: number | null;
  purchase_price: number;
  sale_price: number;
  product?: Product;  // For joined queries
  product_name?: string;  // For joined queries
  product_description?: string;  // For joined queries
  product_category?: string;  // For joined queries
  product_laboratory?: string | null;  // For joined queries
  product_active_ingredient?: string | null;  // For joined queries
  product_concentration?: string | null;  // For joined queries
  product_barcode?: string | null;  // For joined queries
  product_sale_control?: SaleControl | null;  // For joined queries
  area_name?: string;  // For joined queries
  area_full_path?: string;  // For joined queries — "Padre › Hijo › Nieto"
}

export type InventoryFormData = Omit<Inventory, 'inventory_id' | 'product'>;

// Motivo estructurado de una transferencia entre áreas (inventory_movements.reason),
// análogo al discrepancy_reason de las validaciones.
export const TRANSFER_REASONS = ['reposicion', 'reubicacion', 'vencido', 'dañado', 'otro'] as const;
export type TransferReason = typeof TRANSFER_REASONS[number];

export const TRANSFER_REASON_LABELS: Record<TransferReason, string> = {
  reposicion: 'Reposición (surtir área de venta)',
  reubicacion: 'Reubicación / reorganización',
  vencido: 'Producto vencido (retiro)',
  dañado: 'Producto dañado (retiro)',
  otro: 'Otro',
};
