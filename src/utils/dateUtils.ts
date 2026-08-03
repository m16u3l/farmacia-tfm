// Formato de fechas unificado de la app: dd/mm/yyyy.
// (toLocaleDateString depende del locale del navegador y en algunos
// dispositivos mostraba mm/dd/yyyy.)

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${min}`;
}

// Fecha en formato ISO corto (YYYY-MM-DD) usando el día local. No se usa
// toISOString() porque convierte a UTC y en husos negativos devuelve el día
// anterior.
export function toISODate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export type PeriodPreset = "week" | "month" | "lastWeek" | "lastMonth";

// Rango de fechas (inclusivo en ambos extremos) de un período predefinido.
// La semana va de lunes a domingo, igual que DATE_TRUNC('week') en Postgres.
export function getPeriodRange(
  preset: PeriodPreset,
  today: Date = new Date()
): { from: string; to: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  switch (preset) {
    case "week":
    case "lastWeek": {
      // getDay(): 0 = domingo. Se convierte a "días desde el lunes".
      const daysFromMonday = (today.getDay() + 6) % 7;
      const offset = preset === "week" ? 0 : 7;
      const monday = new Date(y, m, d - daysFromMonday - offset);
      const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6
      );
      return { from: toISODate(monday), to: toISODate(sunday) };
    }
    case "month":
    case "lastMonth": {
      const monthOffset = preset === "month" ? 0 : -1;
      const first = new Date(y, m + monthOffset, 1);
      // Día 0 del mes siguiente = último día del mes.
      const last = new Date(y, m + monthOffset + 1, 0);
      return { from: toISODate(first), to: toISODate(last) };
    }
  }
}

// true si la fecha cae en el día de hoy (hora local).
export function isToday(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}
