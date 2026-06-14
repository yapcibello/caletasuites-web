#!/usr/bin/env bash
# fetch-montserrat.sh — descarga y self-hostea la fuente Montserrat (REQUIERE RED).
#
# Por qué: tras la migración, `font-montserrat.css` referenciaba ficheros .woff2
# locales que NO existen (y no había <link> a Google Fonts), de modo que Montserrat
# no cargaba y el sitio caía al fallback system-ui. Este script:
#   1. Descarga el CSS oficial de Montserrat desde Google Fonts (todos los pesos,
#      normal + itálica — réplica del set original del tema).
#   2. Descarga cada .woff2 referenciado a la carpeta de fuentes del sitio.
#   3. Regenera `font-montserrat.css` reescribiendo las URLs de gstatic a rutas
#      locales (mismo origen → mejor CWV y privacidad RGPD, sin llamadas a Google).
#
# Uso (desde una máquina con conexión a internet):
#   bash scripts/fetch-montserrat.sh
#   pnpm build:www   # reconstruir con la fuente ya self-hosteada
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONTS_DIR="$ROOT/apps/www/public/wp-content/uploads/elementor/google-fonts/fonts"
CSS_OUT="$ROOT/apps/www/public/wp-assets/css/font-montserrat.css"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

# Familia completa: pesos 100–900, normal (0) e itálica (1). display=swap.
URL="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"

mkdir -p "$FONTS_DIR"

echo "▶ Descargando CSS de Google Fonts (Montserrat)…"
css="$(curl -fsSL -A "$UA" "$URL")" || {
  echo "✗ No se pudo conectar a Google Fonts. Ejecuta este script con conexión a internet." >&2
  exit 1
}

echo "▶ Descargando ficheros .woff2…"
n_dl=0
while IFS= read -r u; do
  [[ -z "$u" ]] && continue
  fn="$(basename "$u")"
  if [[ ! -f "$FONTS_DIR/$fn" ]]; then
    curl -fsSL -A "$UA" "$u" -o "$FONTS_DIR/$fn"
    echo "  ✓ $fn"
    n_dl=$((n_dl + 1))
  fi
done < <(printf '%s\n' "$css" | grep -oE 'https://[^)]+\.woff2' | sort -u)

echo "▶ Regenerando $CSS_OUT (URLs gstatic → rutas locales)…"
{
  echo "/* Montserrat self-hosted — generado por scripts/fetch-montserrat.sh."
  echo "   Reemplaza la dependencia de Google Fonts por ficheros del mismo origen"
  echo "   (mejor CWV y privacidad RGPD). Ficheros en"
  echo "   /wp-content/uploads/elementor/google-fonts/fonts/. NO editar a mano:"
  echo "   re-ejecutar el script para actualizar. */"
  printf '%s\n' "$css" \
    | sed -E 's#https://[^)]+/([^/)]+\.woff2)#/wp-content/uploads/elementor/google-fonts/fonts/\1#g'
} > "$CSS_OUT"

n_total="$(ls "$FONTS_DIR"/*.woff2 2>/dev/null | wc -l | tr -d ' ')"
echo "✓ Montserrat self-hosteada: $n_dl ficheros nuevos descargados, $n_total .woff2 en total."
echo "  Siguiente paso: pnpm build:www"
