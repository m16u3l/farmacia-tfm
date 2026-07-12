export type ExpenseCategory = 'administrativo' | 'orden_compra';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  administrativo: 'Administrativo',
  orden_compra: 'Orden de compra',
};

export interface Expense {
  expense_id: number;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  description: string | null;
  order_id: number | null;
  created_by: number | null;
  created_at: string;
  order_products?: string | null;  // nombres de los productos de la orden vinculada (agregado en el GET)
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: string;  // string por ser input controlado; se valida/convierte al enviar
  expense_date: string;  // yyyy-mm-dd
  description: string;
  order_id: number | null;
}
