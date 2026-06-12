// Tarea 1 — Inventario de URLs canónicas desde los sitemaps de Yoast.
// Descarga page-sitemap.xml y post-sitemap.xml, deduplica y clasifica cada URL
// (tipo page|post, idioma en|es, slug) → scripts/migrate/inventario-urls.json
//
// Las URLs del sitemap SON las URLs de producción inmutables. No se modifican.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BASE, getJSON, idiomaDeUrl, pathConSlash } from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));

const SITEMAPS = [
  { url: `${BASE}/page-sitemap.xml`, tipo: 'page' },
  { url: `${BASE}/post-sitemap.xml`, tipo: 'post' },
];

/** Extrae los <loc> de un sitemap XML (sin dependencias de parser). */
function extraerLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function fetchXml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'caletasuites-migracion/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

async function main() {
  const mapa = new Map(); // path -> registro (dedup por pathname con slash)

  for (const { url, tipo } of SITEMAPS) {
    const xml = await fetchXml(url);
    for (const loc of extraerLocs(xml)) {
      const path = pathConSlash(loc);
      if (mapa.has(path)) continue; // dedup
      const idioma = idiomaDeUrl(loc);
      // slug = último segmento no vacío del path (sin /es/ ni categoría).
      const segs = path.split('/').filter(Boolean);
      const slug = segs.length ? segs[segs.length - 1] : ''; // '' = home
      mapa.set(path, { url: loc, path, tipo, idioma, slug });
    }
  }

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

  const out = join(__dir, 'inventario-urls.json');
  await writeFile(out, JSON.stringify({ generadoEl: new Date().toISOString(), resumen, urls: inventario }, null, 2));
  console.log('Inventario escrito en', out);
  console.log(resumen);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
