import { smartSearch, normalizeText, editDistance } from "../smartSearch";

type Item = { name: string; ingredient?: string | null; lab?: string | null };

const items: Item[] = [
  { name: "Paracetamol 500mg", ingredient: "paracetamol", lab: "Bagó" },
  { name: "Paracetamol Forte 650mg", ingredient: "paracetamol", lab: "Inti" },
  { name: "Ibuprofeno 400mg", ingredient: "ibuprofeno", lab: "Bagó" },
  { name: "Amoxicilina 500mg cápsulas", ingredient: "amoxicilina", lab: "Vita" },
  { name: "Jarabe para la tos", ingredient: "dextrometorfano", lab: "Inti" },
];

const fields = (item: Item) => [item.name, item.ingredient, item.lab];

describe("normalizeText", () => {
  it("ignora mayúsculas, acentos y espacios repetidos", () => {
    expect(normalizeText("  Cápsula   ÓVULO ")).toBe("capsula ovulo");
  });
});

describe("editDistance", () => {
  it("calcula la distancia de edición", () => {
    expect(editDistance("amoxicilna", "amoxicilina", 2)).toBe(1);
    expect(editDistance("abc", "abc", 1)).toBe(0);
  });

  it("corta temprano cuando supera maxDist", () => {
    expect(editDistance("aaaa", "zzzz", 1)).toBeGreaterThan(1);
  });
});

describe("smartSearch", () => {
  it("devuelve todo con consulta vacía", () => {
    expect(smartSearch(items, "   ", fields)).toEqual(items);
  });

  it("ignora acentos y mayúsculas", () => {
    const result = smartSearch(items, "BAGÓ", fields);
    expect(result.map((i) => i.name)).toEqual([
      "Paracetamol 500mg",
      "Ibuprofeno 400mg",
    ]);
  });

  it("acepta palabras en cualquier orden y repartidas entre campos", () => {
    const result = smartSearch(items, "bago ibuprofeno", fields);
    expect(result.map((i) => i.name)).toEqual(["Ibuprofeno 400mg"]);
  });

  it("exige que todas las palabras coincidan", () => {
    expect(smartSearch(items, "paracetamol xyz", fields)).toEqual([]);
  });

  it("tolera errores de tipeo", () => {
    const result = smartSearch(items, "amoxicilna", fields);
    expect(result.map((i) => i.name)).toEqual(["Amoxicilina 500mg cápsulas"]);
  });

  it("no aproxima palabras numéricas", () => {
    expect(smartSearch(items, "paracetamol 400", fields)).toEqual([]);
  });

  it("ordena por relevancia: palabra exacta antes que aproximada", () => {
    const data: Item[] = [
      { name: "Losartina 50mg" },
      { name: "Losartán 100mg" },
    ];
    const result = smartSearch(data, "losartan", (i) => [i.name]);
    expect(result.map((i) => i.name)).toEqual(["Losartán 100mg", "Losartina 50mg"]);
  });

  it("prefijos parciales encuentran el producto", () => {
    const result = smartSearch(items, "paracet 500", fields);
    expect(result.map((i) => i.name)).toEqual(["Paracetamol 500mg"]);
  });
});
