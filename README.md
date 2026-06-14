# caletasuites-web

Migración de **WordPress → Astro** del sitio [Caleta Suites Tenerife](https://caletasuitestenerife.com/),
alquiler vacacional en La Caleta (Adeje, Tenerife). El objetivo es una **réplica visual exacta**
del sitio WordPress actual (tema `archub-child` sobre Elementor), sin rediseño: mismo maquetado,
imágenes, vídeos e iframes del motor de reservas Icnea.

> [!CAUTION]
> **URLs de producción inmutables.** Ninguna URL existente de `caletasuitestenerife.com` se modifica.
> Prohibidas las redirecciones 301: solo se permite **añadir** rutas nuevas. `trailingSlash: 'always'`
> (la web actual usa barra final en todas sus rutas).

## Estructura

```
caletasuites-web/
├── apps/
│   └── www/                  App principal Astro (la única; incluye el blog migrado)
│       ├── src/
│       │   ├── components/    Header, Navbar, Footer (esqueleto AAA)
│       │   ├── content/       Content Collections: apartamentos, paginas, posts
│       │   ├── layouts/       Layout.astro (GTM, JSON-LD, OG/Twitter, i18n)
│       │   ├── pages/         Rutas (index.astro skeleton)
│       │   ├── styles/        global.css (Tailwind + utilidades AAA)
│       │   └── utils/         siteConfig.ts (datos reales del negocio)
│       └── public/            Estáticos (favicon placeholder)
├── packages/
│   ├── config/               Tokens de marca + preset Tailwind (ÚNICA fuente de paleta)
│   └── seo/                   Schemas JSON-LD cross-app (a poblar cuando se consuma)
├── package.json              Monorepo pnpm workspaces
├── pnpm-workspace.yaml        Workspaces + catalog de versiones compartidas
└── tsconfig.base.json         Config TS base con alias @caletasuites/*
```

## Requisitos

- **Node 20** (ver `.nvmrc`).
- **pnpm 9.15.0** vía Corepack. Activarlo una vez con:

  ```bash
  corepack enable
  ```

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm install` | Instala dependencias del monorepo |
| `pnpm dev:www` | Desarrollo local de `apps/www` |
| `pnpm build:www` | Build de producción de `apps/www` |
| `pnpm deploy:www` | Deploy a Hestia VPS vía FTP (requiere `.env` con credenciales) |
| `pnpm fetch:montserrat` | Descarga y self-hostea la fuente Montserrat (requiere red) |
| `pnpm verify:html-diff` | Verifica que no hay diferencias de HTML vs producción |
| `pnpm verify:sitemap-images` | Verifica imágenes del sitemap |
| `pnpm hero:list` | Lista las fotos hero |
| `pnpm test` | Ejecuta los tests (Vitest) |

## i18n

Réplica del WPML actual con i18n nativo de Astro:

- **Inglés** en la raíz (`/`) — `defaultLocale`, sin prefijo (`prefixDefaultLocale: false`).
- **Español** bajo `/es/`.
- `x-default = en`.

## Tokens de marca

Los tokens de color, tipografía y espaciado viven **exclusivamente** en
`packages/config/` (`tailwind.preset.cjs` + `tokens/`). Las apps **no duplican**
la paleta: la consumen vía el preset compartido. Los valores actuales son
**provisionales** (marcados `TODO F-Migra`) y se reemplazarán por los reales
extraídos del CSS del tema WordPress durante la migración.

## Analytics

GA4 existente (propiedad `423687681`) conectado a través de Google Tag Manager.
El ID del contenedor se inyecta desde `apps/www/.env` (`PUBLIC_GTM_ID`); ver
`apps/www/.env.example`.

---

**Desarrollado con ❤️ por el equipo de SMedialab**
