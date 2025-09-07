import { Inventory, InventoryFormData } from '@/types';
import { apiRequest } from './api';

export function useInventory() {
  const getInventoryItems = () => apiRequest<Inventory[]>('/api/inventory');

  const getInventoryItem = (id: number) => apiRequest<Inventory>(`/api/inventory/${id}`);

  const createInventoryItem = (data: InventoryFormData) =>
    apiRequest<Inventory>('/api/inventory', {
      method: 'POST',
      body: data,
    });

  const updateInventoryItem = (id: number, data: Partial<InventoryFormData>) =>
    apiRequest<Inventory>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: data,
    });

  const deleteInventoryItem = (id: number) =>
    apiRequest<void>(`/api/inventory/${id}`, {
      method: 'DELETE',
    });

  return {
    getInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  };
}
