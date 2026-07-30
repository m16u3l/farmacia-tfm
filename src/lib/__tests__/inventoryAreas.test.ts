import { assertNoCycleBatch } from '../inventoryAreas';

// Almacén 1 ─ Estante 10 ─ Apartado 100; Estante 11 cuelga del almacén.
const TREE = new Map<number, number | null>([
  [1, null],
  [10, 1],
  [11, 1],
  [100, 10],
]);

describe('assertNoCycleBatch', () => {
  it('acepta un lote que solo mueve áreas a destinos válidos', () => {
    expect(assertNoCycleBatch(TREE, new Map([[100, 11]]))).toBeNull();
  });

  it('acepta un lote vacío', () => {
    expect(assertNoCycleBatch(TREE, new Map())).toBeNull();
  });

  it('rechaza que un área sea su propia padre', () => {
    expect(assertNoCycleBatch(TREE, new Map([[10, 10]]))).toBe(
      'Un área no puede ser su propia área padre'
    );
  });

  it('rechaza colgar un área de su propio descendiente', () => {
    expect(assertNoCycleBatch(TREE, new Map([[10, 100]]))).toBe(
      'No se puede asignar como padre a una de sus propias sub-áreas'
    );
  });

  it('detecta el ciclo formado por dos cambios del mismo lote', () => {
    // Ninguno de los dos cambios es un ciclo por separado: A pasa a colgar de B
    // y B de A. Solo se ve mirando el árbol resultante.
    const flat = new Map<number, number | null>([
      [1, null],
      [2, null],
    ]);
    expect(
      assertNoCycleBatch(
        flat,
        new Map([
          [1, 2],
          [2, 1],
        ])
      )
    ).toBe('No se puede asignar como padre a una de sus propias sub-áreas');
  });

  it('rechaza superar la profundidad máxima', () => {
    const deep = new Map<number, number | null>([
      [1, null],
      [2, 1],
      [3, 2],
      [4, 3],
    ]);
    expect(assertNoCycleBatch(deep, new Map([[5, 4]]), 4)).toBe(
      'No se pueden anidar más de 4 niveles de áreas'
    );
    expect(assertNoCycleBatch(deep, new Map(), 4)).toBeNull();
  });
});
