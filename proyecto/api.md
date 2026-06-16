# API — caletasuites-web

No aplica — sitio estático Astro sin API propia.

Referencias de APIs externas consumidas:

- **WordPress REST API del sitio origen** (`https://caletasuitestenerife.com/wp-json/wp/v2/`): solo lectura, usada por `scripts/migrate/01-export-wp.mjs` durante la migración (pages, posts, media, en/es vía WPML).
- **Icnea**: motor de reservas embebido por iframe en las páginas; no se integra por API — los iframes se preservan tal cual del sitio original.

## Medición — GTM / GA4 (Consent Mode v2)

- **Contenedor**: `GTM-KBCWRTFS` (real de producción; en `apps/www/.env` → `PUBLIC_GTM_ID`).
- **Propiedad GA4**: `423687681` (el tag GA4 vive DENTRO del contenedor GTM; el sitio NO inyecta `gtag` directo aparte).
- **Consent Mode v2**: default `denied` para analytics/ads en el `<head>` (`Layout.astro`); el banner de cookies (`CookieBanner.astro`) lo eleva a `granted` al aceptar vía `window.caletaConsentGranted()`.
- **Eventos enviados al dataLayer** (`src/scripts/analytics.ts`):
  - `reserva_click` — variables: `pagina_origen`, `content_group`, `destino`.
  - `contact_click` — variables: `pagina_origen`, `content_group`, `metodo`, `destino`.

### Checklist de verificación del contenedor — VERIFICADO vía MCP (2026-06-14)

> Verificado con el MCP `gtm_*`. accountId `6217092864`, containerId `177443462`,
> workspace `5` (Default), versión live **v4**. **Conclusión: el contenedor es el
> HEREDADO del WordPress; NO ha sido adaptado a la implementación Astro nueva.**

- [x] **Tag GA4 Configuration** presente — tag 36 «Google Analytics GA4» (tipo `googtag`/Google Tag), `tagId = {{GA4 - ID}} = G-Z7B9KJKKYG`. **Confirmado pertenece a la propiedad `423687681`** (stream web `caletasuitestenerife.com`, dataStream 6650215375). Dispara en *Initialization - All Pages* (`2147479553`), `send_page_view=true`, bloqueado por *Spam de Referencia* (56). ✔
- [ ] **Triggers de eventos personalizados** `reserva_click` / `contact_click` (Custom Event) — **AUSENTES**. Solo hay triggers WP de auto-evento (`linkClick`, `pageview`). ✘
- [ ] **Tags GA4 Event** para `reserva_click` / `contact_click` — **AUSENTES**. Los tags GA4 Event existentes (Descarga, Whatsapp, Email, Enlaces internos/externos, Facebook, Instagram) cuelgan de triggers `linkClick` WP, no de los eventos del dataLayer Astro. ✘
- [ ] **Variables de capa de datos** `pagina_origen`, `content_group`, `destino`, `metodo` — **AUSENTES** como *Data Layer Variables*. No existen; las variables actuales son WP (`aev`, `remm` sobre URL). ✘
- [ ] **Consent Mode v2** — tag 36 `consentSettings.consentStatus = "notSet"`. **NO configurado**. El contenedor usa el gating de cookies WP antiguo (`Cookies - Valor - Activar etiquetas` / `Cookies - Nombre - LOPD`), no `analytics_storage`. Desalineado con `CookieBanner.astro` (que sí emite Consent Mode v2). ✘
- [~] **content_group** — existe mapeo, pero vía regex sobre URL (`{{Variable Content Group - Idioma}}`, `{{Variable Content Group - Categoría Contenido - URL actual}}`), **no lee `dataLayer.content_group`** de `analytics.ts`. Divergente de `contentGroup()` (Home/Alojamientos/Blog/Contacto/Legal/Otros). ⚠
- [x] Versión **publicada** — live = v4 (workspace 5 sin cambios pendientes detectados). ✔

> **Pendiente de decisión del usuario** (no publicar sin confirmación): adaptar el
> contenedor a la implementación Astro — crear DLV `pagina_origen`/`content_group`/`destino`/`metodo`,
> triggers Custom Event `reserva_click`/`contact_click`, sus tags GA4 Event, y activar
> Consent Mode v2 (`analytics_storage`) en los tags GA4 sustituyendo el gating WP.

### Verificación vía MCP (cuando haya conexión)

```text
gtm_list_accounts                                  # localizar accountId
gtm_list_containers   { accountId }                # localizar el de GTM-KBCWRTFS
gtm_get_live_version  { accountId, containerId }    # versión publicada: tags/triggers/vars
gtm_list_tags         { accountId, containerId, workspaceId }
gtm_list_triggers     { accountId, containerId, workspaceId }
gtm_list_variables    { accountId, containerId, workspaceId }
```
