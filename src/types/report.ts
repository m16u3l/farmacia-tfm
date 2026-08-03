// Fila del ranking de productos más vendidos (/api/sells/top-products).
// total_cost y total_profit solo llegan cuando el usuario es admin.
export interface TopProductRow {
  product_id: number;
  product_name: string;
  category: string | null;
  unit: string | null;
  total_quantity: number;
  total_revenue: number;
  sell_count: number;
  total_cost?: number;
  total_profit?: number;
}
