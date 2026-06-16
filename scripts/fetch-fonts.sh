#!/usr/bin/env bash
# fetch-fonts.sh — descarga y self-hostea TODAS las fuentes del tema (REQUIERE RED).
#
# Por qué: tras la migración WP→Astro, los CSS de fuente (font-*.css) referenciaban
# ficheros .woff2 locales con nombres cacheados por Elementor que NUNCA se copiaron a
# public/. Resultado: las fuentes no cargaban y el sitio caía a fallbacks del sistema.
# `fetch-montserrat.sh` solo arregló Montserrat; este script generaliza el patrón a
# todas las familias del tema (Be Vietnam Pro —body/titulares—, DM Serif Display,
# Libre Baskerville, Source Serif 4 y Montserrat).
#
# Para cada familia:
#   1. Descarga el CSS oficial de Google Fonts (ejes/pesos reales de la familia).
#   2. Descarga cada .woff2 referenciado a la carpeta de fuentes del sitio.
#   3. Regenera el font-<familia>.css local reescribiendo las URLs gstatic a rutas
#      locales del mismo origen (mejor CWV y privacidad RGPD, sin llamadas a Google).
#
# Uso (desde una máquina con conexión a internet):
#   bash scripts/fetch-fonts.sh
#   pnpm build:www   # reconstruir con las fuentes ya self-hosteadas
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONTS_DIR="$ROOT/apps/www/public/wp-content/uploads/elementor/google-fonts/fonts"
CSS_DIR="$ROOT/apps/www/public/wp-assets/css"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

# Familia → fichero CSS de salida → query css2 de Google Fonts (ejes reales).
# El nombre de fichero coincide con el ya referenciado por el HTML del tema.
FAMILIES=(
  "font-montserrat.css|Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900"
  "font-bevietnampro.css|Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900"
  "font-dmserifdisplay.css|DM+Serif+Display:ital@0;1"
  "font-librebaskerville.css|Libre+Baskerville:ital,wght@0,400;0,700;1,400"
  "font-sourceserif4.css|Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900"
)

mkdir -p "$FONTS_DIR"
total_dl=0

for entry in "${FAMILIES[@]}"; do
  out="${entry%%|*}"
  spec="${entry#*|}"
  fam="${spec%%:*}"
  url="https://fonts.googleapis.com/css2?family=${spec}&display=swap"

  echo "▶ ${fam//+/ } …"
  css="$(curl -fsSL -A "$UA" "$url")" || {
    echo "✗ No se pudo descargar el CSS de '${fam//+/ }'. ¿Conexión a internet? URL: $url" >&2
    exit 1
  }

  # Descargar woff2 referenciados que aún no estén en disco.
  while IFS= read -r u; do
    [[ -z "$u" ]] && continue
    fn="$(basename "$u")"
    if [[ ! -f "$FONTS_DIR/$fn" ]]; then
      curl -fsSL -A "$UA" "$u" -o "$FONTS_DIR/$fn"
      echo "    ✓ $fn"
      total_dl=$((total_dl + 1))
    fi
  done < <(printf '%s\n' "$css" | grep -oE 'https://[^)]+\.woff2' | sort -u)

  # Regenerar el CSS local con rutas del mismo origen.
  {
    echo "/* ${fam//+/ } self-hosted — generado por scripts/fetch-fonts.sh."
    echo "   Reemplaza la dependencia de Google Fonts por ficheros del mismo origen"
    echo "   (mejor CWV y privacidad RGPD). Ficheros en"
    echo "   /wp-content/uploads/elementor/google-fonts/fonts/. NO editar a mano:"
    echo "   re-ejecutar el script para actualizar. */"
    printf '%s\n' "$css" \
      | sed -E 's#https://[^)]+/([^/)]+\.woff2)#/wp-content/uploads/elementor/google-fonts/fonts/\1#g'
  } > "$CSS_DIR/$out"
  echo "    → $out regenerado"
done

n_total="$(ls "$FONTS_DIR"/*.woff2 2>/dev/null | wc -l | tr -d ' ')"
echo
echo "✓ Fuentes self-hosteadas: $total_dl ficheros nuevos descargados, $n_total .woff2 en total."
echo "  Siguiente paso: pnpm build:www"
