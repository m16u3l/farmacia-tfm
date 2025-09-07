import { Product } from './products';
import { Supplier } from './supplier';

export type OrderStatus = 'pendiente' | 'aprobado' | 'recibido' | 'cancelado';

export interface Order {
  order_id: number;
  supplier_id: number;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  supplier?: Supplier;  // For joined queries
  items?: OrderItem[];  // For joined queries
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: Product;  // For joined queries
}

export interface OrderFormData extends Omit<Order, 'order_id' | 'supplier' | 'items'> {
  items: Omit<OrderItem, 'order_item_id' | 'order_id' | 'product'>[];
}

export interface Receipt {
  receipt_id: number;
  order_id: number;
  receipt_date: string;
  received_by?: number | null;
  total_amount: number;
  order?: Order;  // For joined queries
  items?: ReceiptItem[];  // For joined queries
}

export interface ReceiptItem {
  receipt_item_id: number;
  receipt_id: number;
  product_id: number;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity_received: number;
  unit_price: number;
  product?: Product;  // For joined queries
}

export interface ReceiptFormData extends Omit<Receipt, 'receipt_id' | 'order' | 'items'> {
  items: Omit<ReceiptItem, 'receipt_item_id' | 'receipt_id' | 'product'>[];
}
