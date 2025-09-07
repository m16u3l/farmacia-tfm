import { useState, useEffect } from 'react';
import { Supplier, SupplierFormData } from '@/types';
import { apiRequest } from '@/services/api';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<Supplier[]>('/api/suppliers');
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  const createSupplier = async (data: SupplierFormData) => {
    try {
      const newSupplier = await apiRequest<Supplier>('/api/suppliers', {
        method: 'POST',
        body: data,
      });
      setSuppliers(prev => [newSupplier, ...prev]);
      return newSupplier;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear proveedor');
    }
  };

  const updateSupplier = async (id: number, data: Partial<SupplierFormData>) => {
    try {
      const updatedSupplier = await apiRequest<Supplier>(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: data,
      });
      setSuppliers(prev => 
        prev.map(supplier => 
          supplier.supplier_id === id ? updatedSupplier : supplier
        )
      );
      return updatedSupplier;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar proveedor');
    }
  };

  const deleteSupplier = async (id: number) => {
    try {
      await apiRequest<void>(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      setSuppliers(prev => prev.filter(supplier => supplier.supplier_id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar proveedor');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
}
