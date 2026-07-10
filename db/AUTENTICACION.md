# Autenticación, roles e importación de datos reales

## 1. Qué cambió

- **Login obligatorio**: nadie puede entrar al panel (`/products`, `/inventory`,
  `/sells`, etc.) sin iniciar sesión. La landing pública (`/`) sigue siendo
  libre.
- **Roles**: `admin`, `farmaceutico`, `cajero`. Cada uno ve solo las secciones
  que le corresponden (ver tabla abajo). El control se aplica tanto en el menú
  como en el servidor (middleware), así que no se puede saltar entrando a la
  URL directamente.
- **Bitácora de auditoría** (`audit_log`): registra quién creó/editó/eliminó
  productos, inventario, ventas, órdenes y usuarios, y cada inicio de sesión.
- **Datos reales del Excel**: `db/seed_data_inventario.sql` reemplaza los
  datos de ejemplo con los ~403 productos y ~415 lotes reales de
  `Inventario_Farmacia_actual.xlsx`.

## 2. Permisos por rol

| Sección         | admin | farmacéutico | cajero |
|------------------|:-----:|:-------------:|:------:|
| Inicio (dashboard)|  ✅   |      ✅        |   ✅   |
| Productos         |  ✅   |      ✅        |   ❌   |
| Inventario        |  ✅   |      ✅        |   ✅ (uso operativo) |
| Ventas            |  ✅   |      ✅        |   ✅   |
| Órdenes de compra |  ✅   |      ✅        |   ❌   |
| Proveedores       |  ✅   |      ✅        |   ❌   |
| Reportes          |  ✅   |      ✅        |   ❌   |
| Empleados         |  ✅   |      ❌        |   ❌   |
| Usuarios          |  ✅   |      ❌        |   ❌   |
| Configuración     |  ✅   |      ❌        |   ❌   |

Se ajusta en `src/lib/permissions.ts`.

## 3. Cuentas iniciales

Creadas automáticamente por `db/schema.sql`. **Cambia estas contraseñas
apenas entres por primera vez** (Usuarios → editar → nueva contraseña):

| Correo                | Contraseña   | Rol           |
|------------------------|--------------|---------------|
| admin@biofarm.bo        | biofarm2026  | admin         |
| farmacia@biofarm.bo     | biofarm2026  | farmaceutico  |
| caja@biofarm.bo         | biofarm2026  | cajero        |

## 4. Cómo aplicar esto a tu base de datos

### Si vas a crear la base desde cero (local o nueva en Supabase)

```bash
psql "$DB_CONNECTION" -f db/schema.sql
psql "$DB_CONNECTION" -f db/seed_data_inventario.sql
```

### Si ya tienes datos en producción (tu Supabase actual)

**No** vuelvas a correr `schema.sql` completo (recrearía tablas). Corre solo
la migración incremental, que agrega columnas nuevas sin borrar nada:

```bash
psql "$DB_CONNECTION" -f db/migrations/002_auth_and_products_update.sql
```

Después, si quieres reemplazar tu inventario actual por el del Excel real:

```sql
-- CUIDADO: esto borra inventario y productos existentes antes de recargar
TRUNCATE inventory, products RESTART IDENTITY CASCADE;
```
```bash
psql "$DB_CONNECTION" -f db/seed_data_inventario.sql
```

### Variable de entorno nueva

Agrega a tu `.env` / variables de entorno en Vercel:

```
SESSION_SECRET=<genera una con: openssl rand -base64 32>
```

Sin esta variable, el login no funcionará (la app lanzará un error claro
pidiéndola).

## 5. Sobre los datos importados del Excel

`db/etl/build_seed.py` es el script que generó `seed_data_inventario.sql` a
partir de `Inventario_Farmacia_actual.xlsx`. Si tu Excel cambia, puedes
volver a ejecutarlo (necesita `pandas`, `openpyxl`).

Durante la limpieza automática:
- Se recuperaron 3 filas donde dos productos habían quedado pegados en la
  misma fila por error de captura, y 1 fila cuyo producto se había corrido
  completo a columnas equivocadas.
- Se excluyeron 6 filas sin nombre de producto identificable.
- Los productos con el mismo nombre se agruparon en **un solo producto** con
  **varios lotes de inventario** (distintos vencimientos/precios/cantidades),
  que es como ya modela tu esquema.
- La "presentación" del Excel (texto libre con +60 variantes) se normalizó a
  forma farmacéutica + unidad. Cuando no se pudo inferir, quedó en blanco
  para completar manualmente.
- **101 fechas de vencimiento** tenían formato incompleto o inválido: 74
  estaban vacías (se dejaron vacías), 22 se aproximaron al 1 de enero del año
  indicado (marcadas con el badge "Fecha aprox." en Inventario), y 13 eran
  ilegibles (se dejaron vacías).
- Texto que aparecía en la columna de ubicación pero en realidad era una
  instrucción de dosis (ej. "cada 12 horas adultos") se movió al nuevo campo
  de instrucciones de dosificación del producto.

Revisa `db/etl_review_report.csv` para ver el detalle fila por fila de todo
lo anterior.

**Categoría y código de barras quedaron vacíos** para todos los productos
importados porque el Excel no los maneja. Puedes completarlos desde
Productos a medida que los necesites — no son obligatorios para operar.
