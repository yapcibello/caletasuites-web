#!/usr/bin/env node
// Verificacion de cobertura de URLs tras el build (sub-fase 4c).
//
// REGLA INNEGOCIABLE: cada uno de los 126 `path` del inventario debe existir en
// dist/ EXACTAMENTE en su ruta (con trailing slash). Este script compara el
// inventario contra los ficheros index.html generados y reporta la cobertura.
//
// Uso: node scripts/migrate/04-verify-urls.mjs
//   - Lee scripts/migrate/inventario-urls.json (fuente de verdad: campo `path`).
//   - Comprueba la existencia de apps/www/dist/<path>/index.html por cada entrada.
//   - Sale con codigo 1 si falta alguna URL (cobertura < total).

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Raiz del repo: scripts/migrate/ -> ../../
const repoRoot = path.resolve(__dirname, '..', '..');
const inventarioPath = path.join(__dirname, 'inventario-urls.json');
const distDir = path.join(repoRoot, 'apps', 'www', 'dist');

// Convierte un `path` de produccion en la ruta del index.html esperado en dist/.
// "/" -> dist/index.html ; "/es/galeria/" -> dist/es/galeria/index.html
function rutaDist(pathnameProd) {
  const limpio = pathnameProd.replace(/^\/+/, '').replace(/\/+$/, '');
  return limpio === ''
    ? path.join(distDir, 'index.html')
    : path.join(distDir, limpio, 'index.html');
}

async function main() {
  const inventario = JSON.parse(await readFile(inventarioPath, 'utf8'));
  const urls = inventario.urls;
  const total = urls.length;

  const faltantes = [];
  for (const entrada of urls) {
    if (!existsSync(rutaDist(entrada.path))) {
      faltantes.push(entrada.path);
    }
  }

  const cobertura = total - faltantes.length;
  console.log(`\nCobertura de URLs: ${cobertura}/${total}`);

  if (faltantes.length > 0) {
    console.error(`\nFaltan ${faltantes.length} URL(s) en dist/:`);
    for (const p of faltantes) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log('OK: todas las URLs del inventario existen en dist/.\n');
}

main().catch((err) => {
  console.error('Error en la verificacion:', err);
  process.exit(1);
});
