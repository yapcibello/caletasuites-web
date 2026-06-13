// 07-extract-page-css.mjs — Extracción del CSS de maquetación INLINE por página.
//
// PROBLEMA: la web origen usa Elementor con css_print_method: internal. El CSS
// específico de cada página va INLINE en el <head> en bloques
//   <style id="elementor-post-XXXX">…</style>
// y otros inline (global-styles, liquid-base, elementor-frontend, wp-custom-css,
// rs-plugin-settings). La migración solo trajo content.rendered (sin <head>), así
// que las 126 páginas renderizaban SIN ese CSS → maquetación rota.
//
// SOLUCIÓN: para cada URL del inventario, hacer fetch del HTML en vivo, extraer
// esos bloques <style>, reescribir las URLs absolutas de assets a rutas locales,
// y guardar el CSS:
//   - por página → apps/www/src/content/_raw_css/<rawKey>.css
//   - global compartido (bloques idénticos en TODAS las páginas que lo tienen)
//     → apps/www/src/styles/elementor-global-inline.css (importado 1 vez en Layout)
// Además descarga cualquier asset nuevo referenciado SOLO en este CSS y que falte.
//
// REGLAS:
//   - URLs INMUTABLES. NO se toca contenido ni maquetado; solo se AÑADE el CSS.
//   - Idempotente y reanudable: cachea los bloques extraídos por página en
//     _css_cache/<rawKey>.json; si existe, salta el fetch de esa página.
//   - Cortesía: ~500ms entre fetches (es nuestro propio sitio). 1 reintento.

import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BASE } from './lib.mjs';

const execFileP = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, '..', '..');
const WWW = join(RAIZ, 'apps', 'www');
const INVENTARIO = join(__dirname, 'inventario-urls.json');
const RAW_DIR = join(WWW, 'src', 'content', '_raw');
const RAW_CSS_DIR = join(WWW, 'src', 'content', '_raw_css');
const CACHE_DIR = join(__dirname, '_css_cache');
const GLOBAL_CSS = join(WWW, 'src', 'styles', 'elementor-global-inline.css');
const PUBLIC = join(WWW, 'public');

// Pausa de cortesía entre fetches (somos los dueños del sitio, pero cortés).
const DELAY_MS = 500;
const UA = 'caletasuites-migracion/1.0';

// Prefijos de los <style id="…"> que NOS INTERESAN. Cualquier id que empiece por
// 'elementor-post-' es CSS específico de página (siempre se extrae). El resto son
// inline concretos que pueden variar por página o ser globales; lo decide la fase
// de análisis comparando su contenido entre todas las páginas.
const IDS_INLINE = new Set([
  'global-styles-inline-css',
  'liquid-base-inline-css',
  'elementor-frontend-inline-css',
  'wp-custom-css',
  'rs-plugin-settings-inline-css',
]);

/** ¿El id de un bloque <style> nos interesa extraerlo? */
function idRelevante(id) {
  return id.startsWith('elementor-post-') || IDS_INLINE.has(id);
}

/**
 * Clave de agrupación de un bloque para decidir global vs por página. Los
 * elementor-post-XXXX comparten layout de header/footer entre páginas pero con id
 * numérico distinto; agrupamos por el id literal porque el contenido es lo que
 * compararemos (mismo contenido → global). Para inline usamos el id tal cual.
 */
function claveBloque(id) {
  return id;
}

/** fetch del HTML en vivo de una URL con 1 reintento. */
async function fetchHtml(url) {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (intento === 2) throw err;
      await sleep(DELAY_MS * 2);
    }
  }
}

/**
 * Extrae del <head> los bloques <style id="…">…</style> relevantes.
 * Devuelve un array de { id, css } en orden de aparición (la cascada importa).
 */
function extraerBloques(html) {
  // Acotar al <head> para no capturar <style> incrustados en el cuerpo.
  const head = html.slice(0, html.indexOf('</head>') + 7 || html.length);
  const re = /<style id="([^"]+)"[^>]*>([\s\S]*?)<\/style>/g;
  const bloques = [];
  let m;
  while ((m = re.exec(head)) !== null) {
    const id = m[1];
    if (!idRelevante(id)) continue;
    bloques.push({ id, css: m[2] });
  }
  return bloques;
}

/**
 * Reescribe en el CSS las URLs absolutas de assets del sitio a rutas locales:
 *   https://caletasuitestenerife.com/wp-content/… → /wp-content/…
 *   //caletasuitestenerife.com/wp-content/…       → /wp-content/…
 * Devuelve { css, assets } donde assets es el Set de rutas /wp-content/… referenciadas.
 */
