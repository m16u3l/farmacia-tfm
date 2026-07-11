import { Inventory } from './inventory';

export type PaymentMethod = 'efectivo' | 'qr_transferencia';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  qr_transferencia: 'QR/Transferencia',
};

export interface Sell {
  sell_id: number;
  user_id?: number | null;
  user_name?: string;  // For joined queries
  sell_date: string;
  total_amount: number;
  payment_method: PaymentMethod;
  closure_id?: number | null;  // Set once the sale is included in a cash register closure (locks it)
  items?: SellItem[];  // For joined queries
}

export interface SellItem {
  sell_item_id: number;
  sell_id: number;
  inventory_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  inventory?: Inventory;  // For joined queries
}

export interface SellFormData {
  payment_method: PaymentMethod;
  items?: SellItem[];
}
