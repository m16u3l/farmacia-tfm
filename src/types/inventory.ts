import { Product } from './products';

export interface Inventory {
  inventory_id: number;
  product_id: number;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity_available: number;
  location?: string | null;
  purchase_price: number;
  sale_price: number;
  product?: Product;  // For joined queries
}

export type InventoryFormData = Omit<Inventory, 'inventory_id' | 'product'>;
