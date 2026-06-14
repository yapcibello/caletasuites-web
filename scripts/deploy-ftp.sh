#!/bin/bash
# Deploy a producción via FTP — extractTo() + manifest cleanup (sin huérfanos)
# Uso: ./scripts/deploy-ftp.sh [--build]
#   --build  ejecuta pnpm build:www antes de desplegar
#
# Basado en el patrón smedialab-web (2026-05-25). Adaptaciones:
#   - DIST_DIR: apps/www/dist/ (monorepo Astro pnpm workspaces)
#   - Build command: pnpm build:www
#   - PHP trigger en _deploy/ (subdir temporal; sin api/ en el static site)
#   - PRESERVE_LIST vacío (site puramente estático, sin api/config.local.php)
#
# Endurecimiento H-87:
#   - Nombre aleatorio del PHP trigger: deploy-<16 hex>.php (no predecible)
#   - Token aleatorio de 32 hex verificado con hash_equals() (timing-safe)
#   - Auto-delete del PHP al iniciar + fallback FTP rm si la ejecución falla
#
# Ver proyecto/despliegue.md para el flujo completo.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
DIST_DIR="$PROJECT_DIR/apps/www/dist"
PHP_TEMPLATE="$SCRIPT_DIR/deploy-swap.php.template"

# URL base del site en producción
BASE_URL="${DEPLOY_BASE_URL:-https://caletasuitestenerife.com}"

# Smoke URLs (3 checks: home + grep marca, apartments, sitemap).
# /sitemap-index.xml con grep "sitemapindex" verifica que la FASE B del extract
# (sitemaps al final) se completó correctamente.
if [ -z "${DEPLOY_SMOKE_JSON:-}" ]; then
  SMOKE_JSON='[{"url":"/","grep":"Caleta"},{"url":"/apartments/"},{"url":"/sitemap-index.xml","grep":"sitemapindex"}]'
else
  SMOKE_JSON="$DEPLOY_SMOKE_JSON"
fi

# Archivos a preservar del cleanup de huérfanos.
# Este site es puramente estático — no hay api/config.local.php ni otros archivos
# de servidor que necesiten protección. Lista vacía.
if [ -z "${DEPLOY_PRESERVE_JSON:-}" ]; then
  PRESERVE_JSON='[]'
else
  PRESERVE_JSON="$DEPLOY_PRESERVE_JSON"
fi

# Cargar variables sin source (evita problemas con caracteres especiales)
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: no existe .env — copia .env.example y rellena las credenciales"
  exit 1
fi

FTP_HOST=$(grep '^FTP_HOST=' "$ENV_FILE" | cut -d= -f2)
FTP_USER=$(grep '^FTP_USER=' "$ENV_FILE" | cut -d= -f2)
FTP_PASS=$(grep '^FTP_PASS=' "$ENV_FILE" | cut -d= -f2-)
FTP_REMOTE_DIR=$(grep '^FTP_REMOTE_DIR=' "$ENV_FILE" | cut -d= -f2)

for var in FTP_HOST FTP_USER FTP_PASS FTP_REMOTE_DIR; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var no está definido en .env"
    exit 1
  fi
done

if [ ! -f "$PHP_TEMPLATE" ]; then
  echo "Error: plantilla PHP no encontrada: $PHP_TEMPLATE"
  exit 1
fi

# Build opcional
if [ "${1:-}" = "--build" ]; then
  echo "=== Ejecutando pnpm build:www ==="
  cd "$PROJECT_DIR" && pnpm build:www
  echo ""
fi

# Verificar que apps/www/dist/ existe
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: no existe apps/www/dist/ — ejecuta 'pnpm build:www' primero"
  exit 1
fi

TOTAL_FILES=$(find "$DIST_DIR" -type f | wc -l)
echo "=== Deploy con manifest cleanup: $TOTAL_FILES archivos ==="
echo "Destino: ftp://$FTP_HOST$FTP_REMOTE_DIR"
echo "Base URL smoke: $BASE_URL"
echo ""

