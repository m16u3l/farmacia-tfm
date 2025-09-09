import { apiRequest } from './api';
import { Inventory, InventoryFormData } from '@/types';

export const inventoryService = {
  async getAll(): Promise<Inventory[]> {
    return apiRequest<Inventory[]>('/api/inventory');
  },

  async getById(id: number): Promise<Inventory> {
    return apiRequest<Inventory>(`/api/inventory/${id}`);
  },

  async create(data: InventoryFormData): Promise<Inventory> {
    return apiRequest<Inventory>('/api/inventory', {
      method: 'POST',
      body: data
    });
  },

  async update(id: number, data: InventoryFormData): Promise<Inventory> {
    return apiRequest<Inventory>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id: number): Promise<void> {
    await apiRequest<void>(`/api/inventory/${id}`, {
      method: 'DELETE'
    });
  },

  async getByProduct(productId: number): Promise<Inventory[]> {
    return apiRequest<Inventory[]>(`/api/inventory?product_id=${productId}`);
  },

  async getLowStock(threshold: number = 10): Promise<Inventory[]> {
    return apiRequest<Inventory[]>(`/api/inventory?low_stock=${threshold}`);
  }
};
