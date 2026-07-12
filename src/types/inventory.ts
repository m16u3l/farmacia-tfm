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
