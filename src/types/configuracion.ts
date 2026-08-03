export interface Configuracion {
  id: number;
  low_stock_threshold: number;
  expiry_alert_days: number;
  validation_due_day: number;
  updated_at: string;
}

export type ConfiguracionFormData = Pick<
  Configuracion,
  "low_stock_threshold" | "expiry_alert_days" | "validation_due_day"
>;

// Mismos valores que los DEFAULT de la tabla configuracion en db/schema.sql.
// Se usan mientras la configuración carga en el cliente y si la fila no existe.
export const DEFAULT_THRESHOLDS: ConfiguracionFormData = {
  low_stock_threshold: 10,
  expiry_alert_days: 40,
  validation_due_day: 10,
};
