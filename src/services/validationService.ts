import { apiRequest } from './api';
import { InventoryValidation, InventoryValidationItem, InventoryValidationWithItems, ValidationType } from '@/types';

export const validationService = {
  async createSession(data: { type: ValidationType; area_id?: number; notes?: string }): Promise<InventoryValidationWithItems> {
    return apiRequest<InventoryValidationWithItems>('/api/inventory-validations', {
      method: 'POST',
      body: data
    });
  },

  async getSession(id: number): Promise<InventoryValidationWithItems> {
    return apiRequest<InventoryValidationWithItems>(`/api/inventory-validations/${id}`);
  },

  async getAll(status?: string): Promise<InventoryValidation[]> {
    return apiRequest<InventoryValidation[]>(`/api/inventory-validations${status ? `?status=${status}` : ''}`);
  },

  async verifyItem(validationId: number, itemId: number, data: { actual_quantity: number; notes?: string }): Promise<InventoryValidationItem> {
    return apiRequest<InventoryValidationItem>(`/api/inventory-validations/${validationId}/items/${itemId}`, {
      method: 'PUT',
      body: data
    });
  },

  async complete(id: number): Promise<InventoryValidation> {
    return apiRequest<InventoryValidation>(`/api/inventory-validations/${id}/complete`, {
      method: 'POST'
    });
  },

  async cancel(id: number): Promise<InventoryValidation> {
    return apiRequest<InventoryValidation>(`/api/inventory-validations/${id}/cancel`, {
      method: 'POST'
    });
  }
};
