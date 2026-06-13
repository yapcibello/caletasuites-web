// SUB-FASE 4b — Descarga de assets de uploads desde producción.
//
// Recorre TODO el HTML crudo (_raw/**/*.html) y los frontmatter de los MDX
// (galeria, heroImage), extrae cada referencia a /wp-content/uploads/...,
// deduplica y descarga el binario desde producción preservando el path EXACTO.
//
// REGLA INNEGOCIABLE (lib.mjs): las URLs de producción son inmutables. Los assets
// se sirven bajo el mismo path en Astro (apps/www/public<path>), así que NO se
// renombra, redimensiona ni reorganiza nada: copia byte a byte del path original.
//
// Gotcha crítico (logopeda 2026-05-05): las URLs pueden venir percent-encoded
// (espacios %20, acentos, etc.). En disco hay que guardar el path DECODIFICADO a
// UTF-8 (decodeURIComponent), porque es lo que Astro servirá como ruta estática y
// lo que el navegador resolverá. La descarga, en cambio, se hace contra la URL
// re-encodeada para que el servidor la entienda. Así una request al path original
// (venga encodeada o no) resuelve siempre al fichero en disco.

import { setTimeout as sleep } from 'node:timers/promises';
import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { BASE } from './lib.mjs';

// Raíces relativas a la raíz del monorepo (cwd al ejecutar `node scripts/migrate/...`).
const RAW_DIR = 'apps/www/src/content/_raw';
const CONTENT_DIR = 'apps/www/src/content';
const PUBLIC_DIR = 'apps/www/public';

const DELAY_MS = 350; // Pausa de cortesía entre descargas (~300-400ms pedido).

// Extensiones permitidas: imágenes y vídeos auto-alojados. Los embeds externos
// (YouTube/Vimeo) no llevan /wp-content/uploads/, así que quedan fuera por defecto.
const EXT_PERMITIDAS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif', // imágenes
  'mp4', 'webm',                                       // vídeos
]);

// Captura referencias a uploads, tanto absolutas (con dominio) como locales.
// El charset evita comillas, paréntesis y espacios sin escapar (delimitadores
// típicos en HTML/CSS/markdown). Los %XX y caracteres unicode sí se aceptan.
const RE_UPLOADS = /(?:https?:\/\/[^"'\s)]*)?\/wp-content\/uploads\/[^"'\s)\\]+/g;

/** Recorre un directorio recursivamente devolviendo rutas de ficheros que cumplen el filtro. */
async function listarFicheros(dir, filtro) {
  const out = [];
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const ent of entradas) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await listarFicheros(full, filtro)));
    } else if (filtro(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Normaliza una referencia a un path /wp-content/uploads/... limpio.
 * - Quita el dominio si la URL era absoluta.
 * - Recorta querystring (?ver=...) y fragmento (#...).
 * - DECODIFICA percent-encoding a UTF-8 (lo que vive en disco).
 * Devuelve null si no es un asset de upload con extensión permitida.
 */
function normalizarPath(ref) {
  let p = ref;
  // Si trae dominio, quedarnos con el pathname.
  const idx = p.indexOf('/wp-content/uploads/');
  if (idx === -1) return null;
  p = p.slice(idx);
  // Cortar query y fragmento.
  p = p.split('?')[0].split('#')[0];
  // Decodificar percent-encoding (puede fallar si hay % literal mal formado).
  let decoded;
  try {
    decoded = decodeURIComponent(p);
  } catch {
    decoded = p; // % literal mal formado: lo dejamos tal cual.
  }
  // Validar extensión.
  const ext = decoded.split('.').pop()?.toLowerCase() ?? '';
  if (!EXT_PERMITIDAS.has(ext)) return null;
  return decoded;
}

/** Extrae todas las referencias a uploads de un texto y las normaliza. */
function extraerDeTexto(texto, acc) {
  const matches = texto.match(RE_UPLOADS);
  if (!matches) return;
  for (const m of matches) {
    const p = normalizarPath(m);
    if (p) acc.add(p);
  }
}

/**
 * Convierte un path decodificado (lo que vive en disco) en la URL de descarga
 * contra producción, re-encodeando cada segmento para que el servidor lo entienda.
 */
function urlDeDescarga(decodedPath) {
  const segmentos = decodedPath.split('/').map((s) => encodeURIComponent(s));
  return `${BASE}${segmentos.join('/')}`;
}

/** Descarga una URL a un fichero. Reintenta 1 vez. Devuelve {ok, status, bytes}. */
async function descargar(url, destino) {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'caletasuites-migracion/1.0' } });
      if (!res.ok) {
        if (intento === 2) return { ok: false, status: res.status, bytes: 0 };
        await sleep(DELAY_MS * 2);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, buf);
      return { ok: true, status: res.status, bytes: buf.length };
    } catch (err) {
      if (intento === 2) return { ok: false, status: `ERR:${err.message}`, bytes: 0 };
      await sleep(DELAY_MS * 2);
    }
  }
}

