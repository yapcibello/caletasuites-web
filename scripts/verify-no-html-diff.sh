#!/usr/bin/env bash
# Verifica que un refactor NO altera el HTML de producción de WWW (réplica visual
# inmutable de Caleta Suites). Patrón replicado de logopedajessica-web.
# Compara apps/www/dist/**/*.html contra .ci-artifacts/html-baseline/ (capturado
# antes del cambio) tras neutralizar los hashes de assets que Astro regenera en
# cada build (ej: /_astro/Header.Bk8vXy2Z.js → /_astro/Header.__HASH__.js).
#
# Uso:
#   # 1) ANTES del cambio, capturar baseline (dist ya construido):
#   pnpm build:www
#   bash scripts/verify-no-html-diff.sh capture
#
#   # 2) DESPUÉS del cambio, rebuild + comparar:
#   pnpm build:www
#   bash scripts/verify-no-html-diff.sh        # alias: pnpm verify:html-diff
#
# Ámbito: SOLO archivos .html. Assets CSS/JS/imagen quedan fuera del invariante
# por diseño (la regeneración por hash es esperada).
#
# Exit codes:
#   0 — diff HTML = 0 tras normalizar hashes
#   1 — diff real detectado o baseline ausente

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/apps/www/dist"
BASELINE_DIR="$PROJECT_DIR/.ci-artifacts/html-baseline"

case "${1:-verify}" in
  capture)
    if [ ! -d "$DIST_DIR" ]; then
      echo "Error: $DIST_DIR no existe — ejecuta pnpm build:www antes de capturar" >&2
      exit 1
    fi
    mkdir -p "$PROJECT_DIR/.ci-artifacts"
    rm -rf "$BASELINE_DIR" 2>/dev/null || true
    cp -r "$DIST_DIR" "$BASELINE_DIR"
    COUNT=$(find "$BASELINE_DIR" -name '*.html' | wc -l)
    echo "✅ Baseline capturado: $COUNT HTML en $BASELINE_DIR"
    exit 0
    ;;
  verify) : ;;
  *) echo "Uso: $0 [capture|verify]" >&2; exit 1 ;;
esac

[ -d "$BASELINE_DIR" ] || { echo "Error: baseline no encontrado en $BASELINE_DIR — captura primero con: $0 capture" >&2; exit 1; }
[ -d "$DIST_DIR" ]     || { echo "Error: $DIST_DIR no existe — ejecuta pnpm build:www antes de verificar" >&2; exit 1; }

# Normaliza un HTML neutralizando datos volátiles que Astro regenera en cada build
# sin que haya cambio real de código:
#   1) Hashes de assets versionados (/_astro/Header.HASH.js, imágenes, fuentes).
#   2) Hashes data-astro-cid-* (scope CSS de Astro, recalculados en cascada).
# Se aplica token-por-token: cambios reales en otras partes de la línea NO se pierden.
normalize() {
  sed -E \
    -e 's#\.[A-Za-z0-9_-]{6,}\.(js|mjs|css|woff2?|svg|png|avif|webp|jpe?g|gif|ico)\b#.__HASH__.\1#g' \
    -e 's#data-astro-cid-[a-z0-9]+#data-astro-cid-XXX#g' \
    "$1"
}

BASE_LIST=$(mktemp); DIST_LIST=$(mktemp)
trap 'rm -f "$BASE_LIST" "$DIST_LIST"' EXIT
( cd "$BASELINE_DIR" && find . -name '*.html' | sort ) > "$BASE_LIST"
( cd "$DIST_DIR"     && find . -name '*.html' | sort ) > "$DIST_LIST"

# Archivos añadidos o eliminados tras el cambio — diff estructural real.
ADDED_REMOVED=$(diff "$BASE_LIST" "$DIST_LIST" | grep -E '^[<>]' || true)
if [ -n "$ADDED_REMOVED" ]; then
  echo "❌ Estructura de archivos HTML cambió:"
  echo "$ADDED_REMOVED"
  exit 1
fi

REAL_DIFFS=0
TMP_BASE=$(mktemp); TMP_DIST=$(mktemp)
trap 'rm -f "$BASE_LIST" "$DIST_LIST" "$TMP_BASE" "$TMP_DIST"' EXIT

while IFS= read -r rel; do
  [ -z "$rel" ] && continue
  normalize "$BASELINE_DIR/$rel" > "$TMP_BASE"
  normalize "$DIST_DIR/$rel"     > "$TMP_DIST"
  if ! diff -q "$TMP_BASE" "$TMP_DIST" > /dev/null; then
    echo "❌ Diff HTML real en: $rel"
    diff "$TMP_BASE" "$TMP_DIST" | head -20
    echo "  (máx 20 líneas; hashes ya normalizados a .__HASH__.)"
    REAL_DIFFS=1
  fi
done < "$BASE_LIST"

if [ "$REAL_DIFFS" -eq 0 ]; then
  COUNT=$(wc -l < "$BASE_LIST")
  echo "✅ Diff HTML = 0 · $COUNT páginas idénticas tras normalizar hashes"
  exit 0
else
  echo ""
  echo "❌ verify-no-html-diff: el cambio rompió el invariante de réplica visual."
  exit 1
fi
