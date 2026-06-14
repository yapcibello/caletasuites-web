#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────
# ftp-check.sh — Verificación de conexión FTP de caletasuitestenerife.com
#
# Valida login (usuario/contraseña) y el FTP_REMOTE_DIR configurado en
# el .env, SIN disparar fail2ban (para en 1 fallo por seguridad).
#
# Uso:  bash scripts/ftp-check.sh
# Requiere: curl + un .env poblado en la raíz del repo.
# ───────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

[ -f ./.env ] || { echo "ERROR: no existe ./.env (cp .env.example .env y rellenar)"; exit 1; }
set -a; source ./.env; set +a

HOST="${FTP_HOST:-}"
USER="${FTP_USER:-}"
PASS="${FTP_PASS:-}"
DIR="${FTP_REMOTE_DIR:-}"
BASE_URL="${DEPLOY_BASE_URL:-https://caletasuitestenerife.com}"

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$PASS" ] || [ -z "$DIR" ]; then
  echo "ERROR: faltan variables FTP_HOST / FTP_USER / FTP_PASS / FTP_REMOTE_DIR en .env"
  exit 1
fi

DOM="${BASE_URL#https://}"
printf "%-36s %-7s %-40s %s\n" "DOMINIO" "ESTADO" "DIR" "DETALLE"
printf '%.0s-' {1..100}; echo

curl -s --connect-timeout 15 --max-time 30 "ftp://$HOST$DIR" --user "$USER:$PASS" >/dev/null 2>&1
rc=$?
case $rc in
  0)  printf "%-36s %-7s %-40s %s\n" "$DOM" "OK"   "$DIR" "login + DIR correctos"
      echo; echo "✓ Conexión FTP verificada — puedes ejecutar: bash scripts/deploy-ftp.sh --build"
      exit 0 ;;
  67) printf "%-36s %-7s %-40s %s\n" "$DOM" "FAIL" "$DIR" "530 credenciales incorrectas (rc=67)"
      echo; echo "✗ Credenciales incorrectas — revisa FTP_USER y FTP_PASS en .env"
      exit 1 ;;
  9)  printf "%-36s %-7s %-40s %s\n" "$DOM" "ERR"  "$DIR" "DIR inexistente en la jaula FTP (rc=9)"
      echo; echo "✗ El directorio '$DIR' no existe en la jaula FTP — revisa FTP_REMOTE_DIR"
      exit 1 ;;
  *)  printf "%-36s %-7s %-40s %s\n" "$DOM" "ERR"  "$DIR" "rc=$rc (timeout/red/fail2ban)"
      echo; echo "✗ Error de conexión (rc=$rc) — ¿el servidor FTP está accesible?"
      exit 1 ;;
esac
