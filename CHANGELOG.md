# Changelog — caletasuites-web

## [2026-06-14] — Contraste AAA + banner de cookies CMP

- **Contraste de color a AAA**: el azul de marca `#85A6C7` (2.54:1, fallaba) y los azules de foreground asociados (`#6996C4`, `#7892A4`, `#6288AA`, gris móvil `#55606a`) se oscurecieron para que **todo el texto alcance ≥ 7:1** (AAA). Esquema: contenido/token/header-sticky/footer-hover → `#37597C` (7.29:1); hover de header sobre blanco → `#2A4A6B` (9.17:1); enlace activo del footer sobre oscuro → `#A9C5DE` (9.21:1). Se preserva el azul claro sobre el footer oscuro y el hover del overlay sobre el hero. ~656 ocurrencias en `src/content/_raw_css/*.css` + `packages/config/tokens/index.cjs` + `Header.astro` + footer chrome EN/ES. **Desviación autorizada de la réplica visual** registrada en `docs/deviations.md`.
- **Declaración de accesibilidad** (`/accesibilidad/` y `/en/accessibility/`) actualizada: de «AA parcial, objetivo AAA» a «**plenamente conforme AA + contraste de color AAA**»; limitación del azul marcada como resuelta; `accessibilitySummary` del Layout (JSON-LD site-wide) actualizado; fecha 2026-06-14.
- **Banner de cookies (CMP) RGPD/AEPD**: nuevo `src/components/CookieBanner.astro` (bilingüe EN/ES, `role="dialog"`, rechazo tan visible como aceptar, área táctil ≥44px, contraste AAA, enlace a política de cookies). Conecta con el Consent Mode v2 del `<head>` y el gancho `window.caletaConsentGranted()`; restaura la elección previa en cada carga; expone `window.caletaCookiePrefs()` para revocar. Se renderiza solo si hay `PUBLIC_GTM_ID`. Integrado en `Layout.astro`.

## [2026-06-14] — Deploy FTP implementado (patrón smedialab-web)

- **`scripts/deploy-ftp.sh`**: script de deploy completo. ZIP desde `apps/www/dist/` → lftp upload → PHP trigger en `_deploy/` (H-87: nombre+token aleatorios) → extractTo + manifest cleanup (cero huérfanos) + smoke loopback + smoke externo. Usar con `pnpm deploy:www` o `pnpm deploy:www --build`.
- **`scripts/deploy-swap.php.template`**: plantilla PHP del trigger. Adapta el patrón smedialab: PHP en `_deploy/` (subdir temporal) en lugar de `api/` (static site sin backend PHP). Preserve list vacía (sin `api/config.local.php`). Smoke URLs: `/` (grep "Caleta"), `/apartments/`, `/sitemap-index.xml` (grep "sitemapindex").
- **`scripts/ftp-check.sh`**: verificación de conexión FTP antes del primer deploy. Para en 1 fallo (anti-fail2ban).
- **`.env.example`** actualizado con variables FTP (`FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_REMOTE_DIR`, `DEPLOY_BASE_URL`). Variables SSH eliminadas.
- **`package.json`**: `deploy:www` → `bash scripts/deploy-ftp.sh`; añadido `deploy:ftp-check`.
- **`proyecto/despliegue.md`**: documentación completa del flujo FTP, variables, smoke test, rollback y cutover DNS.

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
