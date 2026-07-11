import { PoolClient } from "pg";

export interface ValidationExportHeader {
  validation_id: number;
  type: string;
  status: string;
  area_name: string | null;
  started_by_name: string | null;
  started_at: string;
  completed_at: string | null;
  inventory_adjusted_at: string | null;
  adjusted_by_name: string | null;
}

export interface ValidationExportItem {
  validation_item_id: number;
  product_name: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  actual_expiry_date: string | null;
  expected_quantity: number;
  actual_quantity: number | null;
  status: string;
  notes: string | null;
  verified_by_name: string | null;
  verified_at: string | null;
}

export async function fetchValidationForExport(
  client: PoolClient,
  validationId: number
): Promise<{ validation: ValidationExportHeader; items: ValidationExportItem[] } | null> {
  const validationResult = await client.query<ValidationExportHeader>(
    `SELECT
      v.validation_id, v.type, v.status,
      a.name as area_name,
      (u1.first_name || ' ' || u1.last_name) as started_by_name,
      v.started_at, v.completed_at,
      v.inventory_adjusted_at,
      (u2.first_name || ' ' || u2.last_name) as adjusted_by_name
    FROM inventory_validations v
    LEFT JOIN inventory_areas a ON v.area_id = a.area_id
    LEFT JOIN users u1 ON v.started_by = u1.id
    LEFT JOIN users u2 ON v.inventory_adjusted_by = u2.id
    WHERE v.validation_id = $1`,
    [validationId]
  );

  if (validationResult.rows.length === 0) return null;

  const itemsResult = await client.query<ValidationExportItem>(
    `SELECT
      vi.validation_item_id, p.name as product_name, i.batch_number, i.expiry_date,
      vi.actual_expiry_date,
      vi.expected_quantity, vi.actual_quantity, vi.status, vi.notes,
      (u.first_name || ' ' || u.last_name) as verified_by_name,
      vi.verified_at
    FROM inventory_validation_items vi
    LEFT JOIN inventory i ON vi.inventory_id = i.inventory_id
    LEFT JOIN products p ON i.product_id = p.product_id
    LEFT JOIN users u ON vi.verified_by = u.id
    WHERE vi.validation_id = $1
    ORDER BY vi.validation_item_id`,
    [validationId]
  );

  return { validation: validationResult.rows[0], items: itemsResult.rows };
}
