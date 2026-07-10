"""
ETL: Inventario_Farmacia_actual.xlsx -> seed_data_inventario.sql

Lee el Excel real de inventario de BioFarm, normaliza los datos (nombres,
presentación -> forma farmacéutica/unidad, fechas de vencimiento, ubicación),
agrupa lotes duplicados del mismo producto, y genera:

  1. seed_data_inventario.sql   -> INSERTs limpios de products + inventory
  2. etl_review_report.csv      -> filas que requieren revisión manual

Uso:
  pip install pandas openpyxl
  python build_seed.py ruta/a/tu/Inventario.xlsx
  # (sin argumento, busca "Inventario_Farmacia_actual.xlsx" en el directorio actual)
"""
import re
import sys
import unicodedata
import pandas as pd
from datetime import date

SRC = sys.argv[1] if len(sys.argv) > 1 else "Inventario_Farmacia_actual.xlsx"

# -----------------------------------------------------------------------
# 1. Cargar y reparar filas con datos "corridos" a columnas extra
# -----------------------------------------------------------------------
df = pd.read_excel(SRC, sheet_name=0)
df = df.rename(columns={
    "nombre comercial y/o generico": "name",
    "product_stock": "stock",
    "presentation": "presentation",
    "expiration_date": "expiry_raw",
    "product_original_price": "purchase_price",
    "Precio Final": "sale_price",
    "funcion y/o descripcion": "description",
    "location": "location",
})

EXTRA_COLS = [f"Unnamed: {i}" for i in range(10, 21)]

records = []  # cada elemento: dict con name/stock/presentation/expiry_raw/purchase_price/sale_price/description/location/source_row

def add_record(row_idx, name, stock, presentation, expiry_raw, purchase_price, sale_price, description, location):
    records.append(dict(
        source_row=row_idx + 2,  # +2 = compensar encabezado y 0-index -> nro. de fila real en Excel
        name=name, stock=stock, presentation=presentation, expiry_raw=expiry_raw,
        purchase_price=purchase_price, sale_price=sale_price,
        description=description, location=location,
    ))

# Filas conocidas con 2 productos pegados (offset +10 columnas) - detectadas en el análisis manual
SPLIT_ROWS = {28, 29, 362}       # ver etl análisis: cada una trae un 2do producto en Unnamed:10+
SHIFTED_ONLY_ROWS = {232}         # fila cuyo ÚNICO producto quedó totalmente corrido a la derecha
LOCATION_OVERFLOW_ROWS = {95: "Unnamed: 10"}  # fila cuya ubicación real quedó en una columna extra

for i, row in df.iterrows():
    if i in SHIFTED_ONLY_ROWS:
        add_record(i, row["Unnamed: 11"], row["Unnamed: 12"], row["Unnamed: 13"],
                   row["Unnamed: 15"], row["Unnamed: 16"], row["Unnamed: 18"],
                   row["Unnamed: 19"], row["Unnamed: 20"])
        continue

    add_record(i, row["name"], row["stock"], row["presentation"], row["expiry_raw"],
               row["purchase_price"], row["sale_price"], row["description"], row["location"])

    if i in LOCATION_OVERFLOW_ROWS:
        records[-1]["location"] = row[LOCATION_OVERFLOW_ROWS[i]]

    if i in SPLIT_ROWS:
        # Segundo producto embebido en las columnas Unnamed 10-15 (mismo layout: nombre, stock, ?, presentation, expiry, price)
        name2 = row["Unnamed: 10"]
        stock2 = row["Unnamed: 11"]
        presentation2 = row["Unnamed: 13"]
        expiry2 = row["Unnamed: 14"]
        price2 = row["Unnamed: 15"]
        if pd.notna(name2) and isinstance(name2, str):
            add_record(i, name2, stock2, presentation2, expiry2, price2, None, None, None)

raw = pd.DataFrame(records)
print(f"Registros extraídos (incluye productos recuperados de filas corridas): {len(raw)}")

