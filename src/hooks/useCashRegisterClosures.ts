import { useState, useEffect } from "react";
import type {
  CashRegisterClosure,
  CashRegisterClosureFormData,
  PendingClosureSummary,
} from "@/types";

export function useCashRegisterClosures() {
  const [closures, setClosures] = useState<CashRegisterClosure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClosures = async () => {
    try {
      const response = await fetch("/api/cash-register-closures");
      if (!response.ok) throw new Error("Error al cargar los cierres de caja");
      const data = await response.json();
      setClosures(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClosures();
  }, []);

  const getPendingSummary = async (): Promise<PendingClosureSummary> => {
    const response = await fetch("/api/cash-register-closures/pending");
    if (!response.ok) throw new Error("Error al obtener el resumen de cierre pendiente");
    return response.json();
  };

  const createClosure = async (data: CashRegisterClosureFormData) => {
    try {
      const response = await fetch("/api/cash-register-closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Error al cerrar la caja");
      }
      await fetchClosures();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      throw err;
    }
  };

  const cancelClosure = async (id: number) => {
    try {
      const response = await fetch(`/api/cash-register-closures/${id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Error al anular el cierre de caja");
      }
      await fetchClosures();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      throw err;
    }
  };

  return {
    closures,
    isLoading,
    error,
    fetchClosures,
    getPendingSummary,
    createClosure,
    cancelClosure,
  };
}
