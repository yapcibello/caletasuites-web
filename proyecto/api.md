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

### Checklist de verificación del contenedor (pendiente — requiere acceso al panel GTM)

> El MCP `gtm` no tenía conexión en el entorno de la sesión 2026-06-14. Verificar desde una
> máquina con red, en el panel de GTM o con las herramientas MCP `gtm_*`.

- [ ] **Tag GA4 Configuration** presente, con Measurement ID de la propiedad `423687681`, disparándose en *All Pages / Initialization*.
- [ ] **Triggers de eventos personalizados** `reserva_click` y `contact_click` (tipo *Custom Event*, nombre exacto en snake_case).
- [ ] **Tags GA4 Event** que envíen `reserva_click` y `contact_click` a GA4 con sus parámetros.
- [ ] **Variables de capa de datos** declaradas: `pagina_origen`, `content_group`, `destino`, `metodo`.
- [ ] **Consent Mode** activado en el contenedor (los tags GA4 con *consent settings* = require `analytics_storage`).
- [ ] **content_group** mapeado (Regex Table o variable) coherente con `contentGroup()` de `analytics.ts` (Home / Alojamientos / Blog / Contacto / Legal / Otros).
- [ ] Versión **publicada** (no solo en workspace) tras cualquier cambio.

### Verificación vía MCP (cuando haya conexión)

```text
gtm_list_accounts                                  # localizar accountId
gtm_list_containers   { accountId }                # localizar el de GTM-KBCWRTFS
gtm_get_live_version  { accountId, containerId }    # versión publicada: tags/triggers/vars
gtm_list_tags         { accountId, containerId, workspaceId }
gtm_list_triggers     { accountId, containerId, workspaceId }
gtm_list_variables    { accountId, containerId, workspaceId }
```
