export interface Supplier {
  supplier_id: number;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export type  SupplierFormData = Partial<Supplier>;
