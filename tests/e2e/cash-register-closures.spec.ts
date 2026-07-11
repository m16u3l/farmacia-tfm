import { test, expect, Page, APIRequestContext } from '@playwright/test';

const ADMIN = { email: 'admin@biofarm.bo', password: 'biofarm2026' };
const CAJERO = { email: 'caja@biofarm.bo', password: 'biofarm2026' };
const FARMACEUTICO = { email: 'farmacia@biofarm.bo', password: 'biofarm2026' };

interface InventoryRow {
  inventory_id: number;
  quantity_available: number;
  sale_price: number | null;
}

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(creds.email);
  await page.getByLabel('Contraseña').fill(creds.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/dashboard');
}

async function findAvailableInventoryItem(request: APIRequestContext) {
  const res = await request.get('/api/inventory');
  const inventory: InventoryRow[] = await res.json();
  const item = inventory.find((i) => i.quantity_available > 0);
  if (!item) throw new Error('No hay inventario disponible para la prueba');
  return item;
}

async function createSell(request: APIRequestContext, item: InventoryRow) {
  const unitPrice = item.sale_price || 10;
  const res = await request.post('/api/sells', {
    data: {
      payment_method: 'efectivo',
      items: [{ inventory_id: item.inventory_id, quantity: 1, unit_price: unitPrice, subtotal: unitPrice }],
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

test.describe.configure({ mode: 'serial' });

test.describe('Cierre de caja', () => {
  test('el cajero cierra su caja y la venta queda bloqueada para editar/eliminar', async ({ page }) => {
    await login(page, CAJERO);
    const item = await findAvailableInventoryItem(page.request);
    await createSell(page.request, item);

    const pendingRes = await page.request.get('/api/cash-register-closures/pending');
    const pending = await pendingRes.json();
    expect(pending.sell_count).toBeGreaterThan(0);

    await page.goto('/sells');
    await page.getByRole('button', { name: 'Cerrar caja' }).click();

    await expect(page.getByText(`Ventas a incluir: ${pending.sell_count}`)).toBeVisible();
    await page.getByLabel('Efectivo contado').fill(String(pending.total_efectivo));
    await expect(page.getByText('El efectivo contado coincide con lo esperado.')).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar cierre' }).click();
    await expect(page.getByText('Caja cerrada exitosamente')).toBeVisible();

    // La caja ya no tiene ventas pendientes
    const pendingAfterRes = await page.request.get('/api/cash-register-closures/pending');
    const pendingAfter = await pendingAfterRes.json();
    expect(pendingAfter.sell_count).toBe(0);
  });

  test('un farmacéutico no ve las ventas registradas por el cajero', async ({ page }) => {
    await login(page, FARMACEUTICO);
    await page.goto('/sells');
    await expect(page.getByText('Cajero BioFarm')).not.toBeVisible();
  });

  test('el admin ve todas las ventas y puede anular un cierre de caja', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/sells');
    await expect(page.getByText('Cajero BioFarm').first()).toBeVisible();

    await page.goto('/cash-register-closures');
    const cajeroRow = page.getByRole('row').filter({ hasText: 'Cajero BioFarm' }).first();
    await expect(cajeroRow).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await cajeroRow.getByRole('button', { name: 'Anular' }).click();
    await expect(page.getByText('Cierre de caja anulado')).toBeVisible();
  });
});
