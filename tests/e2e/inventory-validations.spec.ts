import { test, expect, Page, APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'admin@biofarm.bo';
const ADMIN_PASSWORD = 'biofarm2026';

interface Area {
  area_id: number;
  name: string;
  parent_area_id: number | null;
}

interface InventoryRow {
  inventory_id: number;
  area_id: number | null;
  quantity_available: number;
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/dashboard');
}

// Replica el breadcrumb "Padre › Hijo" que arma src/utils/areaTree.ts, para
// poder ubicar la opción correcta en el <select> de Área por su texto visible.
function areaLabel(areas: Area[], areaId: number): string {
  const byId = new Map(areas.map((a) => [a.area_id, a]));
  const parts: string[] = [];
  let current: Area | undefined = byId.get(areaId);
  while (current) {
    parts.unshift(current.name);
    current = current.parent_area_id != null ? byId.get(current.parent_area_id) : undefined;
  }
  return parts.join(' › ');
}

// Un área con exactamente un lote evita el confirm() nativo de "¿finalizar sin
// verificar todo?" (que Playwright descartaría por defecto), manteniendo el
// flujo determinístico.
async function findSingleItemArea(request: APIRequestContext) {
  const inventoryRes = await request.get('/api/inventory');
  const inventory: InventoryRow[] = await inventoryRes.json();

  const counts = new Map<number, InventoryRow[]>();
  for (const item of inventory) {
    if (item.area_id == null) continue;
    const list = counts.get(item.area_id) ?? [];
    list.push(item);
    counts.set(item.area_id, list);
  }

  for (const [areaId, items] of counts) {
    if (items.length === 1) {
      const areasRes = await request.get('/api/inventory-areas');
      const areas: Area[] = await areasRes.json();
      return { areaId, item: items[0], label: areaLabel(areas, areaId) };
    }
  }
  throw new Error('No se encontró ningún área con exactamente un lote de inventario para la prueba');
}

async function cancelAllInProgress(request: APIRequestContext) {
  const res = await request.get('/api/inventory-validations?status=in_progress');
  const sessions: { validation_id: number }[] = await res.json();
  for (const session of sessions) {
    await request.post(`/api/inventory-validations/${session.validation_id}/cancel`);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('Validación de inventario', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Arrancar cada prueba sin sesiones 'in_progress' huérfanas (de esta u otra
    // corrida previa) para que el flujo de reanudación sea determinístico.
    await cancelAllInProgress(page.request);
  });

  test('crear, verificar con discrepancia, completar y aplicar ajustes actualiza el inventario', async ({ page }) => {
    const { item, label } = await findSingleItemArea(page.request);
    const mismatchQty = item.quantity_available + 3;

    await page.goto('/inventory-validations');
    await page.getByRole('combobox', { name: 'Área', exact: true }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar Validación' }).click();

    await expect(page.getByText('Validación activa:')).toBeVisible();

    await page.getByRole('button', { name: 'Verificar' }).click();
    await page.getByLabel('Cantidad Real Contada').fill(String(mismatchQty));
    await page.getByRole('button', { name: 'Marcar como Verificado' }).click();

    await page.getByRole('button', { name: 'Finalizar' }).click();

    await expect(page.getByText('revisión de inconsistencias')).toBeVisible();
    await expect(page.getByText('1 ítem(s) con diferencias')).toBeVisible();

    await page.getByRole('button', { name: 'Aplicar ajustes al inventario' }).click();
    await expect(page.getByText(/Ajustes aplicados/)).toBeVisible();

    const updatedRes = await page.request.get(`/api/inventory/${item.inventory_id}`);
    const updated = await updatedRes.json();
    expect(updated.quantity_available).toBe(mismatchQty);
  });

  test('bloquea una segunda validación concurrente del mismo tipo/área', async ({ page }) => {
    const { label, areaId } = await findSingleItemArea(page.request);

    await page.goto('/inventory-validations');
    await page.getByRole('combobox', { name: 'Área', exact: true }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar Validación' }).click();
    await expect(page.getByText('Validación activa:')).toBeVisible();

    const duplicate = await page.request.post('/api/inventory-validations', {
      data: { type: 'area', area_id: areaId },
    });
    expect(duplicate.status()).toBe(409);
  });

  test('reanuda una validación en progreso al recargar la página', async ({ page }) => {
    const { label } = await findSingleItemArea(page.request);

    await page.goto('/inventory-validations');
    await page.getByRole('combobox', { name: 'Área', exact: true }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar Validación' }).click();
    await expect(page.getByText('Validación activa:')).toBeVisible();

    await page.reload();

    await expect(page.getByText('Validación activa:')).toBeVisible();
    await expect(page.getByText('Se reanudó la validación en progreso')).toBeVisible();
  });
});
