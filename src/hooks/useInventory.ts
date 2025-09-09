import { useState } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { Inventory, InventoryFormData } from '@/types';

export const useInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInventoryItem = async (data: InventoryFormData): Promise<Inventory | null> => {
    setLoading(true);
    setError(null);
    try {
      const newItem = await inventoryService.create(data);
      return newItem;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (id: number, data: InventoryFormData): Promise<Inventory | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedItem = await inventoryService.update(id, data);
      return updatedItem;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryItem = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await inventoryService.delete(id);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInventoryById = async (id: number): Promise<Inventory | null> => {
    setLoading(true);
    setError(null);
    try {
      const item = await inventoryService.getById(id);
      return item;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLowStock = async (threshold: number = 10): Promise<Inventory[]> => {
    setLoading(true);
    setError(null);
    try {
      const items = await inventoryService.getLowStock(threshold);
      return items;
    } catch (err) {
      setError((err as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryById,
    getLowStock
  };
};