function reescribirUrls(css) {
  const assets = new Set();
  const reescrito = css.replace(
    /(?:https?:)?\/\/caletasuitestenerife\.com(\/wp-content\/[^)"'\s]+)/g,
    (_full, ruta) => {
      // Quitar querystring de versión (?ver=…) para casar con el asset en disco.
      const limpia = ruta.replace(/\?[^)"'\s]*$/, '');
      assets.add(limpia);
      return limpia;
    },
  );
  return { css: reescrito, assets };
}

/** Mapa rawKey -> ruta del .html en _raw (para validar que cada URL tiene su rawKey). */
async function indiceRawKeys() {
  const idx = new Map();
  for (const col of ['apartamentos', 'paginas', 'posts']) {
    const dir = join(RAW_DIR, col);
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      if (f.endsWith('.html')) idx.set(f.replace(/\.html$/, ''), col);
    }
  }
  return idx;
}

/**
 * Casa una URL del inventario con su rawKey. El rawKey en frontmatter coincide con
 * el nombre del fichero en _raw. La convención observada es <slug>-<idioma>; pero
 * para no derivar (regla: no inventar), buscamos el rawKey leyendo el frontmatter
 * de los MDX por su `path`. Aquí construimos el índice path -> rawKey una sola vez.
 */
async function indicePathRawKey() {
  const idx = new Map();
  const contentDir = join(WWW, 'src', 'content');
  for (const col of ['apartamentos', 'paginas', 'posts']) {
    const dir = join(contentDir, col);
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      if (!f.endsWith('.mdx')) continue;
      const fm = await readFile(join(dir, f), 'utf8');
      const mPath = fm.match(/^path:\s*"([^"]+)"/m);
      const mRaw = fm.match(/^rawKey:\s*"([^"]+)"/m);
      if (mPath && mRaw) idx.set(mPath[1], mRaw[1]);
    }
  }
  return idx;
}

