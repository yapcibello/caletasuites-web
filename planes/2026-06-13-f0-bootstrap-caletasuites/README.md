# Plan F0 — Caleta Suites Tenerife (WordPress → Astro a producción)

> Estado tras el workflow `init-web-astro` (run `init-web-astro-20260612-194558`): web Astro funcional, réplica visual del WordPress actual, build 128 páginas (126 URLs originales intactas + 2 de accesibilidad), SEO/GEO/AAA/GTM baseline aplicados. Este plan recoge las **tareas humanas** pendientes para llegar a producción.

> [!CAUTION]
> **Regla innegociable**: URLs de producción inmutables — prohibido modificar URLs o crear 301; solo ampliar. Cualquier cambio de URL requiere confirmación explícita.

## Estado actual (qué está hecho)

- ✅ Monorepo Astro 5 (apps/www + packages/config + packages/seo), en GitHub `main`.
- ✅ 126 URLs migradas 1:1 (49 páginas + 77 posts, EN raíz + ES /es/), HTML Elementor embebido, 811 assets servidos, 4 iframes Icnea intactos.
- ✅ Chrome real (header/menú/footer EN+ES) + 19 CSS del tema para fidelidad visual.
- ✅ SEO: meta Yoast preservado, canonical self-ref, hreflang recíproco, JSON-LD LodgingBusiness, robots+sitemap.
- ✅ GEO: llms.txt EN/ES, JSON-LD enriquecido (aggregateRating 4.89/35 real, geo, NAP).
- ✅ AAA: declaraciones /accesibilidad/ + /en/accessibility/, semántica y foco.
- ✅ GTM-KBCWRTFS (real) + Consent Mode v2 denied + eventos reserva_click/contact_click.
- ✅ Script deploy Hestia (rsync+SSH) preparado.

## Tareas pendientes (humanas)

### Prioritario — bloquean producción

| # | Tarea | Responsable | Detalle |
|---|---|---|---|
| 1 | Facilitar acceso al Hestia VPS | Usuario | `WWW_SSH_HOST` y `WWW_REMOTE_DIR` en `.env` raíz. ¿Mismo VPS que el WP actual? Convención Hestia: `/home/<user>/web/caletasuitestenerife.com/public_html` |
| 2 | Decidir contraste del azul de marca | Usuario | #85A6C7 falla AA (2.54:1) para texto/botones. Opciones: (a) oscurecer a ~#5a7d9e, (b) texto oscuro sobre botones azules, (c) reservar azul a no-texto. Afecta a la declaración de accesibilidad |
| 3 | Decidir CMP / banner de cookies | Usuario | Consent Mode está en 'denied'; falta un banner visible para pasar a 'granted' (RGPD/AEPD). ¿Reusar el CMP del WP actual? El gancho `window.caletaConsentGranted()` ya está listo |
| 4 | Verificar contenedor GTM-KBCWRTFS | Usuario/SMedialab | Confirmar tag GA4 (423687681), triggers para reserva_click/contact_click, variables dataLayer, Consent Mode dentro del contenedor |

### Antes del cutover

| # | Tarea | Detalle |
|---|---|---|
| 5 | html-diff visual página a página | Comparar render Astro vs producción WP (curl/Playwright) para detectar desajustes finos de maquetado antes de sustituir |
| 6 | gh CLI o git remote | Ya conectado por SSH; instalar `gh` es opcional |
| 7 | Self-host de Montserrat | Ahora vía Google Fonts; self-host mejora CWV y privacidad |
| 8 | Smoke de reservas Icnea | Verificar que los 4 iframes cargan y permiten reservar en el dominio nuevo |

### Cutover y post-deploy

| # | Tarea | Detalle |
|---|---|---|
| 9 | Deploy a Hestia | `pnpm deploy:www` (tras tarea 1). Estrategia: carpeta paralela + swap para rollback rápido |
| 10 | Cutover DNS/vhost | Apuntar caletasuitestenerife.com al build Astro. El WP queda como rollback |
| 11 | Verificación oficial Google | PSI + CrUX post-deploy; reenviar sitemap en Search Console; vigilar cobertura 1-2 semanas |
| 12 | Monitor de continuidad | GA4 423687681 — confirmar que el tráfico sigue midiéndose tras el cambio |

## Trabajo posterior (no bloquea producción)

- Mejora editorial de textos (sin tocar maquetado) + SEO on-page por página.
- Bloques visibles GEO (cita rápida, FAQ) — requieren decisión de maquetado.
- SEM: landings para campañas Google Ads (skills google-ads/ads-quality-score instalados).
- Mejor momento para el cutover: la estacionalidad (memoria) marca suelo en mayo-junio y subida en otoño — migrar en el valle reduce riesgo.

## Artefactos del run

`.ypc/runs/init-web-astro-20260612-194558/artifacts/` — un informe por fase.
Scripts de migración re-ejecutables: `scripts/migrate/00-06`.

---

**Desarrollado con ❤️ por el equipo de SMedialab**
