import { NextResponse } from "next/server";
import cron from "node-cron";

let cronInitialized = false;

function getCronExpression() {
  return process.env.CRON_EXPRESSION || "0 9 * * 1";
}
export async function GET() {
  if (!cronInitialized) {
    const cronExpression = getCronExpression();
    console.log(`Configurando cron job con la expresión: ${cronExpression}`);

    cron.schedule(cronExpression, async () => {
      try {
        console.log("Ejecutando verificación de vencimiento...");
      } catch (error) {
        console.error("Error en cron job:", error);
      }
    });

    cronInitialized = true;
    return NextResponse.json({
      success: true,
      message: "Cron jobs iniciados",
    });
  }

  return NextResponse.json({
    success: true,
    message: "Cron jobs ya están ejecutándose",
  });
}
