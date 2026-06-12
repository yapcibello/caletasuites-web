# Changelog — caletasuites-web

## [2026-06-12] — Bootstrap del proyecto (workflow init-web-astro, fases 1-4 parcial)

- **Preflight y discovery aprobados**: entorno verificado (node 26, pnpm 9.15, git; falta gh, no bloqueante). 9 decisiones capturadas en `.ypc/runs/init-web-astro-20260612-194558/discovery.json` — slug `caletasuites`, solo-www, réplica visual exacta del WP actual, EN raíz + `/es/`, hosting hestia-vps, migración vía REST API.
- **Regla innegociable registrada**: URLs de producción inmutables, prohibidas redirecciones 301 (CLAUDE.md + memoria persistente).
- **Estructura del monorepo creada y subida a GitHub** (`main`): apps/www (Astro 5.18.2, i18n EN/ES, trailingSlash always, 3 Content Collections con Zod, Layout con GTM condicional y JSON-LD LodgingBusiness, esqueleto AAA) + packages/config (preset Tailwind con tokens provisionales) + packages/seo. `pnpm install` y build de validación OK.
- **Migración WP iniciada (a medias)**: scripts `scripts/migrate/` (inventario, export REST, transformación), export completo de páginas y posts EN/ES a `tmp/wp-export/`, `@astrojs/mdx` integrado. Pendiente: generar MDX, assets, routing, tokens reales — ver plan de continuación.
- **Blueprint ypc** inicializado y rellenado con contenido real.
