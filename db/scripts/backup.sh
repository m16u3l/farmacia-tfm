#!/usr/bin/env bash
# Uso:
#   db/scripts/backup.sh "$DB_CONNECTION"
#
# Genera un dump completo (pg_dump) de la base indicada en db/backups/
# (carpeta ignorada por git — puede contener datos reales de clientes).
#
# Usa un contenedor postgres:17-alpine como cliente en vez del psql/pg_dump
# local: Supabase corre Postgres 17 y pg_dump exige que su versión sea >= la
# del servidor. Si tu máquina no tiene pg_dump instalado (o tiene una versión
# más vieja), esto funciona igual — solo necesita Docker.
#
# Corre esto ANTES de db/scripts/migrate.sh cuando el destino tenga datos
# reales (Supabase producción).
set -euo pipefail

CONN="${1:?Uso: db/scripts/backup.sh <DB_CONNECTION>}"
# Docker Desktop (Mac/Windows) no resuelve "localhost"/"127.0.0.1" al host
# desde dentro de un contenedor — hay que usar host.docker.internal. Solo
# aplica cuando el destino es tu Postgres local (docker-compose); Supabase u
# otro host remoto no se ve afectado.
CONN="${CONN/localhost/host.docker.internal}"
CONN="${CONN/127.0.0.1/host.docker.internal}"

cd "$(dirname "$0")/../.."
mkdir -p db/backups

OUT="db/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
docker run --rm postgres:17-alpine pg_dump "$CONN" > "$OUT"

echo "Backup guardado en $OUT ($(wc -l < "$OUT") líneas, $(du -h "$OUT" | cut -f1))"
