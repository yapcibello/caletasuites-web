// Genera scripts/migrate/traducciones.json: el mapa de traducciones EN↔ES que
// alimenta los alternates hreflang del sitemap (apps/www/astro.config.mjs).
//
// POR QUE UN JSON INTERMEDIO Y NO leer las colecciones en serialize():
//   @astrojs/sitemap.serialize(item) NO tiene acceso al runtime de astro:content
//   (getCollection sólo vive dentro de componentes/endpoints, no en la config).
//   Generamos el mapa leyendo el frontmatter de los MDX y lo importamos como JSON
//   estático en la config. Fuente de verdad: el campo `path` (URL inmutable de
//   producción), `altPath` (par de traducción) e `idioma` de cada entrada.
//
// FORMA del JSON (clave = path inmutable con trailing slash):
//   {
//     "/apartments/":        { "idioma": "en", "altPath": "/es/apartamentos/" },
//     "/es/apartamentos/":   { "idioma": "es", "altPath": "/apartments/" },
//     ...
//   }
// Entradas sin par de traducción se incluyen con altPath ausente.
//
// Uso: node scripts/migrate/06-mapa-traducciones.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, '..', '..');
const DIR_CONTENT = join(RAIZ, 'apps', 'www', 'src', 'content');
const SALIDA = join(__dirname, 'traducciones.json');

// Recorre recursivamente buscando ficheros .mdx (ignora _raw/, que es HTML).
function listarMdx(dir) {
  const out = [];
  for (const nombre of readdirSync(dir)) {
    if (nombre === '_raw') continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      out.push(...listarMdx(ruta));
    } else if (nombre.endsWith('.mdx')) {
      out.push(ruta);
    }
  }
  return out;
}

// Extrae un campo de string del frontmatter por regex. El frontmatter de estas
// colecciones es plano (campo: "valor"), no requiere parser YAML completo.
function campo(contenido, clave) {
  const m = contenido.match(new RegExp(`^${clave}:\\s*"([^"]*)"`, 'm'));
  return m ? m[1] : undefined;
}

const ficheros = listarMdx(DIR_CONTENT);
const mapa = {};
let conPar = 0;
let sinPar = 0;

for (const fichero of ficheros) {
  const contenido = readFileSync(fichero, 'utf8');
  const path = campo(contenido, 'path');
  const idioma = campo(contenido, 'idioma');
  const altPath = campo(contenido, 'altPath');

  if (!path || !idioma) {
    throw new Error(`Frontmatter incompleto (falta path/idioma) en ${fichero}`);
  }
  if (mapa[path]) {
    throw new Error(`Path duplicado "${path}" en ${fichero}`);
  }

  mapa[path] = altPath ? { idioma, altPath } : { idioma };
  if (altPath) conPar++;
  else sinPar++;
}

// Orden estable de claves para diffs limpios.
const ordenado = {};
for (const k of Object.keys(mapa).sort()) ordenado[k] = mapa[k];

writeFileSync(SALIDA, JSON.stringify(ordenado, null, 2) + '\n', 'utf8');

console.log(`Mapa de traducciones generado: ${SALIDA}`);
console.log(`  Entradas: ${ficheros.length} (con par: ${conPar}, sin par: ${sinPar})`);
