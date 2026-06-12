# caletasuites-web

Migración WordPress → Astro de https://caletasuitestenerife.com/ (Caleta Suites Tenerife, alquiler vacacional en La Caleta, Adeje). Réplica visual exacta del sitio actual.

> [!CAUTION]
> **REGLA INNEGOCIABLE — URLs de producción inmutables**
> Ninguna URL existente en producción se modifica, en absoluto. Prohibido crear redirecciones 301 para "arreglar" o "mejorar" URLs. Como mucho se permite **ampliar** (añadir URLs nuevas que no existían). Si en cualquier fase parece necesario modificar una URL existente, **PARAR y pedir confirmación explícita al usuario** antes de tocar nada. Aplica a slugs, prefijos de idioma (EN raíz + /es/), trailing slash, categorías de posts (/to-do/, /gastronomy/, /to-do-news/) y rutas de assets indexados.

## Stack

- Astro 5 (monorepo pnpm workspaces) — apps/www + packages/config + packages/seo
- Tailwind con preset compartido (tokens extraídos del tema WP actual)
- Content Collections API clásica (`type: 'content'`)
- i18n: EN raíz + /es/ (réplica WPML actual, x-default=en)
- Hosting destino: Hestia VPS (rsync+SSH); origen actual: WordPress 7.0 + Elementor sobre nginx/HestiaCP

## Comandos

- `pnpm dev:www` — desarrollo local
- `pnpm build:www` — build de producción
- `pnpm deploy:www` — deploy a Hestia VPS (pendiente de configurar)
- `pnpm test` — tests

## Convenciones

- TODO en español (código comentado, commits, docs); contenido web bilingüe EN/ES
- Réplica visual exacta: mismo maquetado, imágenes y vídeos que el WP actual — solo se mejoran textos
- Iframes de Icnea (motor de reservas) se mantienen intactos
- Trailing slash obligatorio en todas las rutas
- Tokens de marca SOLO en `packages/config/tailwind.preset.cjs`
- Commits: `tipo: descripción` en español

## Boundaries

- **Siempre**: preservar URLs 1:1 con producción; verificar contraste AAA; pedir confirmación antes de modificar cualquier URL existente
- **Preguntar antes**: cambiar/añadir cualquier ruta o slug; tocar estructura de idiomas; eliminar contenido del sitio original
- **Nunca**: modificar URLs de producción ni crear redirecciones 301; cambiar el maquetado/diseño; eliminar los iframes de Icnea; commitear secretos o `.env`