# Identificadores únicos del deploy
TS="$(date +%Y%m%d_%H%M%S)"
ZIP_NAME="dist-deploy-${TS}.zip"
ZIP_FILE="$PROJECT_DIR/$ZIP_NAME"
TRIGGER_NAME="deploy-$(openssl rand -hex 8).php"
TRIGGER_TOKEN="$(openssl rand -hex 16)"
# PHP trigger en _deploy/ (subdir temporal; dirname(__DIR__)=public_html/ que es el docroot)
TRIGGER_URL="${BASE_URL%/}/_deploy/${TRIGGER_NAME}"

cleanup_local() {
  rm -f "$ZIP_FILE" 2>/dev/null || true
}
trap cleanup_local EXIT

# Paso 1: Crear ZIP desde apps/www/dist/
echo "[1/5] Creando ZIP local..."
cd "$DIST_DIR" && zip -rq "$ZIP_FILE" . -x "*.DS_Store" -x "Thumbs.db"
cd "$PROJECT_DIR"
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo "  → $ZIP_FILE ($ZIP_SIZE)"

# Paso 2: Subir ZIP por FTP
echo ""
echo "[2/5] Subiendo ZIP al servidor..."
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" -e "
set ssl:verify-certificate no
set net:timeout 120
set net:max-retries 5
put $ZIP_FILE -o ${FTP_REMOTE_DIR}${ZIP_NAME}
quit
"
echo "  → ZIP subido como ${ZIP_NAME}"

# Paso 3: Subir PHP trigger (a _deploy/ para que dirname(__DIR__)=public_html/)
echo ""
echo "[3/5] Subiendo trigger PHP..."
PHP_LOCAL=$(mktemp /tmp/swap-deploy-XXXX.php)

{
  TOKEN_ESC=$(printf '%s' "$TRIGGER_TOKEN" | sed 's:[\\/&|]:\\&:g')
  ZIP_ESC=$(printf '%s' "$ZIP_NAME" | sed 's:[\\/&|]:\\&:g')
  BASE_ESC=$(printf '%s' "$BASE_URL" | sed 's:[\\/&|]:\\&:g')
  SMOKE_B64=$(printf '%s' "$SMOKE_JSON" | base64 -w0)
  PRESERVE_B64=$(printf '%s' "$PRESERVE_JSON" | base64 -w0)

  sed \
    -e "s|__TOKEN__|${TOKEN_ESC}|g" \
    -e "s|__ZIP_FILENAME__|${ZIP_ESC}|g" \
    -e "s|__SMOKE_URLS_B64__|${SMOKE_B64}|g" \
    -e "s|__BASE_URL__|${BASE_ESC}|g" \
    -e "s|__PRESERVE_B64__|${PRESERVE_B64}|g" \
    "$PHP_TEMPLATE" > "$PHP_LOCAL"
}

# Sanity: verificar que los 5 placeholders fueron reemplazados
RESIDUAL=$(grep -oE '__(TOKEN|ZIP_FILENAME|SMOKE_URLS_B64|BASE_URL|PRESERVE_B64)__' "$PHP_LOCAL" || true)
if [ -n "$RESIDUAL" ]; then
  echo "  → ERROR: placeholders sin sustituir en PHP generado:"
  echo "$RESIDUAL" | sort -u
  rm -f "$PHP_LOCAL"
  exit 1
fi

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" -e "
set ssl:verify-certificate no
mkdir -p ${FTP_REMOTE_DIR}_deploy
put $PHP_LOCAL -o ${FTP_REMOTE_DIR}_deploy/${TRIGGER_NAME}
quit
"
rm -f "$PHP_LOCAL"
echo "  → PHP subido como _deploy/${TRIGGER_NAME}"

