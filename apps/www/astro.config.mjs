import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

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
      // i18n del sitemap: declara el mapa de idiomas para alternates hreflang.
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
        },
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
