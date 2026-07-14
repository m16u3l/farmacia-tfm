import { useState } from 'react';
import { validationService } from '@/services/validationService';
import { AddValidationItemInput, InventoryValidation, InventoryValidationItem, InventoryValidationWithItems, RemoveValidationItemInput, ValidationAdjustmentResult, ValidationCoverage, ValidationType, DiscrepancyReason } from '@/types';

export const useValidations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAll = async (status?: string): Promise<InventoryValidation[]> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.getAll(status);
    } catch (err) {
      setError((err as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSession = async (id: number): Promise<InventoryValidationWithItems | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.getSession(id);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (data: { type: ValidationType; area_id?: number; notes?: string }): Promise<InventoryValidationWithItems | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.createSession(data);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (
    validationId: number,
    data: AddValidationItemInput
  ): Promise<InventoryValidationItem | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.addItem(validationId, data);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyItem = async (
    validationId: number,
    itemId: number,
    data: { actual_quantity: number; actual_expiry_date?: string | null; notes?: string; discrepancy_reason?: DiscrepancyReason | null }
  ): Promise<InventoryValidationItem | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.verifyItem(validationId, itemId, data);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (
    validationId: number,
    itemId: number,
    data: RemoveValidationItemInput
  ): Promise<InventoryValidationItem | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.removeItem(validationId, itemId, data);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async (id: number): Promise<InventoryValidation | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.complete(id);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelSession = async (id: number): Promise<InventoryValidation | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.cancel(id);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustments = async (id: number): Promise<ValidationAdjustmentResult | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.applyAdjustments(id);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCoverage = async (): Promise<ValidationCoverage | null> => {
    setLoading(true);
    setError(null);
    try {
      return await validationService.getCoverage();
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAll,
    getSession,
    createSession,
    addItem,
    verifyItem,
    removeItem,
    completeSession,
    cancelSession,
    applyAdjustments,
    getCoverage
  };
};
