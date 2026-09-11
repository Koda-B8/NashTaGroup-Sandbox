#!/bin/sh
set -e

log() {
  echo "[entrypoint] $1"
}

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
MAX_RETRIES="${DB_WAIT_RETRIES:-60}"

check_db() {
  node --input-type=module -e '
    import pg from "pg";
    const client = new pg.Client({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "nashtagroup_pos",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 3000,
    });
    client.connect()
      .then(() => client.end())
      .catch(() => process.exit(1));
  ' 2>/dev/null
}

log "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
attempt=1
until check_db; do
  if [ "$attempt" -ge "$MAX_RETRIES" ]; then
    log "PostgreSQL not reachable after ${MAX_RETRIES} attempts, giving up."
    exit 1
  fi
  log "PostgreSQL not ready (attempt ${attempt}/${MAX_RETRIES}), retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done
log "PostgreSQL is ready."

log "Running database migrations..."
npm run db:migrate

if [ "${RUN_SEEDS:-true}" = "true" ]; then
  log "Running database seeders..."
  npm run db:seed || log "Seeding failed or already applied, continuing..."
fi

log "Starting application..."
exec node src/server.js
