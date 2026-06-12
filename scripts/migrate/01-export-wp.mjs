// Tarea 2 — Export completo de la REST API de WordPress (pages + posts, en + es).
// Descarga cada idioma por separado con ?lang= (WPML no expone wpml_translations en
// la REST aquí; el filtrado por idioma es la vía fiable). El campo `link` de cada
// objeto es la URL de producción inmutable (ya trae /es/ y slugs traducidos).
//
// Salida:
//   tmp/wp-export/pages-en.json, pages-es.json, posts-en.json, posts-es.json (crudos)
//   tmp/wp-export/media.json (mapa id -> source_url de featured_media)
//   scripts/migrate/inventario-urls.json se RECONSTRUYE aquí como inventario real
//   bilingüe (el sitemap de Yoast solo lista EN; ver nota en el reporte).

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { API, getAllPaginated, getJSON, idiomaDeUrl, pathConSlash, categoriaDePost } from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dir, '..', '..', 'tmp', 'wp-export');

const FIELDS_PAGE = 'id,slug,link,title,content,excerpt,date,modified,featured_media,template,yoast_head_json,parent';
const FIELDS_POST = 'id,slug,link,title,content,excerpt,date,modified,featured_media,categories,yoast_head_json';

async function exportar(endpoint, lang, fields) {
  console.log(`Descargando ${endpoint} (${lang})...`);
  const items = await getAllPaginated(endpoint, lang, { fields });
  const file = join(TMP, `${endpoint}-${lang}.json`);
  await writeFile(file, JSON.stringify(items, null, 2));
  console.log(`  ${items.length} ${endpoint} (${lang}) -> ${file}`);
  return items;
}

/** Resuelve el source_url de un conjunto de IDs de media (featured images). */
async function exportarMedia(ids) {
  const mapa = {};
  const unicos = [...new Set(ids.filter((id) => id && id > 0))];
  console.log(`Resolviendo ${unicos.length} featured media...`);
  // La REST permite include[]=id1,id2 para batches de 100.
  for (let i = 0; i < unicos.length; i += 100) {
    const lote = unicos.slice(i, i + 100);
    const params = new URLSearchParams({ per_page: '100', _fields: 'id,source_url,media_details,alt_text' });
    lote.forEach((id) => params.append('include[]', String(id)));
    const { data } = await getJSON(`${API}/media?${params}`);
    for (const m of data) mapa[m.id] = { source_url: m.source_url, alt: m.alt_text || '' };
  }
  await writeFile(join(TMP, 'media.json'), JSON.stringify(mapa, null, 2));
  console.log(`  ${Object.keys(mapa).length} media -> media.json`);
  return mapa;
}

async function main() {
  await mkdir(TMP, { recursive: true });

  const pagesEn = await exportar('pages', 'en', FIELDS_PAGE);
  const pagesEs = await exportar('pages', 'es', FIELDS_PAGE);
  const postsEn = await exportar('posts', 'en', FIELDS_POST);
  const postsEs = await exportar('posts', 'es', FIELDS_POST);

  const todos = [...pagesEn, ...pagesEs, ...postsEn, ...postsEs];
  await exportarMedia(todos.map((x) => x.featured_media));

  // Reconstruir inventario real bilingüe desde los `link` de la REST.
  const mapa = new Map();
  const push = (item, tipo) => {
    const path = pathConSlash(item.link);
    if (mapa.has(path)) return;
    mapa.set(path, {
      id: item.id,
      url: item.link,
      path,
      tipo,
      idioma: idiomaDeUrl(item.link),
      slug: item.slug,
      categoria: tipo === 'post' ? categoriaDePost(item.link) : null,
    });
  };
  pagesEn.forEach((p) => push(p, 'page'));
  pagesEs.forEach((p) => push(p, 'page'));
  postsEn.forEach((p) => push(p, 'post'));
  postsEs.forEach((p) => push(p, 'post'));

  const inventario = [...mapa.values()].sort((a, b) => a.path.localeCompare(b.path));
  const resumen = {
    total: inventario.length,
    porTipo: {
      page: inventario.filter((r) => r.tipo === 'page').length,
      post: inventario.filter((r) => r.tipo === 'post').length,
    },
    porIdioma: {
      en: inventario.filter((r) => r.idioma === 'en').length,
      es: inventario.filter((r) => r.idioma === 'es').length,
    },
  };

  await writeFile(
    join(__dir, 'inventario-urls.json'),
    JSON.stringify(
      {
        generadoEl: new Date().toISOString(),
        fuente: 'REST API por idioma (link = URL inmutable). El sitemap Yoast solo lista EN.',
        resumen,
        urls: inventario,
      },
      null,
      2,
    ),
  );
  console.log('Inventario REAL bilingüe reconstruido:', resumen);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
