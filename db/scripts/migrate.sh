#!/usr/bin/env bash
# Uso:
#   db/scripts/migrate.sh "$DB_CONNECTION"        # corre TODAS las migraciones pendientes, en orden
#   db/scripts/migrate.sh "$DB_CONNECTION" 004    # corre solo la migración "004_*.sql"
#
# Corre archivos de db/migrations/*.sql contra la conexión indicada, usando un
# contenedor postgres:17-alpine como cliente (Supabase corre Postgres 17; el
# docker-compose local usa 16 y su psql no siempre es compatible). Solo
# necesita Docker, no psql instalado en la máquina.
#
# Idempotencia: cada migración está escrita con IF NOT EXISTS / IF EXISTS, así
# que volver a correr una ya aplicada no debería fallar ni duplicar datos —
# pero igual verifica el estado real antes de correr contra una base con
# datos (ver sección 4 del README).
#
# ⚠️  Dos migraciones son el paso "contract" de un patrón expand/contract:
#   004_sells_simplify.sql             — elimina customer_name/employee_id de sells
#   006_inventory_location_drop.sql    — elimina inventory.location
# Solo corrélas después de confirmar que el código YA DESPLEGADO en
# producción no depende de esas columnas/valores viejos. El resto son
# aditivas y seguras de correr en cualquier momento.
#
# Recomendado antes de correr esto contra una base con datos reales:
#   db/scripts/backup.sh "$DB_CONNECTION"
set -euo pipefail

CONN="${1:?Uso: db/scripts/migrate.sh <DB_CONNECTION> [numero_migracion]}"
ONLY="${2:-}"
# Docker Desktop (Mac/Windows) no resuelve "localhost"/"127.0.0.1" al host
# desde dentro de un contenedor — hay que usar host.docker.internal. Solo
# aplica cuando el destino es tu Postgres local (docker-compose); Supabase u
# otro host remoto no se ve afectado.
CONN="${CONN/localhost/host.docker.internal}"
CONN="${CONN/127.0.0.1/host.docker.internal}"

cd "$(dirname "$0")/../.."

if [ -n "$ONLY" ]; then
  FILES=(db/migrations/"${ONLY}"_*.sql)
else
  FILES=(db/migrations/*.sql)
fi

for f in "${FILES[@]}"; do
  echo "==> $f"
  docker run --rm -i postgres:17-alpine psql "$CONN" < "$f"
done

echo "Listo."
