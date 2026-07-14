// Búsqueda "inteligente" en cliente, compartida por inventario y productos:
// - ignora mayúsculas/minúsculas y acentos
// - las palabras de la consulta pueden ir en cualquier orden y repartidas
//   entre varios campos (ej. "ibuprofeno bago" → nombre + laboratorio)
// - tolera errores de tipeo (distancia de edición acotada por longitud)
// - ordena los resultados por relevancia (palabra exacta > prefijo >
//   subcadena > coincidencia aproximada), dando más peso al primer campo

// Normaliza para comparar sin distinguir may/min ni acentos
export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Distancia de edición (Levenshtein), con corte temprano cuando ya se superó maxDist
export const editDistance = (a: string, b: string, maxDist: number): number => {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > maxDist) return maxDist + 1;
    prev = curr;
  }
  return prev[b.length];
};

// Cuántos errores de tipeo se toleran según la longitud de la palabra buscada.
// Las palabras numéricas ("500") nunca se aproximan: "500" no debe hallar "50".
const typoTolerance = (token: string): number => {
  if (/^\d+$/.test(token)) return 0;
  if (token.length >= 8) return 2;
  if (token.length >= 4) return 1;
  return 0;
};

const SCORE_EXACT_WORD = 4;
const SCORE_PREFIX = 3;
const SCORE_SUBSTRING = 2;
const SCORE_FUZZY = 1;

// Mejor puntaje de un token contra un campo ya normalizado; 0 = no coincide
const tokenScoreInField = (token: string, field: string, fieldWords: string[]): number => {
  if (field.includes(token)) {
    if (fieldWords.includes(token)) return SCORE_EXACT_WORD;
    if (fieldWords.some((w) => w.startsWith(token))) return SCORE_PREFIX;
    return SCORE_SUBSTRING;
  }
  const maxDist = typoTolerance(token);
  if (maxDist > 0 && fieldWords.some((w) => editDistance(token, w, maxDist) <= maxDist)) {
    return SCORE_FUZZY;
  }
  return 0;
};

/**
 * Filtra y ordena `items` por relevancia frente a `query`.
 * `getFields` devuelve los textos buscables de cada ítem, en orden de
 * importancia: el primer campo (normalmente el nombre) pesa el doble.
 * Todas las palabras de la consulta deben coincidir en algún campo.
 * Con consulta vacía devuelve `items` sin tocar.
 */
export function smartSearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => Array<string | null | undefined>
): T[] {
  const tokens = normalizeText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return items;

  const scored: Array<{ item: T; score: number }> = [];
  for (const item of items) {
    const fields = getFields(item)
      .map((f) => normalizeText(f || ""))
      .map((f) => ({ text: f, words: f.split(" ").filter(Boolean) }));

    let total = 0;
    let allMatched = true;
    for (const token of tokens) {
      let best = 0;
      fields.forEach((field, index) => {
        if (!field.text) return;
        const weight = index === 0 ? 2 : 1;
        best = Math.max(best, tokenScoreInField(token, field.text, field.words) * weight);
      });
      if (best === 0) {
        allMatched = false;
        break;
      }
      total += best;
    }
    if (allMatched) scored.push({ item, score: total });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}
