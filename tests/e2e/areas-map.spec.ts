import { test, expect, Page, APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'admin@biofarm.bo';
const ADMIN_PASSWORD = 'biofarm2026';
const CAJERO_EMAIL = 'caja@biofarm.bo';
const CAJERO_PASSWORD = 'biofarm2026';

interface Area {
  area_id: number;
  name: string;
  parent_area_id: number | null;
  map_x: number;
  map_y: number;
  map_w: number;
  map_h: number;
}

async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/dashboard');
}

// Ojo: hay que usar page.request (no el fixture `request`), que es el único que
// comparte la cookie de sesión con la página; el fixture aislado devuelve 401.
async function fetchAreas(request: APIRequestContext): Promise<Area[]> {
  const response = await request.get('/api/inventory-areas');
  return response.json();
}

/** Restaura la geometría de un área tal como estaba antes del test. */
async function restore(request: APIRequestContext, area: Area) {
  await request.put('/api/inventory-areas/layout', {
    data: {
      items: [
        {
          area_id: area.area_id,
          x: area.map_x,
          y: area.map_y,
          w: area.map_w,
          h: area.map_h,
          parent_area_id: area.parent_area_id,
        },
      ],
    },
  });
}

async function dragBy(page: Page, areaId: number, dy: number) {
  const handle = page.locator(`[data-area-id="${areaId}"] .area-card-handle`);
  const box = await handle.boundingBox();
  if (!box) throw new Error('No se pudo ubicar el handle de arrastre');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + dy, { steps: 12 });
  await page.mouse.up();
}

test.describe('Mapa de áreas', () => {
  // Los tests mueven áreas reales y las restauran al final; en paralelo se
  // pisarían entre sí al leer la posición "antes" del test vecino.
  test.describe.configure({ mode: 'serial' });

  test('arrastra una tarjeta, la guarda y persiste tras recargar', async ({ page }) => {
    test.skip(test.info().project.name.startsWith('Mobile'), 'El mapa es de solo lectura en móvil');

    await login(page);
    const roots = (await fetchAreas(page.request)).filter((a) => a.parent_area_id === null);
    test.skip(roots.length < 2, 'Se necesitan al menos dos áreas raíz');
    const target = roots[roots.length - 1];

    await page.goto('/areas');
    await page.getByRole('checkbox', { name: 'Editar mapa' }).check();
    await expect(page.locator(`[data-area-id="${target.area_id}"]`)).toBeVisible();

    // Hacia abajo, a una fila vacía: el destino no es otra tarjeta, así que es
    // un cambio de posición y no dispara el diálogo de "Mover área".
    await dragBy(page, target.area_id, 340);

    await expect(page.getByText('Tienes cambios sin guardar en el mapa')).toBeVisible();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Mapa guardado correctamente')).toBeVisible();

    const saved = (await fetchAreas(page.request)).find((a) => a.area_id === target.area_id)!;
    expect(saved.map_y).toBeGreaterThan(target.map_y);

    await page.reload();
    await expect(page.locator(`[data-area-id="${target.area_id}"]`)).toBeVisible();

    await restore(page.request, target);
  });

  test('descartar devuelve el mapa a su estado guardado', async ({ page }) => {
    test.skip(test.info().project.name.startsWith('Mobile'), 'El mapa es de solo lectura en móvil');

    await login(page);
    const roots = (await fetchAreas(page.request)).filter((a) => a.parent_area_id === null);
    test.skip(roots.length === 0, 'Se necesita al menos un área raíz');
    const target = roots[roots.length - 1];

    await page.goto('/areas');
    await page.getByRole('checkbox', { name: 'Editar mapa' }).check();
    await expect(page.locator(`[data-area-id="${target.area_id}"]`)).toBeVisible();

    await dragBy(page, target.area_id, 340);
    await expect(page.getByText('Tienes cambios sin guardar en el mapa')).toBeVisible();

    await page.getByRole('button', { name: 'Descartar' }).click();
    await expect(page.getByText('Tienes cambios sin guardar en el mapa')).toBeHidden();

    const after = (await fetchAreas(page.request)).find((a) => a.area_id === target.area_id)!;
    expect(after.map_x).toBe(target.map_x);
    expect(after.map_y).toBe(target.map_y);
  });

  test('navega a las sub-áreas de un nivel y vuelve', async ({ page }) => {
    await login(page);
    const areas = await fetchAreas(page.request);
    const parent = areas.find(
      (a) => a.parent_area_id === null && areas.some((c) => c.parent_area_id === a.area_id)
    );
    test.skip(!parent, 'Se necesita un área raíz con sub-áreas');

    await page.goto('/areas');
    const card = page.locator(`[data-area-id="${parent!.area_id}"]`);
    await expect(card).toBeVisible();

    if (test.info().project.name.startsWith('Mobile')) {
      await card.click();
      await page.getByRole('button', { name: 'Abrir' }).click();
    } else {
      await card.getByRole('button', { name: `Abrir ${parent!.name}` }).click();
    }

    await expect(page).toHaveURL(new RegExp(`nivel=${parent!.area_id}`));
    await page.getByRole('button', { name: 'Subir un nivel' }).click();
    await expect(page.getByRole('button', { name: 'Subir un nivel' })).toBeHidden();
  });

  test('en móvil el mapa es de solo lectura y abre el panel de acciones', async ({ page }) => {
    test.skip(!test.info().project.name.startsWith('Mobile'), 'Solo aplica a los proyectos móviles');

    await login(page);
    const roots = (await fetchAreas(page.request)).filter((a) => a.parent_area_id === null);
    test.skip(roots.length === 0, 'Se necesita al menos un área raíz');

    await page.goto('/areas');
    await expect(page.getByText('El mapa es de solo lectura en el teléfono')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Editar mapa' })).toBeHidden();
    await expect(page.locator('.react-resizable-handle')).toHaveCount(0);

    await page.locator(`[data-area-id="${roots[0].area_id}"]`).click();
    await expect(page.getByRole('button', { name: 'Mover a otra área' })).toBeVisible();
  });

  test('el cajero no puede guardar el mapa', async ({ page }) => {
    await login(page, CAJERO_EMAIL, CAJERO_PASSWORD);

    const response = await page.request.put('/api/inventory-areas/layout', {
      data: { items: [{ area_id: 1, x: 0, y: 0, w: 3, h: 4, parent_area_id: null }] },
    });
    expect(response.status()).toBe(403);
  });
});
