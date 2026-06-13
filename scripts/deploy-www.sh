#!/usr/bin/env bash
# Deploy WWW (apps/www) a producción Hestia VPS via rsync+SSH (puerto 22).
# Patrón replicado de logopedajessica-web/scripts/deploy-www.sh, simplificado
# para Caleta Suites: sitio 100% estático (sin Pagefind, sin api/ PHP).
#
# Uso:
#   bash scripts/deploy-www.sh [--dry-run]
#   pnpm deploy:www [ -- --dry-run ]
#
# Requiere en .env (raíz del repo):
#   WWW_SSH_HOST=<TODO>     # alias de ~/.ssh/config o user@host del VPS Hestia
#   WWW_REMOTE_DIR=<TODO>   # ruta absoluta del document root (convención Hestia:
#                           #   /home/<user>/web/<dominio>/public_html)
#
# IMPORTANTE: el host SSH y el directorio remoto de Caleta Suites AÚN NO se conocen
# (pendiente del usuario — plan F0). Sin .env con esas dos variables el script aborta
# con un mensaje claro y NO toca ningún servidor. NUNCA pongas credenciales aquí ni
# en .env.example: el .env real está en .gitignore.

set -euo pipefail

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
  esac
done

# Auto-activar Node 20 si hay nvm disponible (Astro 5 requiere >=20).
if [ -z "${NVM_DIR:-}" ] && [ -d "$HOME/.nvm" ]; then
  export NVM_DIR="$HOME/.nvm"
fi
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || nvm install 20 >/dev/null
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
DIST_DIR="$PROJECT_DIR/apps/www/dist"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: no existe .env en la raíz — crea uno con WWW_SSH_HOST + WWW_REMOTE_DIR."
  echo "  Ver variables requeridas en scripts/deploy-www.sh (cabecera) y en el README de deploy."
  exit 1
fi

# `|| true` evita que pipefail aborte si la variable no está (grep sin match → exit 1).
WWW_SSH_HOST=$(grep '^WWW_SSH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'" || true)
WWW_REMOTE_DIR=$(grep '^WWW_REMOTE_DIR=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'" || true)

for var in WWW_SSH_HOST WWW_REMOTE_DIR; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var no está definido en .env (o es un TODO sin rellenar)."
    echo "  Caleta Suites aún no tiene host/dir de Hestia confirmados — pendiente del usuario."
    echo "  Ejemplo (convención Hestia):"
    echo "    WWW_SSH_HOST=caletasuites"
    echo "    WWW_REMOTE_DIR=/home/<user>/web/caletasuites.com/public_html"
    exit 1
  fi
done

# Normalizar: sin trailing slash en remote dir (rsync lo gestiona).
WWW_REMOTE_DIR="${WWW_REMOTE_DIR%/}"

# Sanitización: ambas variables se interpolan en comandos remotos (ssh/rsync).
# Una variable con metacaracteres shell permitiría inyección en el remoto.
if [[ "$WWW_REMOTE_DIR" =~ [[:space:]\;\&\|\<\>\$\`\'\"\\] ]]; then
  echo "Error: WWW_REMOTE_DIR contiene metacaracteres shell — abortando por seguridad."
  echo "  Valor: $WWW_REMOTE_DIR"
  exit 1
fi
if [[ "$WWW_SSH_HOST" =~ [[:space:]\;\&\|\<\>\$\`\'\"\\] ]]; then
  echo "Error: WWW_SSH_HOST contiene metacaracteres shell — abortando por seguridad."
  echo "  Valor: $WWW_SSH_HOST"
  exit 1
fi

echo "=== [1/4] Build de apps/www (128 páginas) ==="
cd "$PROJECT_DIR" && pnpm build:www
echo ""

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: build no generó $DIST_DIR"
  exit 1
fi
if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "Error: $DIST_DIR/index.html no encontrado — build incompleto."
  exit 1
fi

TOTAL_FILES=$(find "$DIST_DIR" -type f | wc -l)
echo "=== [2/4] Deploy WWW: $TOTAL_FILES archivos ==="
echo "Origen:   $DIST_DIR/"
echo "Destino:  $WWW_SSH_HOST:$WWW_REMOTE_DIR/"
[ "$DRY_RUN" -eq 1 ] && echo "Modo:     DRY-RUN (no se escribe nada en el servidor)"
echo ""

echo "[3/4] Verificando acceso SSH al servidor..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$WWW_SSH_HOST" "test -d '$WWW_REMOTE_DIR'" 2>/dev/null; then
  echo "Error: no se puede acceder a $WWW_REMOTE_DIR en $WWW_SSH_HOST via SSH."
  echo "  Verifica el alias SSH ($WWW_SSH_HOST) y que $WWW_REMOTE_DIR exista."
  echo "  Primer deploy: ssh $WWW_SSH_HOST 'mkdir -p $WWW_REMOTE_DIR'"
  exit 1
fi
echo "  → Acceso OK, directorio remoto existe."
echo ""

echo "[4/4] Sincronizando dist/ → servidor (rsync --delete-after)..."
RSYNC_OPTS=(
  -avz
  --delete-after          # borra remotos tras transferir (más seguro ante corte de red)
  --human-readable
  --secluded-args         # sin expansión shell de args remotos (defensa en profundidad)
  --exclude='.DS_Store'
  --exclude='Thumbs.db'
  --exclude='*.map'       # no exponer sourcemaps en producción
)
[ "$DRY_RUN" -eq 1 ] && RSYNC_OPTS+=(--dry-run --itemize-changes)

rsync "${RSYNC_OPTS[@]}" \
  "$DIST_DIR/" \
  "$WWW_SSH_HOST:$WWW_REMOTE_DIR/"
echo ""

if [ "$DRY_RUN" -eq 1 ]; then
  echo "=== DRY-RUN completado — no se tocó el servidor. ==="
  exit 0
fi

# Smoke test post-deploy. El dominio público de Caleta Suites se toma de
# WWW_SMOKE_URL si está en .env; si no, se omite (host aún no confirmado).
SMOKE_BASE=$(grep '^WWW_SMOKE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'" || true)
if [ -n "${SMOKE_BASE:-}" ]; then
  echo "[post] Smoke test → $SMOKE_BASE/"
  HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" -H "Cache-Control: no-cache" "${SMOKE_BASE%/}/" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ home 200"
  else
    echo "  ❌ home devolvió $HTTP_CODE — revisa el vhost en Hestia (document root)."
    exit 1
  fi
else
  echo "[post] WWW_SMOKE_URL no definido en .env — smoke test omitido (define el dominio público para activarlo)."
fi

echo "=== Deploy completado. ==="
