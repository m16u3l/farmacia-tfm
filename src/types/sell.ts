import { Employee } from './employee';
import { Inventory } from './inventory';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'seguro' | 'transferencia';

export interface Sell {
  sell_id: number;
  customer_id?: number | null;
  employee_id?: number | null;
  sell_date: string;
  total_amount: number;
  payment_method: PaymentMethod;
  employee?: Employee;  // For joined queries
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

export type SellFormData = Partial<Sell>;
