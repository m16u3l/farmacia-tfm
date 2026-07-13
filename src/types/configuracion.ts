export interface Configuracion {
  id: number;
  low_stock_threshold: number;
  expiry_alert_days: number;
  validation_period_days: number;
  updated_at: string;
}

export type ConfiguracionFormData = Pick<
  Configuracion,
  "low_stock_threshold" | "expiry_alert_days" | "validation_period_days"
>;