# Paso 4: Trigger extract + manifest cleanup + smoke loopback
echo ""
echo "[4/5] Ejecutando extract + manifest cleanup + smoke loopback..."
RESULT=$(curl -sS --max-time 90 "${TRIGGER_URL}?token=${TRIGGER_TOKEN}" || echo "ERROR:curl-failed")

# Fallback: si el PHP no se auto-deleteó, borrarlo por FTP (mantiene H-87)
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" -e "
set ssl:verify-certificate no
rm -f ${FTP_REMOTE_DIR}_deploy/${TRIGGER_NAME}
quit
" >/dev/null 2>&1 || true

echo "  → Respuesta servidor: $RESULT"

if [[ "$RESULT" == FAIL:* ]]; then
  echo ""
  echo "  ✗ Deploy COMPLETADO pero SMOKE TEST FALLÓ tras cleanup."
  echo "    El sitio puede tener páginas rotas. NO hay rollback automático."
  echo "    Recovery sugerida: git revert <commit> && bash scripts/deploy-ftp.sh --build"
  exit 1
fi
if [[ "$RESULT" != OK:* ]]; then
  echo ""
  echo "  ✗ ERROR en deploy: $RESULT"
  echo "    Estado del servidor desconocido. Revisar manualmente vía Hestia FileManager."
  exit 1
fi

# Parse: OK:extracted=<N>:cleaned=<N>:failed=<N>:emptydirs=<N>:smoke=...
EXTRACTED=$(echo "$RESULT" | grep -oE 'extracted=[0-9]+' | head -1 | cut -d= -f2)
CLEANED=$(echo "$RESULT" | grep -oE 'cleaned=[0-9]+' | head -1 | cut -d= -f2)
FAILED_DEL=$(echo "$RESULT" | grep -oE 'failed=[0-9]+' | head -1 | cut -d= -f2)
EMPTYDIRS=$(echo "$RESULT" | grep -oE 'emptydirs=[0-9]+' | head -1 | cut -d= -f2)
echo "  → $EXTRACTED archivos extraídos · $CLEANED huérfanos limpiados (failed: ${FAILED_DEL:-0}) · $EMPTYDIRS dirs vacíos eliminados"

# Paso 5: Smoke externo de verificación cruzada
echo ""
echo "[5/5] Smoke externo (verificación cruzada desde local)..."
SMOKE_FAIL=0
for path_with_grep in "/:Caleta" "/apartments/:" "/sitemap-index.xml:sitemapindex"; do
  path="${path_with_grep%%:*}"
  pattern="${path_with_grep#*:}"
  url="${BASE_URL%/}${path}"

  HTTP_CODE=$(curl -s -o /tmp/smoke-body.$$ -w "%{http_code}" --max-time 15 "$url" || echo "000")
  if [ "$HTTP_CODE" != "200" ]; then
    echo "  ✗ $url → HTTP $HTTP_CODE"
    SMOKE_FAIL=1
  elif [ -n "$pattern" ] && ! grep -q "$pattern" /tmp/smoke-body.$$ 2>/dev/null; then
    echo "  ✗ $url → 200 OK pero falta patrón '$pattern'"
    SMOKE_FAIL=1
  else
    echo "  ✓ $url → 200 OK${pattern:+ + patrón '$pattern' encontrado}"
  fi
  rm -f /tmp/smoke-body.$$
done

echo ""
if [ "$SMOKE_FAIL" -eq 1 ]; then
  echo "⚠ Smoke externo detectó problemas — pero el smoke loopback del servidor pasó."
  echo "  Posibles causas: caché CDN, DNS local, intermitencia. Verifica manualmente:"
  echo "    curl -I $BASE_URL/"
  echo "  Rollback manual disponible (ver proyecto/despliegue.md §Rollback deploy)."
  exit 2
fi

echo "✓ Deploy completado correctamente — $EXTRACTED archivos servidos, $CLEANED huérfanos eliminados."
echo "  No hay rollback automático: si detectas un bug post-deploy → git revert + redeploy."
