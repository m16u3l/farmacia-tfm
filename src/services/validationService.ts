import { apiRequest } from './api';
import { AddValidationItemInput, InventoryValidation, InventoryValidationItem, InventoryValidationWithItems, RemoveValidationItemInput, ValidationAdjustmentResult, ValidationCoverage, ValidationType, DiscrepancyReason } from '@/types';

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

  async addItem(validationId: number, data: AddValidationItemInput): Promise<InventoryValidationItem> {
    return apiRequest<InventoryValidationItem>(`/api/inventory-validations/${validationId}/items`, {
      method: 'POST',
      body: data
    });
  },

  async verifyItem(validationId: number, itemId: number, data: { actual_quantity: number; actual_expiry_date?: string | null; notes?: string; discrepancy_reason?: DiscrepancyReason | null }): Promise<InventoryValidationItem> {
    return apiRequest<InventoryValidationItem>(`/api/inventory-validations/${validationId}/items/${itemId}`, {
      method: 'PUT',
      body: data
    });
  },

  async removeItem(validationId: number, itemId: number, data: RemoveValidationItemInput): Promise<InventoryValidationItem> {
    return apiRequest<InventoryValidationItem>(`/api/inventory-validations/${validationId}/items/${itemId}/remove`, {
      method: 'POST',
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
  },

  async applyAdjustments(id: number): Promise<ValidationAdjustmentResult> {
    return apiRequest<ValidationAdjustmentResult>(`/api/inventory-validations/${id}/apply-adjustments`, {
      method: 'POST'
    });
  },

  async getCoverage(): Promise<ValidationCoverage> {
    return apiRequest<ValidationCoverage>('/api/inventory-validations/coverage');
  }
};
