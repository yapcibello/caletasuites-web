// Tarea SEO-BASELINE — Parchea el frontmatter de los MDX con los metadatos SEO
// ORIGINALES de Yoast (los que ya posicionan) y el mapa de traducciones EN↔ES.
//
// REGLA INNEGOCIABLE: no inventamos textos. Los campos seoTitle/seoDescription/
// ogImage se copian TAL CUAL de tmp/wp-export/*.json (yoast_head_json) cruzando por
// el `id` de WordPress (el mismo que ya usa 02-to-mdx.mjs vía el inventario).
//
// hreflang (campo altPath): WPML NO expone el id de traducción en el export REST
// (no hay translations/wpml_translations en el JSON). Se resuelve por emparejamiento
// determinista documentado en construirMapaTraducciones():
//   - apartamentos: mapa curado 1:1 EN↔ES (10 pares, ya existente en 02-to-mdx).
//   - paginas: mapa curado EN↔ES por slug equivalente (24 pares; under-construction sin par).
//   - posts: (categoría + fecha YYYY-MM-DD); colisiones desempatadas por la 1ª imagen del cuerpo.
//
// El script es IDEMPOTENTE: reescribe el bloque de frontmatter quitando primero
// cualquier campo SEO previo (seoTitle/seoDescription/ogImage/altPath) y reinyectándolo.
// No toca el cuerpo del MDX ni el HTML crudo. Volver a ejecutarlo da el mismo resultado.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { idiomaDeUrl, categoriaDePost, fileSlug } from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..', '..');
const TMP = join(ROOT, 'tmp', 'wp-export');
const CONTENT = join(ROOT, 'apps', 'www', 'src', 'content');

const cargar = (f) => JSON.parse(readFileSync(join(TMP, f), 'utf-8'));
const INVENTARIO = JSON.parse(
  readFileSync(join(__dir, 'inventario-urls.json'), 'utf-8'),
).urls;
const PATH_POR_ID = new Map(INVENTARIO.map((u) => [u.id, u.path]));

// --- helpers de Yoast --------------------------------------------------------

