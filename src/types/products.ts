export interface Product {
  product_id: number;
  name: string;
  description?: string | null;
  possible_uses?: string | null;
  additional_info?: string | null;
  laboratory?: string | null;
  active_ingredient?: string | null;
  concentration?: string | null;
  health_registry?: string | null;
  category?: string | null;
  type?: string | null;
  dosage_form?: string | null;
  unit?: string | null;
  dosage_instructions?: string | null;
  barcode?: string | null;
  sale_control: SaleControl;
  // Umbral de bajo stock propio del producto; null = usar el global de configuración
  low_stock_threshold?: number | null;
  status: boolean;
  created_by?: number | null;
  created_at?: string;
}

export type ProductFormData = Omit<Product, 'product_id' | 'created_by' | 'created_at'>;

export const SALE_CONTROLS = ['libre', 'receta', 'controlado'] as const;
export type SaleControl = typeof SALE_CONTROLS[number];

export const SALE_CONTROL_LABELS: Record<SaleControl, string> = {
  libre: 'Venta libre',
  receta: 'Requiere receta',
  controlado: 'Control especial',
};

export const DOSAGE_FORMS = [
  'tableta',
  'cápsula',
  'jarabe',
  'ampolla',
  'crema',
  'ungüento',
  'suspensión',
  'polvo',
  'gotas',
  'spray',
  'otro'
] as const;

export const PRODUCT_TYPES = [
  'medicamento',
  'suplemento',
  'material médico',
  'cosmético',
  'higiene',
  'otros'
] as const;

export const PRODUCT_CATEGORIES = [
  'analgésicos',
  'antibióticos',
  'antiinflamatorios',
  'antipiréticos',
  'cardiovasculares',
  'dermatológicos',
  'gastrointestinales',
  'respiratorios',
  'vitaminas',
  'otros'
] as const;

export const PRODUCT_UNITS = [
  'unidad',
  'caja',
  'frasco',
  'ampolla',
  'tubo',
  'sobre',
  'blíster',
  'botella'
] as const;

export type DosageForm = typeof DOSAGE_FORMS[number];
export type ProductType = typeof PRODUCT_TYPES[number];
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type ProductUnit = typeof PRODUCT_UNITS[number];
