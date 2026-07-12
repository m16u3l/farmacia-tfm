import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { pool } from "@/config/db";
import { fetchValidationForExport } from "@/lib/validationExport";
import { VALIDATION_TYPE_LABELS } from "@/utils/validationLabels";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const client = await pool.connect();
  try {
    const data = await fetchValidationForExport(client, Number(params.id));
    if (!data) {
      return NextResponse.json(
        { error: "Validación de inventario no encontrada" },
        { status: 404 }
      );
    }
    const { validation, items } = data;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Validación");

    sheet.addRow(["Tipo", VALIDATION_TYPE_LABELS[validation.type as keyof typeof VALIDATION_TYPE_LABELS] ?? validation.type]);
    sheet.addRow(["Área", validation.area_name ?? "—"]);
    sheet.addRow(["Estado", validation.status]);
    sheet.addRow(["Iniciado por", validation.started_by_name ?? "—"]);
    sheet.addRow(["Iniciado el", validation.started_at]);
    sheet.addRow(["Completado el", validation.completed_at ?? "—"]);
    sheet.addRow([
      "Ajustes aplicados",
      validation.inventory_adjusted_at
        ? `Sí — ${validation.adjusted_by_name ?? ""} (${validation.inventory_adjusted_at})`
        : "No",
    ]);
    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "Producto",
      "Lote",
      "Vencimiento Sistema",
      "Vencimiento Real",
      "Cant. Sistema",
      "Cant. Real",
      "Diferencia",
      "Estado",
      "Motivo",
      "Notas",
      "Verificado por",
      "Verificado el",
    ]);
    headerRow.font = { bold: true };

    for (const item of items) {
      sheet.addRow([
        item.product_name ?? "N/A",
        item.batch_number ?? "N/A",
        item.expiry_date ?? "N/A",
        item.actual_expiry_date ?? "N/A",
        item.expected_quantity,
        item.actual_quantity ?? "N/A",
        item.actual_quantity !== null ? item.actual_quantity - item.expected_quantity : "N/A",
        item.status,
        item.discrepancy_reason ?? "",
        item.notes ?? "",
        item.verified_by_name ?? "N/A",
        item.verified_at ?? "N/A",
      ]);
    }

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="validacion-${params.id}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating validation Excel export:", error);
    return NextResponse.json({ error: "Error al generar el Excel" }, { status: 500 });
  } finally {
    client.release();
  }
}
