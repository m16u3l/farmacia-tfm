export type OrderStatus = 'pendiente' | 'comprado' | 'descartado';

// Solicitud de reposición: productos faltantes + nota. supplier_id y los
// campos quantity/unit_price de los items solo existen en órdenes históricas
// anteriores a la migración 016.
export interface Order {
  order_id: number;
  supplier_id: number | null;
  order_date: string;
  status: OrderStatus;
  note: string | null;
  products: OrderProduct[];  // productos señalados como faltantes (agregado en el GET)
}

export interface OrderProduct {
  product_id: number;
  name: string;
}

export interface OrderFormData {
  product_ids: number[];
  note: string;
}
