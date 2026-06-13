# Changelog — caletasuites-web

## [2026-06-13] — Workflow init-web-astro COMPLETADO (fases 4-14)

- **Migración WP→Astro completa**: 126 URLs migradas 1:1 (49 páginas + 77 posts, EN raíz + ES /es/), HTML Elementor embebido (set:html), 811 assets servidos con paths inmutables, 4 iframes Icnea intactos. Routing catch-all sirviendo cada URL exacta. Tokens visuales reales extraídos del kit Elementor (azules + Montserrat).
- **Chrome global real**: header/menú/footer EN+ES extraídos del HTML en vivo (no venían en el REST) + 19 CSS del tema para fidelidad visual.
- **SEO baseline**: meta Yoast preservado (126/126), canonical self-ref, hreflang recíproco EN↔ES vía serialize, JSON-LD LodgingBusiness/Apartment/BlogPosting, robots+sitemap.
- **GEO baseline**: llms.txt EN/ES, JSON-LD enriquecido (aggregateRating 4.89/35 verificado, geo, NAP) sin alterar maquetado.
- **AAA baseline**: declaraciones /accesibilidad/ + /en/accessibility/ (URLs nuevas), JSON-LD accessibility, semántica/foco. Limitación de contraste del azul documentada.
- **GTM/GA4**: contenedor real GTM-KBCWRTFS + Consent Mode v2 (denied) + eventos reserva_click/contact_click. Script deploy Hestia preparado.
- **33 skills** instalados; verificación PASS WITH WARNINGS (128 páginas, 126 URLs intactas); plan F0 generado.

## [2026-06-12] — Bootstrap del proyecto (workflow init-web-astro, fases 1-4 parcial)

- **Preflight y discovery aprobados**: entorno verificado (node 26, pnpm 9.15, git; falta gh, no bloqueante). 9 decisiones capturadas en `.ypc/runs/init-web-astro-20260612-194558/discovery.json` — slug `caletasuites`, solo-www, réplica visual exacta del WP actual, EN raíz + `/es/`, hosting hestia-vps, migración vía REST API.
- **Regla innegociable registrada**: URLs de producción inmutables, prohibidas redirecciones 301 (CLAUDE.md + memoria persistente).
- **Estructura del monorepo creada y subida a GitHub** (`main`): apps/www (Astro 5.18.2, i18n EN/ES, trailingSlash always, 3 Content Collections con Zod, Layout con GTM condicional y JSON-LD LodgingBusiness, esqueleto AAA) + packages/config (preset Tailwind con tokens provisionales) + packages/seo. `pnpm install` y build de validación OK.
- **Migración WP iniciada (a medias)**: scripts `scripts/migrate/` (inventario, export REST, transformación), export completo de páginas y posts EN/ES a `tmp/wp-export/`, `@astrojs/mdx` integrado. Pendiente: generar MDX, assets, routing, tokens reales — ver plan de continuación.
- **Blueprint ypc** inicializado y rellenado con contenido real.
