#!/usr/bin/env bash
# Deja el repo listo para trabajar apenas arranca una sesión: instala las
# dependencias solo si el lockfile cambió respecto a lo que hay en node_modules.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -d node_modules ]; then
  echo "→ node_modules ausente, instalando…"
  npm ci --no-audit --no-fund
  exit 0
fi

STAMP=node_modules/.install-stamp
LOCK_HASH="$(sha256sum package-lock.json 2>/dev/null | cut -d' ' -f1 || echo none)"

if [ "$(cat "$STAMP" 2>/dev/null || echo)" != "$LOCK_HASH" ]; then
  echo "→ lockfile cambió, sincronizando dependencias…"
  npm ci --no-audit --no-fund
  printf '%s' "$LOCK_HASH" > "$STAMP"
fi
