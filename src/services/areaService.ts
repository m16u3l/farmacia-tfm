import { apiRequest } from './api';
import { InventoryArea, InventoryAreaFormData } from '@/types';

export const areaService = {
  async getAll(): Promise<InventoryArea[]> {
    return apiRequest<InventoryArea[]>('/api/inventory-areas');
  },

  async getById(id: number): Promise<InventoryArea> {
    return apiRequest<InventoryArea>(`/api/inventory-areas/${id}`);
  },

  async create(data: InventoryAreaFormData): Promise<InventoryArea> {
    return apiRequest<InventoryArea>('/api/inventory-areas', {
      method: 'POST',
      body: data
    });
  },

  async update(id: number, data: InventoryAreaFormData): Promise<InventoryArea> {
    return apiRequest<InventoryArea>(`/api/inventory-areas/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id: number): Promise<void> {
    await apiRequest<void>(`/api/inventory-areas/${id}`, {
      method: 'DELETE'
    });
  }
};
