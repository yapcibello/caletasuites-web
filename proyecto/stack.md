# Stack tecnológico — caletasuites-web

## Lenguajes

| Lenguaje | Versión | Uso |
|----------|---------|-----|
| TypeScript | 5.9.3 (strict) | Código principal (Astro, scripts) |
| JavaScript (ESM) | node v20+ (.nvmrc v20, local v26.1.0) | Scripts de migración (`scripts/migrate/*.mjs`) |

## Frameworks y librerías principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| astro | 5.18.2 (catalog ^5.16.8) | Framework principal, SSG |
| @astrojs/sitemap | 3.7.3 | Sitemap con alternates i18n |
| @astrojs/mdx | ^4 | Contenido migrado con HTML embebido |
| @astrojs/tailwind | 5.1.5 | Integración Tailwind |
| tailwindcss | 3.4.19 | Estilos — preset compartido en packages/config |
| pnpm | 9.15.0 (workspaces + catalog) | Monorepo |

## Servicios externos

| Servicio | Propósito | Credenciales |
|----------|-----------|-------------|
| Icnea | Motor de reservas (iframes a preservar tal cual) | n/a (embebido) |
| GA4 (propiedad 423687681) | Analítica — propiedad existente del sitio actual | acceso Google del usuario |
| GTM | Tag manager (container por confirmar) | `PUBLIC_GTM_ID` en .env |
| GitHub (yapcibello/caletasuites-web) | Repositorio remoto (SSH) | clave SSH del usuario |
| WordPress origen (caletasuitestenerife.com) | Fuente de migración vía REST API `wp-json` | pública (solo lectura) |

## Herramientas de desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| pnpm scripts (`dev:www`, `build:www`, `verify:*`, `deploy:www`, `deploy:ftp-check`) | Desarrollo, verificación y deploy |
| scripts/migrate/*.mjs | Export WP → JSON → MDX + assets + verificación de URLs |
| scripts/deploy-ftp.sh | Deploy producción via FTP (ZIP + lftp + PHP trigger) |
| scripts/ftp-check.sh | Verificación de conexión FTP (anti-fail2ban) |
| lftp, curl, openssl, zip | Herramientas locales requeridas para deploy FTP |
| wget / curl | Mirror e inspección del sitio origen |
