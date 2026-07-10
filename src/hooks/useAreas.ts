import { useState } from 'react';
import { areaService } from '@/services/areaService';
import { InventoryArea, InventoryAreaFormData } from '@/types';

export const useAreas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createArea = async (data: InventoryAreaFormData): Promise<InventoryArea | null> => {
    setLoading(true);
    setError(null);
    try {
      const newArea = await areaService.create(data);
      return newArea;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateArea = async (id: number, data: InventoryAreaFormData): Promise<InventoryArea | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedArea = await areaService.update(id, data);
      return updatedArea;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await areaService.delete(id);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createArea,
    updateArea,
    deleteArea
  };
};