# -----------------------------------------------------------------------
# 2. Filtrar filas sin nombre válido -> reporte de revisión
# -----------------------------------------------------------------------
review_rows = []

no_name_mask = raw["name"].isna() | (raw["name"].astype(str).str.strip() == "")
review_rows += [
    {"fila_excel": r.source_row, "motivo": "sin nombre de producto, se excluyó del import", "datos": str(r._asdict())}
    for r in raw[no_name_mask].itertuples()
]
raw = raw[~no_name_mask].copy()
raw["name"] = raw["name"].astype(str).str.strip()

# Nombres "basura" (solo dígitos, p.ej. "0") -> usar la descripción como nombre real si existe
garbage_name_mask = raw["name"].str.match(r"^\d+\.?\d*$")
drop_idx = []
for idx in raw[garbage_name_mask].index:
    desc = raw.at[idx, "description"]
    if pd.notna(desc) and str(desc).strip():
        review_rows.append({
            "fila_excel": raw.at[idx, "source_row"],
            "motivo": "nombre inválido (solo dígitos); se usó la descripción como nombre",
            "datos": f"nombre_original={raw.at[idx,'name']!r} -> {str(desc).strip()!r}",
        })
        raw.at[idx, "name"] = str(desc).strip()
        raw.at[idx, "description"] = None
    else:
        review_rows.append({
            "fila_excel": raw.at[idx, "source_row"],
            "motivo": "nombre inválido (solo dígitos) y sin descripción; se excluyó del import",
            "datos": str(raw.loc[idx].to_dict()),
        })
        drop_idx.append(idx)
raw = raw.drop(index=drop_idx)

# -----------------------------------------------------------------------
# 3. Normalizar presentación -> (dosage_form, unit)
# -----------------------------------------------------------------------
def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

DOSAGE_FORM_MAP = [
    (["comprimido", "tablet", "pastilla"], "tableta"),
    (["capsula"], "cápsula"),
    (["jarabe"], "jarabe"),
    (["ampolla", "vial"], "ampolla"),
    (["crema", "pomada", "ungüento", "unguento"], "crema"),
    (["suspension", "suspención"], "suspensión"),
    (["polvo"], "polvo"),
    (["gota"], "gotas"),
    (["spray"], "spray"),
    (["sobre"], "sobre"),
    (["ovulo"], "óvulo"),
    (["supositorio"], "supositorio"),
    (["solucion", "solución", "enjuague"], "solución"),
    (["gel"], "gel"),
    (["locion", "loción"], "loción"),
]
UNIT_MAP = [
    (["caja"], "caja"),
    (["frasco", "bote", "botella"], "frasco"),
    (["rollo"], "rollo"),
    (["blister", "blíster"], "blíster"),
    (["ampolla"], "ampolla"),
    (["tubo"], "tubo"),
    (["sobre"], "sobre"),
]

def normalize_presentation(raw_val):
    if pd.isna(raw_val):
        return (None, None, None)
    text = strip_accents(str(raw_val).strip().lower())
    if text in ("", ".", "nan"):
        return (None, None, None)
    dosage_form = next((v for keys, v in DOSAGE_FORM_MAP if any(k in text for k in keys)), None)
    unit = next((v for keys, v in UNIT_MAP if any(k in text for k in keys)), None)
    if unit is None:
        unit = "unidad"
    return (dosage_form, unit, str(raw_val).strip())

# -----------------------------------------------------------------------
# 4. Normalizar fecha de vencimiento
# -----------------------------------------------------------------------
import datetime as _dt

