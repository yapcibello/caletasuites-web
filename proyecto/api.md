# API — caletasuites-web

No aplica — sitio estático Astro sin API propia.

Referencias de APIs externas consumidas:

- **WordPress REST API del sitio origen** (`https://caletasuitestenerife.com/wp-json/wp/v2/`): solo lectura, usada por `scripts/migrate/01-export-wp.mjs` durante la migración (pages, posts, media, en/es vía WPML).
- **Icnea**: motor de reservas embebido por iframe en las páginas; no se integra por API — los iframes se preservan tal cual del sitio original.
