import { InventoryArea } from '@/types';
import { getAreaSubtreeIds } from '../areaTree';

function area(area_id: number, name: string, parent_area_id: number | null): InventoryArea {
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
  };
}

// Sucursal 1 ─ Estante 10 ─ Apartados 100, 101 / Estante 11 ─ Apartado 110
const AREAS: InventoryArea[] = [
  area(1, 'Sucursal Centro', null),
  area(10, 'Estante A', 1),
  area(11, 'Estante B', 1),
  area(100, '1', 10),
  area(101, '2', 10),
  area(110, '1', 11),
  area(2, 'Por clasificar', null),
];

describe('getAreaSubtreeIds', () => {
  it('incluye el área y todos sus descendientes', () => {
    expect([...getAreaSubtreeIds(AREAS, 1)].sort((a, b) => a - b)).toEqual([1, 10, 11, 100, 101, 110]);
  });

  it('un estante incluye sus apartados pero no los de otro estante', () => {
    expect([...getAreaSubtreeIds(AREAS, 10)].sort((a, b) => a - b)).toEqual([10, 100, 101]);
  });

  it('una hoja devuelve solo su propio id', () => {
    expect([...getAreaSubtreeIds(AREAS, 100)]).toEqual([100]);
  });

  it('un id inexistente devuelve solo ese id', () => {
    expect([...getAreaSubtreeIds(AREAS, 999)]).toEqual([999]);
  });

  it('no entra en bucle si los datos tienen un ciclo', () => {
    const cyclic = [area(1, 'A', 2), area(2, 'B', 1)];
    expect([...getAreaSubtreeIds(cyclic, 1)].sort((a, b) => a - b)).toEqual([1, 2]);
  });
});
