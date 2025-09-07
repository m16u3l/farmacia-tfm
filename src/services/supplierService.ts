import { Supplier, SupplierFormData } from '@/types';
import { apiRequest } from './api';

export function useSuppliers() {
  const getSuppliers = () => apiRequest<Supplier[]>('/api/suppliers');

  const getSupplier = (id: number) => apiRequest<Supplier>(`/api/suppliers/${id}`);

  const createSupplier = (data: SupplierFormData) =>
    apiRequest<Supplier>('/api/suppliers', {
      method: 'POST',
      body: data,
    });

  const updateSupplier = (id: number, data: Partial<SupplierFormData>) =>
    apiRequest<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: data,
    });

  const deleteSupplier = (id: number) =>
    apiRequest<void>(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });

  return {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
