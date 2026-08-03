import { Pool, PoolClient } from "pg";
import { DEFAULT_THRESHOLDS } from "@/types/configuracion";

export interface ConfiguracionThresholds {
  low_stock_threshold: number;
  expiry_alert_days: number;
  validation_due_day: number;
}

export async function getConfiguracionThresholds(
  client: Pool | PoolClient
): Promise<ConfiguracionThresholds> {
  const result = await client.query(
    "SELECT low_stock_threshold, expiry_alert_days, validation_due_day FROM configuracion ORDER BY id LIMIT 1"
  );
  // Si la fila de configuracion no existe todavía (debería estar sembrada por
  // db/schema.sql), se usan los mismos defaults que el esquema.
  return result.rows[0] ?? DEFAULT_THRESHOLDS;
}