async function main() {
  console.log('== Recopilando referencias a /wp-content/uploads/ ==');
  const refs = new Set();

  // 1. HTML crudo.
  const htmls = await listarFicheros(RAW_DIR, (n) => n.endsWith('.html'));
  for (const f of htmls) {
    extraerDeTexto(await readFile(f, 'utf8'), refs);
  }

  // 2. Frontmatter de los MDX (galeria, heroImage). Recorremos el fichero entero:
  //    la regex solo casa con uploads, así que da igual frontmatter vs cuerpo.
  const mdxs = await listarFicheros(CONTENT_DIR, (n) => n.endsWith('.mdx'));
  for (const f of mdxs) {
    extraerDeTexto(await readFile(f, 'utf8'), refs);
  }

  const paths = [...refs].sort();
  console.log(`HTML escaneados: ${htmls.length} | MDX escaneados: ${mdxs.length}`);
  console.log(`Assets únicos detectados: ${paths.length}\n`);

  // 3. Descargar.
  let okCount = 0;
  let skipCount = 0;
  let bytesOk = 0;
  const fallos = [];

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const destino = path.join(PUBLIC_DIR, p); // p ya está decodificado → disco UTF-8.

    // Idempotente: saltar si ya existe con tamaño > 0.
    if (existsSync(destino)) {
      const st = await stat(destino);
      if (st.size > 0) {
        skipCount++;
        continue;
      }
    }

    const url = urlDeDescarga(p);
    const r = await descargar(url, destino);
    const n = `[${i + 1}/${paths.length}]`;
    if (r.ok) {
      okCount++;
      bytesOk += r.bytes;
      if ((i + 1) % 25 === 0) console.log(`${n} OK acumulado (último: ${p})`);
    } else {
      fallos.push({ path: p, status: r.status });
      console.warn(`${n} FALLO ${r.status} :: ${p}`);
    }
    await sleep(DELAY_MS);
  }

  // 4. MB totales en uploads.
  const uploadsRoot = path.join(PUBLIC_DIR, 'wp-content', 'uploads');
  let totalBytes = 0;
  if (existsSync(uploadsRoot)) {
    const all = await listarFicheros(uploadsRoot, () => true);
    for (const f of all) totalBytes += (await stat(f)).size;
  }

  console.log('\n========== RESUMEN ==========');
  console.log(`Detectados (únicos): ${paths.length}`);
  console.log(`Descargados OK ahora: ${okCount}`);
  console.log(`Saltados (ya existían): ${skipCount}`);
  console.log(`Fallidos/404: ${fallos.length}`);
  console.log(`MB en public/wp-content/uploads/: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  if (fallos.length) {
    console.log('\n--- FALLOS ---');
    for (const f of fallos) console.log(`  ${f.status}\t${f.path}`);
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
