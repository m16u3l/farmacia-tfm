import { pool } from "@/config/db";

export type AuditAction = "create" | "update" | "delete" | "login";

/**
 * Registra un cambio en audit_log. Nunca lanza: un fallo al auditar no debe
 * romper la operación principal (crear/editar/eliminar) que la originó.
 */
export async function logAudit(
  userId: number | null,
  action: AuditAction,
  entityType: string,
  entityId: number | string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId ?? null, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error("No se pudo registrar la auditoría:", err);
  }
}
