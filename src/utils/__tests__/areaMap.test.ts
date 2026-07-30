import { InventoryArea } from '@/types';
import {
  areasToLayout,
  childrenOf,
  depthOf,
  hasCollision,
  isDescendant,
  layoutToItems,
  levelBounds,
  nextFreeSlotClient,
  pathTo,
  sameLayout,
  subtreeLots,
} from '../areaMap';

function area(
  area_id: number,
  name: string,
  parent_area_id: number | null,
  geometry: Partial<Pick<InventoryArea, 'map_x' | 'map_y' | 'map_w' | 'map_h'>> = {}
): InventoryArea {
  return {
    area_id,
    name,
    type: 'estante',
    parent_area_id,
    is_active: true,
    map_x: 0,
    map_y: 0,
    map_w: 3,
    map_h: 4,
    ...geometry,
  };
}

// Almacén 1 ─ Estante 10, Estante 11 ─ Apartado 100 (hijo de 10)
const AREAS: InventoryArea[] = [
  area(1, 'Almacén Central', null, { map_x: 0, map_y: 0, map_w: 6, map_h: 5 }),
  area(10, 'Estante A', 1, { map_x: 0, map_y: 0, map_w: 3, map_h: 4 }),
  area(11, 'Estante B', 1, { map_x: 3, map_y: 0, map_w: 3, map_h: 4 }),
  area(100, 'Apartado 1', 10, { map_x: 0, map_y: 0, map_w: 2, map_h: 2 }),
];

describe('childrenOf', () => {
  it('devuelve solo los hijos directos del nivel', () => {
    expect(childrenOf(AREAS, 1).map((a) => a.area_id)).toEqual([10, 11]);
    expect(childrenOf(AREAS, null).map((a) => a.area_id)).toEqual([1]);
    expect(childrenOf(AREAS, 100)).toEqual([]);
  });

  it('ordena por fila y luego por columna', () => {
    const unordered = [
      area(20, 'Abajo', 1, { map_x: 0, map_y: 4 }),
      area(21, 'Derecha', 1, { map_x: 6, map_y: 0 }),
      area(22, 'Izquierda', 1, { map_x: 0, map_y: 0 }),
    ];
    expect(childrenOf(unordered, 1).map((a) => a.area_id)).toEqual([22, 21, 20]);
  });
});

describe('areasToLayout / layoutToItems', () => {
  it('convierte solo los hijos del nivel, con i = area_id', () => {
    expect(areasToLayout(AREAS, 1)).toEqual([
      { i: '10', x: 0, y: 0, w: 3, h: 4 },
      { i: '11', x: 3, y: 0, w: 3, h: 4 },
    ]);
  });

  it('vuelve al cuerpo del endpoint conservando el padre del nivel', () => {
    expect(layoutToItems(areasToLayout(AREAS, 1), 1)).toEqual([
      { area_id: 10, x: 0, y: 0, w: 3, h: 4, parent_area_id: 1 },
      { area_id: 11, x: 3, y: 0, w: 3, h: 4, parent_area_id: 1 },
    ]);
  });
});

describe('hasCollision', () => {
  const others = [{ i: 'a', x: 0, y: 0, w: 3, h: 4 }];

  it('no considera colisión dos tarjetas que solo comparten un borde', () => {
    expect(hasCollision(others, { i: 'b', x: 3, y: 0, w: 3, h: 4 })).toBe(false);
    expect(hasCollision(others, { i: 'b', x: 0, y: 4, w: 3, h: 4 })).toBe(false);
  });

  it('detecta el solapamiento parcial', () => {
    expect(hasCollision(others, { i: 'b', x: 2, y: 3, w: 3, h: 4 })).toBe(true);
  });

  it('ignora el propio item', () => {
    expect(hasCollision(others, { i: 'a', x: 0, y: 0, w: 3, h: 4 })).toBe(false);
  });
});

describe('sameLayout', () => {
  const base = [{ i: 'a', x: 0, y: 0, w: 3, h: 4 }];

  it('es true aunque cambie el orden del array', () => {
    const two = [...base, { i: 'b', x: 3, y: 0, w: 3, h: 4 }];
    expect(sameLayout(two, [two[1], two[0]])).toBe(true);
  });

  it('es false si cambia una coordenada o el número de items', () => {
    expect(sameLayout(base, [{ i: 'a', x: 1, y: 0, w: 3, h: 4 }])).toBe(false);
    expect(sameLayout(base, [])).toBe(false);
  });
});

describe('nextFreeSlotClient', () => {
  it('coloca la primera área en el origen, con el tamaño de su tipo', () => {
    expect(nextFreeSlotClient([], 'apartado')).toEqual({ x: 0, y: 0, w: 2, h: 2 });
  });

  it('coloca las siguientes en una fila propia bajo las existentes', () => {
    const siblings = [
      { i: 'a', x: 0, y: 0, w: 3, h: 4 },
      { i: 'b', x: 3, y: 2, w: 3, h: 5 },
    ];
    expect(nextFreeSlotClient(siblings, 'estante')).toEqual({ x: 0, y: 7, w: 3, h: 4 });
  });
});

describe('levelBounds', () => {
  it('devuelve al menos una fila para un nivel vacío', () => {
    expect(levelBounds([])).toEqual({ cols: 12, rows: 1 });
  });

  it('usa la fila más baja ocupada', () => {
    expect(levelBounds([{ i: 'a', x: 0, y: 2, w: 3, h: 4 }])).toEqual({ cols: 12, rows: 6 });
  });
});

describe('isDescendant', () => {
  it('reconoce a los descendientes en cualquier profundidad', () => {
    expect(isDescendant(AREAS, 100, 1)).toBe(true);
    expect(isDescendant(AREAS, 100, 10)).toBe(true);
  });

  it('es false para el área misma, hermanos y ancestros', () => {
    expect(isDescendant(AREAS, 10, 10)).toBe(false);
    expect(isDescendant(AREAS, 10, 11)).toBe(false);
    expect(isDescendant(AREAS, 1, 10)).toBe(false);
  });
});

describe('subtreeLots', () => {
  // Estante A (10) tiene 2 lotes propios y su apartado 100 tiene 3.
  const lots = new Map<number, number>([
    [1, 0],
    [10, 2],
    [11, 0],
    [100, 3],
  ]);

  it('suma los lotes propios y los de todo el subárbol', () => {
    expect(subtreeLots(AREAS, lots, 1)).toBe(5);
    expect(subtreeLots(AREAS, lots, 10)).toBe(5);
  });

  it('devuelve solo los propios cuando el área es una hoja', () => {
    expect(subtreeLots(AREAS, lots, 100)).toBe(3);
    expect(subtreeLots(AREAS, lots, 11)).toBe(0);
  });

  it('trata como cero las áreas ausentes del mapa de cobertura', () => {
    expect(subtreeLots(AREAS, new Map(), 1)).toBe(0);
  });
});

describe('pathTo / depthOf', () => {
  it('devuelve la ruta desde la raíz, incluida el área', () => {
    expect(pathTo(AREAS, 100).map((a) => a.area_id)).toEqual([1, 10, 100]);
  });

  it('devuelve una ruta vacía en el nivel raíz', () => {
    expect(pathTo(AREAS, null)).toEqual([]);
  });

  it('calcula la profundidad que tendría un área nueva', () => {
    expect(depthOf(AREAS, null)).toBe(1);
    expect(depthOf(AREAS, 100)).toBe(4);
  });
});
