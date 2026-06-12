// Utilidades compartidas por los scripts de migración de Caleta Suites.
// Fuente: WordPress 7.0 + WPML (en/es) en https://caletasuitestenerife.com
//
// REGLA INNEGOCIABLE: las URLs de producción son INMUTABLES. La fuente de verdad
// de cada URL es el campo `link` que devuelve la REST API de WordPress (ya incluye
// el prefijo /es/ y los slugs traducidos de WPML). Nunca derivamos URLs nosotros.

import { setTimeout as sleep } from 'node:timers/promises';

export const BASE = 'https://caletasuitestenerife.com';
export const API = `${BASE}/wp-json/wp/v2`;

// Pausa entre requests para no saturar el servidor (somos los dueños, pero cortés).
export const DELAY_MS = 500;

/** Idioma del sitio derivado de una URL: ES si va bajo /es/, EN en caso contrario. */
export function idiomaDeUrl(link) {
  const path = new URL(link).pathname;
  return path.startsWith('/es/') ? 'es' : 'en';
}

/** Pathname con trailing slash garantizado (las URLs de producción siempre lo llevan). */
export function pathConSlash(link) {
  const path = new URL(link).pathname;
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * Mapea un post a la categoría del schema Astro (to-do | gastronomy | to-do-news)
 * a partir del segmento de URL, que es idéntico en ambos idiomas a nivel de schema:
 *   EN: /to-do/.. /gastronomy/.. /to-do-news/..
 *   ES: /es/que-hacer/.. /es/gastronomia/.. /es/noticias-que-hacer/..
 * El enum del schema usa los slugs EN como clave canónica.
 */
export function categoriaDePost(link) {
  const path = new URL(link).pathname.replace(/^\/es\//, '/');
  if (path.startsWith('/to-do-news/') || path.startsWith('/noticias-que-hacer/')) return 'to-do-news';
  if (path.startsWith('/gastronomy/') || path.startsWith('/gastronomia/')) return 'gastronomy';
  if (path.startsWith('/to-do/') || path.startsWith('/que-hacer/')) return 'to-do';
  return null; // El llamador decide qué hacer con un post sin categoría reconocida.
}

/** fetch con reintentos sencillos y pausa de cortesía. */
export async function getJSON(url, { retries = 3 } = {}) {
  for (let intento = 1; intento <= retries; intento++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'caletasuites-migracion/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      const total = res.headers.get('x-wp-total');
      const totalPages = res.headers.get('x-wp-totalpages');
      const data = await res.json();
      await sleep(DELAY_MS);
      return { data, total: total ? Number(total) : null, totalPages: totalPages ? Number(totalPages) : null };
    } catch (err) {
      if (intento === retries) throw err;
      await sleep(DELAY_MS * intento * 2);
    }
  }
}

/** Descarga TODAS las páginas de un endpoint REST paginado para un idioma dado. */
export async function getAllPaginated(endpoint, lang, { perPage = 100, fields } = {}) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const params = new URLSearchParams({ per_page: String(perPage), page: String(page), lang });
    if (fields) params.set('_fields', fields);
    const url = `${API}/${endpoint}?${params}`;
    const { data, totalPages: tp } = await getJSON(url);
    if (tp) totalPages = tp;
    items.push(...data);
    page++;
  } while (page <= totalPages);
  return items;
}

/** Slugify para nombres de fichero MDX seguros (conserva el slug WP cuando es válido). */
export function fileSlug(slug) {
  return String(slug)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
