import { useState, useEffect } from "react";
import type { Sell, SellFormData } from "@/types";

export function useSells() {
  const [sells, setSells] = useState<Sell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSells = async () => {
    try {
      const response = await fetch("/api/sells");
      if (!response.ok) throw new Error("Error al cargar las ventas");
      const data = await response.json();
      setSells(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSells();
  }, []);

  const createSell = async (data: SellFormData) => {
    try {
      const response = await fetch("/api/sells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear la venta");
      await fetchSells();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      throw err;
    }
  };

  const updateSell = async (id: number, data: SellFormData) => {
    try {
      const response = await fetch(`/api/sells/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al actualizar la venta");
      await fetchSells();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      throw err;
    }
  };

  const deleteSell = async (id: number) => {
    try {
      const response = await fetch(`/api/sells/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar la venta");
      await fetchSells();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      throw err;
    }
  };

  return {
    sells,
    isLoading,
    error,
    createSell,
    updateSell,
    deleteSell,
  };
}
