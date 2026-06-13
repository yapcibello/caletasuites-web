import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// Mapa de traducciones EN↔ES generado desde el frontmatter de las colecciones por
// scripts/migrate/06-mapa-traducciones.mjs. Clave = path inmutable (trailing slash).
// Lo usamos en serialize() para inyectar los alternates hreflang REALES, ya que el
// par EN/ES casi nunca comparte slug y el i18n automático del sitemap no lo resuelve.
import traducciones from '../../scripts/migrate/traducciones.json' with { type: 'json' };

const SITE = 'https://caletasuitestenerife.com';

// Normaliza una URL absoluta del sitemap a su pathname con trailing slash, para
// casarla contra las claves del mapa de traducciones (que son pathnames).
function pathnameDe(url) {
  return new URL(url).pathname;
}

// Configuración de la app www de Caleta Suites Tenerife.
//
// REGLA INNEGOCIABLE: trailingSlash 'always' — la web WordPress actual usa trailing
// slash en todas sus URLs. Ninguna URL de producción se modifica (sin 301).
//
// i18n nativo de Astro replicando WPML actual: inglés en raíz (/), español bajo
// /es/, x-default = en. prefixDefaultLocale false → el inglés NO lleva prefijo /en/.
export default defineConfig({
  site: 'https://caletasuitestenerife.com',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      // i18n automático DESACTIVADO a propósito: asume que el par EN/ES comparte
      // slug (prefijando /es/), pero 124 de 126 URLs tienen slug distinto entre
      // idiomas (p. ej. /apartments/ ↔ /es/apartamentos/). Generaría alternates
      // erróneos o ausentes. En su lugar inyectamos los `links` reales en serialize().
      serialize(item) {
        const pathname = pathnameDe(item.url);
        const entrada = traducciones[pathname];
        // Sin entrada en el mapa: dejamos el item tal cual (sin alternates).
        if (!entrada) return item;

        // self + par de traducción (si existe). hreflang = idioma del propio item.
        const links = [{ lang: entrada.idioma, url: item.url }];
        if (entrada.altPath) {
          const otroIdioma = entrada.idioma === 'es' ? 'en' : 'es';
          const urlAlt = new URL(entrada.altPath, SITE).href;
          links.push({ lang: otroIdioma, url: urlAlt });
          // x-default = la URL en inglés del par.
          const urlEn = entrada.idioma === 'en' ? item.url : urlAlt;
          links.push({ lang: 'x-default', url: urlEn });
        }
        item.links = links;
        return item;
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    // Hot-reload cross-package + sin pre-bundling de los paquetes del workspace.
    optimizeDeps: {
      exclude: ['@caletasuites/config', '@caletasuites/seo'],
    },
    ssr: {
      noExternal: ['@caletasuites/seo'],
    },
  },
});
