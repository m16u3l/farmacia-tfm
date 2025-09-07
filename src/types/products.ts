export interface Product {
  product_id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  dosage_form?: string | null;
  unit?: string | null;
  barcode?: string | null;
  status: boolean;
}

export type ProductFormData = Partial<Product>;

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
  'spray'
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