def normalize_expiry(raw_val):
    """-> (fecha_iso|None, es_aproximada:bool, texto_original|None)"""
    if pd.isna(raw_val):
        return (None, False, None)

    if isinstance(raw_val, _dt.time):
        return (None, True, str(raw_val))

    if isinstance(raw_val, (pd.Timestamp, _dt.datetime, _dt.date)):
        d = raw_val.date() if isinstance(raw_val, (pd.Timestamp, _dt.datetime)) else raw_val
        if d.year < 1950 or d.year > 2100:
            return (None, True, str(raw_val))
        return (d.isoformat(), False, None)

    if isinstance(raw_val, (int, float)):
        year = int(raw_val)
        if 2020 <= year <= 2100:
            return (date(year, 1, 1).isoformat(), True, str(raw_val))
        return (None, True, str(raw_val))

    text = str(raw_val).strip()
    # d/m/Y o d//Y
    m = re.match(r"^(\d{1,2})/(\d{0,2})/(\d{4})$", text)
    if m:
        d_, mo_, y_ = m.groups()
        try:
            if mo_ == "":
                return (date(int(y_), 1, 1).isoformat(), True, text)
            return (date(int(y_), int(mo_), int(d_)).isoformat(), False, None)
        except ValueError:
            return (None, True, text)
    # año suelto tipo "2027" dentro de texto
    m2 = re.search(r"(20\d{2})", text)
    if m2:
        year = int(m2.group(1))
        if 2020 <= year <= 2100:
            return (date(year, 1, 1).isoformat(), True, text)
    return (None, True, text)

# -----------------------------------------------------------------------
# 5. Normalizar ubicación (separar código de estante vs instrucción de posología mal ubicada)
# -----------------------------------------------------------------------
LOCATION_PATTERN = re.compile(r"^\d{1,2}\s*-\s*[A-Za-z]")

def normalize_location(raw_val):
    """-> (location|None, dosage_instruction|None)"""
    if pd.isna(raw_val):
        return (None, None)
    text = str(raw_val).strip()
    if text == "":
        return (None, None)
    if LOCATION_PATTERN.match(text):
        return (text, None)
    # No parece un código de estante -> probablemente es una instrucción de dosis
    return (None, text)

# -----------------------------------------------------------------------
# 6. Aplicar normalizaciones fila por fila
# -----------------------------------------------------------------------
clean_rows = []
for r in raw.itertuples():
    dosage_form, unit, presentation_raw = normalize_presentation(r.presentation)
    expiry_iso, expiry_approx, expiry_raw_text = normalize_expiry(r.expiry_raw)
    location, dosage_instruction = normalize_location(r.location)

    purchase_price = None if pd.isna(r.purchase_price) else round(float(r.purchase_price), 4)
    sale_price = None if pd.isna(r.sale_price) else round(float(r.sale_price), 4)
    if sale_price is None and purchase_price is not None:
        sale_price = round(purchase_price * 1.3, 4)
    if purchase_price is None:
        purchase_price = 0.0
    if sale_price is None:
        sale_price = 0.0

    stock = 0 if pd.isna(r.stock) else int(r.stock)

    description = None if pd.isna(r.description) else str(r.description).strip()
    if dosage_instruction:
        review_rows.append({
            "fila_excel": r.source_row,
            "motivo": "texto en 'location' no parece ubicación; se movió a instrucción de dosis",
            "datos": f"producto={r.name!r} texto={dosage_instruction!r}",
        })
    if expiry_approx and expiry_iso:
        review_rows.append({
            "fila_excel": r.source_row,
            "motivo": "fecha de vencimiento incompleta/errónea; se aproximó a 1-enero",
            "datos": f"producto={r.name!r} original={expiry_raw_text!r} -> {expiry_iso}",
        })
    elif expiry_approx and not expiry_iso:
        review_rows.append({
            "fila_excel": r.source_row,
            "motivo": "fecha de vencimiento inválida/ilegible; se dejó vacía",
            "datos": f"producto={r.name!r} original={expiry_raw_text!r}",
        })

    clean_rows.append(dict(
        name=r.name.strip(),
        name_key=re.sub(r"\s+", " ", r.name.strip()).lower(),
        stock=stock,
        dosage_form=dosage_form,
        unit=unit,
        presentation_raw=presentation_raw,
        expiry_iso=expiry_iso,
        expiry_approx=expiry_approx,
        purchase_price=purchase_price,
        sale_price=sale_price,
        description=description,
        dosage_instruction=dosage_instruction,
        location=location,
        source_row=r.source_row,
    ))