async function existe(ruta) {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

/** Descarga un asset /wp-content/… al public/ con curl (path exacto). */
async function descargarAsset(rutaWeb, faltantes) {
  const destino = join(PUBLIC, rutaWeb.replace(/^\//, ''));
  if (await existe(destino)) return false; // ya existe
  await mkdir(dirname(destino), { recursive: true });
  const url = `${BASE}${rutaWeb}`;
  try {
    await execFileP('curl', ['-fsSL', '-A', UA, '-o', destino, url], { maxBuffer: 1024 * 1024 * 64 });
    await sleep(DELAY_MS);
    return true;
  } catch {
    faltantes.push(rutaWeb);
    return false;
  }
}

async function main() {
  await mkdir(RAW_CSS_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(dirname(GLOBAL_CSS), { recursive: true });

  const inventario = JSON.parse(await readFile(INVENTARIO, 'utf8'));
  const urls = inventario.urls;
  const pathRawKey = await indicePathRawKey();
  const rawKeys = await indiceRawKeys();

  const fallos = [];
  // Mapa rawKey -> { path, bloques: [{id, css(reescrito), assets:[]}] }
  const porPagina = new Map();

  // --- FASE 1: fetch + extracción (con cache reanudable) ---------------------
  let i = 0;
  for (const u of urls) {
    i++;
    const rawKey = pathRawKey.get(u.path);
    if (!rawKey) {
      fallos.push({ path: u.path, motivo: 'sin rawKey casado en MDX' });
      console.warn(`  [${i}/${urls.length}] SIN rawKey para ${u.path}`);
      continue;
    }
    if (!rawKeys.has(rawKey)) {
      fallos.push({ path: u.path, rawKey, motivo: 'sin HTML en _raw' });
    }

    const cacheFile = join(CACHE_DIR, `${rawKey}.json`);
    const cssFinal = join(RAW_CSS_DIR, `${rawKey}.css`);

    // Reanudable: si ya hay cache de bloques, reusarla sin volver a fetchear.
    if (await existe(cacheFile)) {
      const cached = JSON.parse(await readFile(cacheFile, 'utf8'));
      porPagina.set(rawKey, cached);
      continue;
    }

    const url = `${BASE}${u.path}`;
    try {
      const html = await fetchHtml(url);
      const bloques = extraerBloques(html).map(({ id, css }) => {
        const { css: reescrito, assets } = reescribirUrls(css);
        return { id, css: reescrito, assets: [...assets] };
      });
      const reg = { path: u.path, bloques };
      porPagina.set(rawKey, reg);
      await writeFile(cacheFile, JSON.stringify(reg), 'utf8');
      console.log(`  [${i}/${urls.length}] ${u.path} → ${bloques.length} bloques`);
      await sleep(DELAY_MS);
    } catch (err) {
      fallos.push({ path: u.path, rawKey, motivo: String(err.message || err) });
      console.warn(`  [${i}/${urls.length}] FALLO ${u.path}: ${err.message}`);
    }
  }

  // --- FASE 2: análisis global vs por página ---------------------------------
  // Agrupa cada bloque por su id. Un bloque es GLOBAL si su contenido es idéntico
  // en TODAS las páginas donde aparece y aparece en más de una página. Si varía,
  // se queda en el CSS por página.
  const contenidoPorId = new Map(); // id -> Set de contenidos distintos
  const pagsConId = new Map(); // id -> nº de páginas que lo tienen
  for (const { bloques } of porPagina.values()) {
    for (const { id, css } of bloques) {
      const k = claveBloque(id);
      if (!contenidoPorId.has(k)) contenidoPorId.set(k, new Set());
      contenidoPorId.get(k).add(css);
      pagsConId.set(k, (pagsConId.get(k) || 0) + 1);
    }
  }

  // Un id es global si: contenido único (1 variante) y aparece en >1 página.
  const idsGlobales = new Set();
  for (const [id, contenidos] of contenidoPorId) {
    if (contenidos.size === 1 && (pagsConId.get(id) || 0) > 1) idsGlobales.add(id);
  }

  // --- FASE 3: escritura de CSS por página y global --------------------------
  // CSS global compartido: un bloque por cada id global (orden estable por id).
  const bloquesGlobales = [];
  for (const id of [...idsGlobales].sort()) {
    // Coger el contenido (único) de la primera página que lo tenga.
    let css = null;
    for (const { bloques } of porPagina.values()) {
      const b = bloques.find((x) => x.id === id);
      if (b) {
        css = b.css;
        break;
      }
    }
    if (css !== null) bloquesGlobales.push(`/* ${id} (compartido entre páginas) */\n${css}`);
  }

  const assetsReferenciados = new Set();

  // CSS por página: solo los bloques que NO son globales, en orden de aparición.
  let conCss = 0;
  for (const [rawKey, { bloques }] of porPagina) {
    const propios = bloques.filter((b) => !idsGlobales.has(claveBloque(b.id)));
    for (const b of bloques) for (const a of b.assets) assetsReferenciados.add(a);
    const cssFinal = join(RAW_CSS_DIR, `${rawKey}.css`);
    if (propios.length === 0) {
      // Página sin CSS propio (todo es global): escribir comentario para que el
      // glob del routing tenga un archivo y no falle el casado, pero 0 reglas.
      await writeFile(cssFinal, `/* ${rawKey}: sin CSS específico (todo compartido) */\n`, 'utf8');
      continue;
    }
    const cuerpo = propios.map((b) => `/* ${b.id} */\n${b.css}`).join('\n');
    await writeFile(cssFinal, cuerpo, 'utf8');
    conCss++;
  }

  // Escribir el CSS global compartido (importado 1 vez en el Layout).
  if (bloquesGlobales.length > 0) {
    const cabecera =
      '/* CSS inline de Elementor IDÉNTICO en todas las páginas (extraído una vez\n' +
      '   para no duplicarlo 126 veces). Importado en Layout.astro. Generado por\n' +
      '   scripts/migrate/07-extract-page-css.mjs — NO editar a mano. */\n\n';
    await writeFile(GLOBAL_CSS, cabecera + bloquesGlobales.join('\n\n') + '\n', 'utf8');
  }

  // --- FASE 4: descarga de assets nuevos referenciados en el CSS -------------
  const faltantes = [];
  let descargados = 0;
  for (const ruta of assetsReferenciados) {
    if (await descargarAsset(ruta, faltantes)) descargados++;
  }

  // --- Resumen ----------------------------------------------------------------
  console.log('\n=== RESUMEN 07-extract-page-css ===');
  console.log(`Páginas procesadas:        ${porPagina.size}/${urls.length}`);
  console.log(`Páginas con CSS propio:    ${conCss}`);
  console.log(`IDs globales compartidos:  ${[...idsGlobales].join(', ') || '(ninguno)'}`);
  console.log(`Assets referenciados:      ${assetsReferenciados.size}`);
  console.log(`Assets descargados nuevos: ${descargados}`);
  console.log(`Assets faltantes (404):    ${faltantes.length}`);
  if (faltantes.length) faltantes.forEach((f) => console.log(`   FALTA: ${f}`));
  console.log(`Fallos de fetch/datos:     ${fallos.length}`);
  if (fallos.length) fallos.forEach((f) => console.log(`   ${f.path}: ${f.motivo}`));
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
