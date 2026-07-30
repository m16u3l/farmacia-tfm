import { useCallback, useState } from 'react';
import { areaService } from '@/services/areaService';
import { AreaLayoutItem, AreaLayoutSaveResult, InventoryArea, InventoryAreaFormData } from '@/types';

export const useAreas = () => {
  const [areas, setAreas] = useState<InventoryArea[]>([]);
  // Arranca en true: hasta que fetchAreas responda, `areas` está vacío por no
  // haber cargado todavía, no por no haber áreas. Con false, la vista mostraba
  // "No hay áreas creadas todavía" durante el primer render.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Separado de `error`: solo un fallo al cargar deja la vista sin datos y
  // justifica reemplazarla por un aviso. El fallo de una mutación se comunica
  // sin desmontar lo que ya está en pantalla.
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAreas = useCallback(async (): Promise<InventoryArea[] | null> => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await areaService.getAll();
      setAreas(data);
      return data;
    } catch (err) {
      setLoadError((err as Error).message);
      setAreas([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createArea = async (
    data: InventoryAreaFormData
  ): Promise<{ area: InventoryArea | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      return { area: await areaService.create(data), error: null };
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return { area: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateArea = async (
    id: number,
    data: InventoryAreaFormData
  ): Promise<{ area: InventoryArea | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      return { area: await areaService.update(id, data), error: null };
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return { area: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Devuelve el mensaje del servidor junto al resultado: leerlo del estado
   * `error` justo después del await da el valor viejo del render anterior, y
   * aquí el motivo del rechazo ("tiene N lotes con M unidades") es justamente
   * lo que el usuario necesita ver.
   */
  const deleteArea = async (id: number): Promise<{ ok: boolean; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      await areaService.delete(id);
      return { ok: true, error: null };
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (
    items: AreaLayoutItem[]
  ): Promise<{ result: AreaLayoutSaveResult | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await areaService.saveLayout(items);
      setAreas(result.areas);
      return { result, error: null };
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return { result: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    areas,
    setAreas,
    loading,
    error,
    loadError,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
    saveLayout
  };
};
