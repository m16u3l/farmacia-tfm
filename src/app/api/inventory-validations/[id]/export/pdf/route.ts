import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { pool } from "@/config/db";
import { fetchValidationForExport } from "@/lib/validationExport";
import { VALIDATION_TYPE_LABELS } from "@/utils/validationLabels";

const COLUMNS = [
  { label: "Producto", width: 150 },
  { label: "Lote", width: 70 },
  { label: "C.Sist.", width: 55 },
  { label: "C.Real", width: 55 },
  { label: "Dif.", width: 45 },
  { label: "Venc.Real", width: 60 },
  { label: "Estado", width: 80 },
  { label: "Motivo", width: 80 },
  { label: "Notas", width: 110 },
];

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

    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const typeLabel = VALIDATION_TYPE_LABELS[validation.type as keyof typeof VALIDATION_TYPE_LABELS] ?? validation.type;

    doc.fontSize(16).text(`Validación de Inventario #${validation.validation_id}`, { align: "left" });
    doc
      .fontSize(10)
      .text(`Tipo: ${typeLabel}   Área: ${validation.area_name ?? "—"}`)
      .text(
        `Estado: ${validation.status}   Iniciado por: ${validation.started_by_name ?? "—"}   Iniciado: ${validation.started_at}`
      )
      .text(
        `Completado: ${validation.completed_at ?? "—"}   Ajustes aplicados: ${
          validation.inventory_adjusted_at ? `Sí (${validation.inventory_adjusted_at})` : "No"
        }`
      );
    doc.moveDown();

    const left = doc.page.margins.left;
    let y = doc.y;

    const drawRow = (cells: string[], bold: boolean) => {
      let x = left;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      cells.forEach((value, i) => {
        doc.text(value, x, y, { width: COLUMNS[i].width });
        x += COLUMNS[i].width;
      });
      y += 15;
    };

    drawRow(COLUMNS.map((c) => c.label), true);

    for (const item of items) {
      const diff = item.actual_quantity !== null ? item.actual_quantity - item.expected_quantity : null;
      drawRow(
        [
          item.product_name ?? "N/A",
          item.batch_number ?? "N/A",
          String(item.expected_quantity),
          item.actual_quantity !== null ? String(item.actual_quantity) : "N/A",
          diff !== null ? String(diff) : "N/A",
          item.actual_expiry_date ?? "N/A",
          item.status,
          item.discrepancy_reason ?? "",
          item.notes ?? "",
        ],
        false
      );

      if (y > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    doc.end();
    const buffer = await done;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="validacion-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating validation PDF export:", error);
    return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
  } finally {
    client.release();
  }
}
