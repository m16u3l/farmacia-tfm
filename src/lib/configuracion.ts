import { Pool, PoolClient } from "pg";

export interface ConfiguracionThresholds {
  low_stock_threshold: number;
  expiry_alert_days: number;
}

// Usados solo si la fila de configuracion no existe todavía (debería estar
// sembrada por db/schema.sql) — mismos valores que ese default.
const FALLBACK_THRESHOLDS: ConfiguracionThresholds = {
  low_stock_threshold: 10,
  expiry_alert_days: 40,
};

export async function getConfiguracionThresholds(
  client: Pool | PoolClient
): Promise<ConfiguracionThresholds> {
  const result = await client.query(
    "SELECT low_stock_threshold, expiry_alert_days FROM configuracion ORDER BY id LIMIT 1"
  );
  return result.rows[0] ?? FALLBACK_THRESHOLDS;
}
