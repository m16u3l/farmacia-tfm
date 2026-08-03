import { useEffect, useState } from 'react';
import { ConfiguracionFormData, DEFAULT_THRESHOLDS } from '@/types/configuracion';

/**
 * Umbrales globales de configuración para las vistas que calculan alertas en
 * el cliente (bajo stock, próximo a vencer). Mientras cargan —o si la petición
 * falla— se usan los mismos defaults que el esquema, para no dejar la tabla sin
 * ninguna alerta ni mostrar valores inventados.
 */
export const useConfiguracion = () => {
  const [thresholds, setThresholds] = useState<ConfiguracionFormData>(DEFAULT_THRESHOLDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchConfiguracion = async () => {
      try {
        const response = await fetch('/api/configuracion');
        const data = await response.json();
        if (response.ok && !cancelled) {
          setThresholds({
            low_stock_threshold: data.low_stock_threshold,
            expiry_alert_days: data.expiry_alert_days,
            validation_due_day: data.validation_due_day,
          });
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchConfiguracion();
    return () => {
      cancelled = true;
    };
  }, []);

  return { thresholds, loading };
};