/** Decodifica entidades HTML de los textos de Yoast (mismo criterio que 02-to-mdx). */
function decode(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&#x2019;|&#8216;/g, '’')
    .replace(/&#8211;|&#8212;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Extrae los metadatos SEO de Yoast de un item REST. */
function metaSeo(item) {
  const y = item.yoast_head_json || {};
  const ogImg = Array.isArray(y.og_image) && y.og_image[0]?.url ? y.og_image[0].url : null;
  return {
    seoTitle: y.title ? decode(y.title) : null,
    // og_description suele igualar a description; preferimos description (más SEO).
    seoDescription: y.description ? decode(y.description) : null,
    ogImage: ogImg, // URL absoluta https:// tal cual la sirve Yoast.
  };
}

/** path inmutable de un item (inventario por id, fallback al link REST). */
function pathItem(item) {
  if (PATH_POR_ID.has(item.id)) return PATH_POR_ID.get(item.id);
  const p = new URL(item.link).pathname;
  return p.endsWith('/') ? p : `${p}/`;
}

// --- mapa de traducciones EN↔ES ---------------------------------------------

// Páginas: emparejamiento curado por slug equivalente (WPML no expone el id de
// traducción en el export). `under-construction` (EN) no tiene contraparte ES.
const PAGINAS_EN_A_ES = {
  '/': '/es/',
  '/work-spaces-coworking-in-tenerife/': '/es/work-spaces-coworking-en-tenerife/',
  '/reviews/': '/es/resenas/',
  '/booking-conditions/': '/es/condiciones-de-reserva/',
  '/cookie-policy/': '/es/politica-de-cookies/',
  '/legal-notice/': '/es/aviso-legal/',
  '/common-areas/': '/es/zonas-comunes/',
  '/penthouses/': '/es/aticos/',
  '/renders-gallery/': '/es/galeria-renders/',
  '/gallery/': '/es/galeria/',
  '/la-caleta/': '/es/la-caleta/',
  '/blog/': '/es/blog/',
  '/apartments/': '/es/apartamentos/',
  '/privacy-policy/': '/es/politica-de-privacidad/',
};

// Apartamentos (galerías de unidad): mapa curado 1:1 EN↔ES (paths de producción).
const APTOS_EN_A_ES = {
  '/gallery-2-bedrooms-apartment-floor-0-sea-view/': '/es/galeria-apartamento-2-hab-planta-0-vista-mar/',
  '/gallery-2-bedrooms-apartment-floor-0-mountain-view/': '/es/galeria-apartamento-2-hab-planta-0-vista-montana/',
  '/gallery-2-bedrooms-apartment-floor-1-seaview/': '/es/galeria-apartamento-2-hab-planta-1-vista-mar/',
  '/gallery-2-bedrooms-apartment-floor-1-mountain-view/': '/es/galeria-apartamento-2-hab-planta-1-vista-montana/',
  '/gallery-3-bedrooms-apartment-floor-1-seaview/': '/es/galeria-apartamento-3-hab-planta-1-vista-mar/',
  '/gallery-3-bedrooms-apartment-floor-1-mountain-view/': '/es/galeria-apartamento-3-hab-planta-1-vista-montana/',
  '/gallery-4-rooms-apartment-floor-1-mountain-view/': '/es/galeria-apartamento-4-hab-planta-1-vista-montana/',
  '/gallery-2-bedrooms-penthouse-large-terrace-mountain-view/': '/es/galeria-atico-2-hab-gran-terraza-vista-montana/',
  '/gallery-2-bedrooms-penthouse-large-terrace-sea-and-mountain-view/': '/es/galeria-atico-2-hab-gran-terraza-vista-mar-y-montana/',
  '/gallery-3-bedrooms-penthouse-large-terrace-seaview/': '/es/galeria-atico-3-hab-gran-terraza-vista-mar/',
};

/** Huella de imagen del cuerpo (1ª imagen, sin sufijo -WxH) para desempatar posts. */
function huellaImg(item) {
  const m = item.content.rendered.match(
    /wp-content\/uploads\/[^\s"')\\]+\.(?:jpe?g|png|webp)/i,
  );
  return m ? m[0].replace(/-\d+x\d+(?=\.)/, '') : null;
}

/**
 * Construye el mapa bidireccional path→path de traducción para las 126 URLs.
 * Devuelve { mapa: Map<path,path>, sinPar: string[] }.
 */
function construirMapaTraducciones(pagesEn, pagesEs, postsEn, postsEs) {
  const mapa = new Map();
  const emparejados = new Set();

  const par = (a, b) => {
    mapa.set(a, b);
    mapa.set(b, a);
    emparejados.add(a);
    emparejados.add(b);
  };

  // Páginas + apartamentos: mapas curados (claves = path EN).
  const curado = { ...PAGINAS_EN_A_ES, ...APTOS_EN_A_ES };
  for (const [en, es] of Object.entries(curado)) par(en, es);

  // Posts: (categoría + fecha), desempate por huella de imagen del cuerpo.
  const claveGrupo = (it) => `${categoriaDePost(it.link) || 'to-do'}|${it.date.slice(0, 10)}`;
  const gruposEs = new Map();
  for (const it of postsEs) {
    const k = claveGrupo(it);
    if (!gruposEs.has(k)) gruposEs.set(k, []);
    gruposEs.get(k).push(it);
  }
  for (const it of postsEn) {
    const k = claveGrupo(it);
    const candidatos = gruposEs.get(k) || [];
    let elegido = null;
    if (candidatos.length === 1) {
      elegido = candidatos[0];
    } else if (candidatos.length > 1) {
      const fp = huellaImg(it);
      const match = candidatos.filter((c) => huellaImg(c) === fp);
      if (match.length === 1) elegido = match[0];
    }
    if (elegido) {
      par(pathItem(it), pathItem(elegido));
      // Retira el elegido del grupo para no reutilizarlo.
      gruposEs.set(k, candidatos.filter((c) => c !== elegido));
    }
  }

  // URLs sin par: todas las del inventario que no quedaron emparejadas.
  const sinPar = INVENTARIO.map((u) => u.path).filter((p) => !emparejados.has(p));
  return { mapa, sinPar };
}

// --- parcheo idempotente de frontmatter --------------------------------------

const CAMPOS_SEO = ['seoTitle', 'seoDescription', 'ogImage', 'altPath'];

/** Escapa un valor para YAML entre comillas dobles. */
function yaml(v) {
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Lee el `path` del frontmatter de un MDX (línea `path: "..."`). */
function pathDeMdx(texto) {
  const m = texto.match(/^path:\s*"([^"]+)"/m);
  return m ? m[1] : null;
}

/**
 * Reescribe el frontmatter del MDX: elimina campos SEO previos (idempotencia) y
 * añade los nuevos justo antes del cierre `---`. No toca el cuerpo.
 */
function parchear(texto, seo) {
  const fin = texto.indexOf('\n---', 3);
  if (!texto.startsWith('---') || fin === -1) {
    throw new Error('MDX sin frontmatter válido');
  }
  const cabecera = texto.slice(3, fin); // contenido entre los dos ---
  const cuerpo = texto.slice(fin); // incluye el \n--- de cierre y el resto

  // Quita líneas SEO previas (idempotencia).
  const lineas = cabecera
    .split('\n')
    .filter((l) => !CAMPOS_SEO.some((c) => new RegExp(`^${c}:`).test(l.trim())));

  // Añade los campos SEO presentes (orden estable).
  const nuevas = [];
  if (seo.seoTitle) nuevas.push(`seoTitle: ${yaml(seo.seoTitle)}`);
  if (seo.seoDescription) nuevas.push(`seoDescription: ${yaml(seo.seoDescription)}`);
  if (seo.ogImage) nuevas.push(`ogImage: ${yaml(seo.ogImage)}`);
  if (seo.altPath) nuevas.push(`altPath: ${yaml(seo.altPath)}`);

  // Reconstruye limpiando líneas vacías colaterales al filtrar.
  const cabezaLimpia = lineas.join('\n').replace(/\n{2,}/g, '\n').replace(/\n+$/, '');
  return `---${cabezaLimpia}\n${nuevas.join('\n')}\n${cuerpo.replace(/^\n/, '\n')}`;
}

// --- main --------------------------------------------------------------------

function main() {
  const pagesEn = cargar('pages-en.json');
  const pagesEs = cargar('pages-es.json');
  const postsEn = cargar('posts-en.json');
  const postsEs = cargar('posts-es.json');

  // Índice path→meta SEO de Yoast (todas las entradas REST).
  const seoPorPath = new Map();
  for (const item of [...pagesEn, ...pagesEs, ...postsEn, ...postsEs]) {
    seoPorPath.set(pathItem(item), metaSeo(item));
  }

  const { mapa, sinPar } = construirMapaTraducciones(pagesEn, pagesEs, postsEn, postsEs);

  // Recorre los tres directorios de colecciones y parchea cada MDX por su `path`.
  let conTitle = 0;
  let conDesc = 0;
  let conOg = 0;
  let conAlt = 0;
  let total = 0;
  const sinMeta = [];

  for (const dir of ['apartamentos', 'paginas', 'posts']) {
    const base = join(CONTENT, dir);
    for (const f of readdirSync(base)) {
      if (!f.endsWith('.mdx')) continue;
      total++;
      const ruta = join(base, f);
      const texto = readFileSync(ruta, 'utf-8');
      const path = pathDeMdx(texto);
      if (!path) {
        console.warn(`  ⚠ ${dir}/${f}: sin campo path en frontmatter`);
        continue;
      }
      const seoYoast = seoPorPath.get(path) || {};
      const altPath = mapa.get(path) || null;
      const seo = { ...seoYoast, altPath };

      if (!seoYoast.seoTitle && !seoYoast.seoDescription && !seoYoast.ogImage) {
        sinMeta.push(path);
      }
      if (seo.seoTitle) conTitle++;
      if (seo.seoDescription) conDesc++;
      if (seo.ogImage) conOg++;
      if (seo.altPath) conAlt++;

      writeFileSync(ruta, parchear(texto, seo));
    }
  }

  console.log(`MDX procesados: ${total}`);
  console.log(`  con seoTitle (Yoast):       ${conTitle}`);
  console.log(`  con seoDescription (Yoast): ${conDesc}`);
  console.log(`  con ogImage (Yoast):        ${conOg}`);
  console.log(`  con altPath (hreflang):     ${conAlt}`);
  console.log(`  URLs sin par de traducción: ${sinPar.length} -> ${sinPar.join(', ')}`);
  if (sinMeta.length) {
    console.log(`  URLs sin meta Yoast (fallback al genérico): ${sinMeta.length}`);
    for (const p of sinMeta) console.log(`     ${p}`);
  }
}

main();
