// Tarea 3 — Transforma el export REST en ficheros .mdx con frontmatter Zod-válido.
//
// Reglas de clasificación:
//   - Galerías individuales de unidad (gallery-* / galeria-*) -> colección apartamentos.
//   - Posts -> colección posts (categoria derivada de la URL, idioma, fecha, heroImage).
//   - Resto de páginas (incluida la home) -> colección paginas.
//
// El HTML de Elementor NO se convierte a markdown: se preserva íntegro dentro de un
// componente <RawHtml> (set:html) para no perder el maquetado. La limpieza editorial
// es una fase posterior. El `link` REST es la URL inmutable (fuente del slug/idioma).

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { idiomaDeUrl, categoriaDePost, fileSlug, pathConSlash } from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..', '..');
const TMP = join(ROOT, 'tmp', 'wp-export');
const CONTENT = join(ROOT, 'apps', 'www', 'src', 'content');
// HTML crudo de Elementor: ficheros .html paralelos a las entradas. Se cargan con
// import.meta.glob('?raw') en la página Astro y se inyectan con set:html. Así se
// preserva el maquetado íntegro sin escapar backticks/${ } dentro del MDX.
const RAW = join(CONTENT, '_raw');

const cargar = (f) => JSON.parse(readFileSync(join(TMP, f), 'utf-8'));

// --- helpers -------------------------------------------------------------

