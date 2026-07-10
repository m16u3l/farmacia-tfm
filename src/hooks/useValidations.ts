import { useState } from 'react';
import { validationService } from '@/services/validationService';
import { InventoryValidation, InventoryValidationItem, InventoryValidationWithItems, ValidationType } from '@/types';

export const useValidations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const verifyItem = async (
    validationId: number,
    itemId: number,
    data: { actual_quantity: number; notes?: string }
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

  return {
    loading,
    error,
    createSession,
    verifyItem,
    completeSession,
    cancelSession
  };
};