clean = pd.DataFrame(clean_rows)
print(f"Filas limpias listas para importar: {len(clean)}")

# -----------------------------------------------------------------------
# 7. Agrupar por producto (mismo nombre normalizado) -> 1 producto, N lotes (inventory)
# -----------------------------------------------------------------------
products = (
    clean.sort_values("source_row")
    .groupby("name_key", as_index=False)
    .agg(
        name=("name", "first"),
        dosage_form=("dosage_form", lambda s: next((x for x in s if pd.notna(x)), None)),
        unit=("unit", lambda s: next((x for x in s if pd.notna(x)), "unidad")),
        description=("description", lambda s: next((x for x in s if pd.notna(x) and str(x).strip()), None)),
        dosage_instruction=("dosage_instruction", lambda s: next((x for x in s if pd.notna(x)), None)),
    )
)
products["product_id"] = range(1, len(products) + 1)
print(f"Productos únicos: {len(products)}")

clean = clean.merge(products[["name_key", "product_id"]], on="name_key", how="left")
clean["lot_number"] = clean.groupby("product_id").cumcount() + 1

print(f"Lotes de inventario (filas de stock): {len(clean)}")
print(f"Filas para revisión manual: {len(review_rows)}")

# -----------------------------------------------------------------------
# 8. Generar SQL
# -----------------------------------------------------------------------
def sql_str(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

def sql_num(v):
    return "NULL" if v is None else str(v)

lines = []
lines.append("-- =============================================================================")
lines.append("-- Datos reales de inventario BioFarm — generado automáticamente desde")
lines.append("-- Inventario_Farmacia_actual.xlsx (ver etl_review_report.csv para casos dudosos)")
lines.append("-- =============================================================================")
lines.append("BEGIN;\n")

lines.append("-- Productos únicos (%d)" % len(products))
lines.append("INSERT INTO products (product_id, name, description, category, type, dosage_form, unit, dosage_instructions, barcode, status) VALUES")
prod_vals = []
for p in products.itertuples():
    prod_vals.append(
        f"  ({p.product_id}, {sql_str(p.name)}, {sql_str(p.description)}, NULL, 'medicamento', "
        f"{sql_str(p.dosage_form)}, {sql_str(p.unit or 'unidad')}, {sql_str(p.dosage_instruction)}, NULL, TRUE)"
    )
lines.append(",\n".join(prod_vals) + "\n" + "ON CONFLICT (product_id) DO NOTHING;\n")
lines.append(f"SELECT setval('products_product_id_seq', {len(products)}, true);\n")

lines.append("-- Lotes de inventario (%d)" % len(clean))
lines.append("INSERT INTO inventory (product_id, batch_number, expiry_date, expiry_is_approximate, quantity_available, location, purchase_price, sale_price) VALUES")
inv_vals = []
for r in clean.itertuples():
    batch = f"EXCEL-{r.source_row}"
    inv_vals.append(
        f"  ({r.product_id}, {sql_str(batch)}, {sql_str(r.expiry_iso)}, {str(bool(r.expiry_approx)).upper()}, "
        f"{r.stock}, {sql_str(r.location)}, {r.purchase_price}, {r.sale_price})"
    )
lines.append(",\n".join(inv_vals) + ";\n")

lines.append("COMMIT;")

with open("seed_data_inventario.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

review_df = pd.DataFrame(review_rows)
review_df.to_csv("etl_review_report.csv", index=False)

print("\nListo -> seed_data_inventario.sql y etl_review_report.csv generados")
print(f"Total a revisar manualmente: {len(review_df)}")