/** Decodifica entidades HTML básicas para títulos/descripciones del frontmatter. */
function decode(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Texto plano de un excerpt HTML, recortado, para `descripcion`. */
function textoExcerpt(html = '', max = 300) {
  const t = decode(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Valor seguro para YAML entre comillas dobles. */
function yaml(v) {
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Primer iframe Icnea del HTML, si lo hay. */
function icneaUrl(html) {
  const m = html.match(/src=["']([^"']*icnea[^"']*)["']/i);
  return m ? m[1] : null;
}

/** featured image -> ruta local /wp-content/uploads/... (path preservado). */
function heroLocal(media, id) {
  const info = media[id];
  if (!info?.source_url) return null;
  return new URL(info.source_url).pathname; // /wp-content/uploads/...
}

/** Todas las URLs de uploads del contenido -> rutas locales (para reescribir el HTML). */
function reescribirUploads(html) {
  return html.replace(
    /https:\/\/caletasuitestenerife\.com(\/wp-content\/uploads\/[^\s"')\\]+)/g,
    (_, path) => path,
  );
}

// Galerías de unidad: slug EN -> metadatos de la unidad (dormitorios, planta, vista, tipo).
const APTOS = {
  'gallery-2-bedrooms-apartment-floor-0-sea-view': { dormitorios: 2, planta: 'floor-0', vista: 'sea', tipo: 'apartment' },
  'gallery-2-bedrooms-apartment-floor-0-mountain-view': { dormitorios: 2, planta: 'floor-0', vista: 'mountain', tipo: 'apartment' },
  'gallery-2-bedrooms-apartment-floor-1-seaview': { dormitorios: 2, planta: 'floor-1', vista: 'sea', tipo: 'apartment' },
  'gallery-2-bedrooms-apartment-floor-1-mountain-view': { dormitorios: 2, planta: 'floor-1', vista: 'mountain', tipo: 'apartment' },
  'gallery-3-bedrooms-apartment-floor-1-seaview': { dormitorios: 3, planta: 'floor-1', vista: 'sea', tipo: 'apartment' },
  'gallery-3-bedrooms-apartment-floor-1-mountain-view': { dormitorios: 3, planta: 'floor-1', vista: 'mountain', tipo: 'apartment' },
  'gallery-4-rooms-apartment-floor-1-mountain-view': { dormitorios: 4, planta: 'floor-1', vista: 'mountain', tipo: 'apartment' },
  'gallery-2-bedrooms-penthouse-large-terrace-mountain-view': { dormitorios: 2, planta: 'penthouse', vista: 'mountain', tipo: 'penthouse' },
  'gallery-2-bedrooms-penthouse-large-terrace-sea-and-mountain-view': { dormitorios: 2, planta: 'penthouse', vista: 'sea-mountain', tipo: 'penthouse' },
  'gallery-3-bedrooms-penthouse-large-terrace-seaview': { dormitorios: 3, planta: 'penthouse', vista: 'sea', tipo: 'penthouse' },
};
// Correlación slug ES -> slug EN de galería (mismo orden que sitemap/REST, por metadatos).
const APTOS_ES = {
  'galeria-apartamento-2-hab-planta-0-vista-mar': 'gallery-2-bedrooms-apartment-floor-0-sea-view',
  'galeria-apartamento-2-hab-planta-0-vista-montana': 'gallery-2-bedrooms-apartment-floor-0-mountain-view',
  'galeria-apartamento-2-hab-planta-1-vista-mar': 'gallery-2-bedrooms-apartment-floor-1-seaview',
  'galeria-apartamento-2-hab-planta-1-vista-montana': 'gallery-2-bedrooms-apartment-floor-1-mountain-view',
  'galeria-apartamento-3-hab-planta-1-vista-mar': 'gallery-3-bedrooms-apartment-floor-1-seaview',
  'galeria-apartamento-3-hab-planta-1-vista-montana': 'gallery-3-bedrooms-apartment-floor-1-mountain-view',
  'galeria-apartamento-4-hab-planta-1-vista-montana': 'gallery-4-rooms-apartment-floor-1-mountain-view',
  'galeria-atico-2-hab-gran-terraza-vista-montana': 'gallery-2-bedrooms-penthouse-large-terrace-mountain-view',
  'galeria-atico-2-hab-gran-terraza-vista-mar-y-montana': 'gallery-2-bedrooms-penthouse-large-terrace-sea-and-mountain-view',
  'galeria-atico-3-hab-gran-terraza-vista-mar': 'gallery-3-bedrooms-penthouse-large-terrace-seaview',
};

const esGaleriaUnidad = (slug) => Boolean(APTOS[slug] || APTOS_ES[slug]);
const metaApto = (slug) => APTOS[slug] || APTOS[APTOS_ES[slug]];

/** Extrae galería (array de rutas locales de imágenes) del HTML. */
function extraerGaleria(html) {
  const urls = [...html.matchAll(/\/wp-content\/uploads\/[^\s"')\\]+\.(?:jpe?g|png|webp)/gi)].map((m) => m[0]);
  return [...new Set(urls)];
}

// --- generación ----------------------------------------------------------

function frontmatterApto(item) {
  const slug = item.slug;
  const meta = metaApto(slug);
  const icnea = icneaUrl(item.content.rendered);
  const galeria = extraerGaleria(item.content.rendered);
  const lines = [
    `title: ${yaml(decode(item.title.rendered))}`,
    `slug: ${yaml(slug)}`,
    `path: ${yaml(pathConSlash(item.link))}`,
    `dormitorios: ${meta.dormitorios}`,
    `planta: ${yaml(meta.planta)}`,
    `vista: ${yaml(meta.vista)}`,
    `tipo: ${yaml(meta.tipo)}`,
    `idioma: ${yaml(idiomaDeUrl(item.link))}`,
    `galeria:`,
    ...galeria.map((g) => `  - ${yaml(g)}`),
  ];
  if (icnea) lines.push(`icneaUrl: ${yaml(icnea)}`);
  return lines.join('\n');
}

function frontmatterPagina(item) {
  return [
    `title: ${yaml(decode(item.title.rendered))}`,
    `slug: ${yaml(item.slug)}`,
    `path: ${yaml(pathConSlash(item.link))}`,
    `idioma: ${yaml(idiomaDeUrl(item.link))}`,
    `descripcion: ${yaml(textoExcerpt(item.excerpt?.rendered || item.yoast_head_json?.description || ''))}`,
  ].join('\n');
}

function frontmatterPost(item, media) {
  const cat = categoriaDePost(item.link) || 'to-do';
  const hero = heroLocal(media, item.featured_media);
  const lines = [
    `title: ${yaml(decode(item.title.rendered))}`,
    `slug: ${yaml(item.slug)}`,
    `path: ${yaml(pathConSlash(item.link))}`,
    `categoria: ${yaml(cat)}`,
    `fecha: ${item.date.slice(0, 10)}`,
    `idioma: ${yaml(idiomaDeUrl(item.link))}`,
    `descripcion: ${yaml(textoExcerpt(item.excerpt?.rendered || item.yoast_head_json?.description || ''))}`,
  ];
  if (hero) lines.push(`heroImage: ${yaml(hero)}`);
  return lines.join('\n');
}

// El HTML de Elementor se guarda en un fichero .html paralelo y se referencia por
// rawKey en el frontmatter. La página Astro lo resuelve con import.meta.glob('?raw')
// y lo inyecta con set:html. Mantiene el maquetado íntegro y evita escapar el HTML
// dentro del cuerpo MDX (que rompía con backticks/${ } de scripts inline).
async function escribir(dir, nombre, frontmatter, item) {
  const html = reescribirUploads(item.content.rendered);
  await mkdir(join(RAW, dir), { recursive: true });
  await writeFile(join(RAW, dir, `${nombre}.html`), html);
  // rawKey = nombre del fichero .html (la página lo casa contra el glob).
  const fm = `${frontmatter}\nrawKey: ${yaml(nombre)}`;
  const mdx = `---\n${fm}\n---\n`;
  await writeFile(join(CONTENT, dir, `${nombre}.mdx`), mdx);
}

async function main() {
  const pages = [...cargar('pages-en.json'), ...cargar('pages-es.json')];
  const posts = [...cargar('posts-en.json'), ...cargar('posts-es.json')];
  const media = cargar('media.json');

  // Limpia salidas previas (preserva .gitkeep).
  await rm(RAW, { recursive: true, force: true });
  for (const d of ['apartamentos', 'paginas', 'posts']) {
    await rm(join(CONTENT, d), { recursive: true, force: true });
    await mkdir(join(CONTENT, d), { recursive: true });
    await writeFile(join(CONTENT, d, '.gitkeep'), '');
  }

  let nApto = 0,
    nPag = 0,
    nPost = 0;

  for (const item of pages) {
    const lang = idiomaDeUrl(item.link);
    const base = fileSlug(item.slug || 'home');
    const nombre = `${base}-${lang}`;
    if (esGaleriaUnidad(item.slug)) {
      await escribir('apartamentos', nombre, frontmatterApto(item), item);
      nApto++;
    } else {
      await escribir('paginas', nombre, frontmatterPagina(item), item);
      nPag++;
    }
  }

  for (const item of posts) {
    const lang = idiomaDeUrl(item.link);
    const nombre = `${fileSlug(item.slug)}-${lang}`;
    await escribir('posts', nombre, frontmatterPost(item, media), item);
    nPost++;
  }

  console.log(`MDX generados -> apartamentos: ${nApto}, paginas: ${nPag}, posts: ${nPost}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
