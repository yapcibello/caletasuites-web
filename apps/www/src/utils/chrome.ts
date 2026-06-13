// Utilidades para el "chrome" global (header y footer) extraído del tema WordPress.
//
// El markup de _chrome/*.html se extrajo del HTML renderizado en vivo y ya viene
// con la mayoría de URLs reescritas a rutas locales. Esta función actúa como red
// de seguridad: normaliza cualquier URL absoluta de assets que pudiera quedar al
// dominio local, sin tocar jamás los enlaces de navegación (URLs inmutables).

/** Dominio de producción cuyas URLs de assets se reescriben a rutas locales. */
const DOMINIO_PROD = 'https://caletasuitestenerife.com';

/**
 * Reescribe URLs absolutas de assets del dominio de producción a rutas locales.
 *
 * Solo afecta a recursos servidos desde public/ (wp-content, wp-includes,
 * wp-assets): src/href de imágenes, hojas, fuentes, iconos. Los enlaces de
 * navegación del menú ya son relativos en el chrome extraído y NO se modifican.
 */
export function fixUrlsChrome(html: string): string {
  // 1) Assets bajo wp-content / wp-includes / wp-assets con dominio absoluto.
  let salida = html.replace(
    new RegExp(`${DOMINIO_PROD}(/wp-(?:content|includes|assets)/)`, 'g'),
    '$1',
  );

  // 2) Variante con http:// (por si algún asset quedó sin https).
  salida = salida.replace(
    /http:\/\/caletasuitestenerife\.com(\/wp-(?:content|includes|assets)\/)/g,
    '$1',
  );

  return salida;
}
