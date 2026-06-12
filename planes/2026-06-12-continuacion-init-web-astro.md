# Plan — Continuación del workflow init-web-astro

> **Run activo**: `init-web-astro-20260612-194558` · estado en `.ypc/runs/init-web-astro-20260612-194558/` (state.json, discovery.json, artifacts/)
> **Objetivo global**: migración WordPress → Astro de https://caletasuitestenerife.com/ con réplica visual exacta, iframes Icnea intactos, textos mejorados, SEO/GEO/SEM y AAA.

> [!CAUTION]
> **Regla innegociable** (CLAUDE.md): URLs de producción INMUTABLES — prohibido modificar cualquier URL existente o crear redirecciones 301; solo se permite añadir. Cualquier cambio de URL requiere confirmación explícita del usuario.

## Estado al cierre de sesión (2026-06-12)

| Fase | Estado |
|---|---|
| 1. preflight | ✅ aprobada — entorno OK, falta `gh` (no bloqueante) |
| 2. discovery | ✅ aprobada — 9 decisiones en `discovery.json` |
| 3. estructura | ✅ aprobada — monorepo compilando, push a GitHub (`main`) |
| 4. migración | 🟡 **A MEDIAS** — ver detalle abajo |
| 5-14 | ⬜ pendientes |

### Decisiones clave del discovery (aprobadas)

slug `caletasuites` · solo-www · réplica visual exacta del WP actual · paleta a extraer del CSS real · colecciones `apartamentos`/`paginas`/`posts` · hosting hestia-vps (SSH host y ruta → pendiente de que el usuario los facilite) · idiomas EN raíz + `/es/` (x-default=en, réplica WPML) · migración wordpress vía REST API · GA4 existente 423687681.

### Fase 4 (migración) — estado exacto

**Hecho**:
- `scripts/migrate/{00-inventario,01-export-wp,02-to-mdx,lib}.mjs` + `inventario-urls.json` escritos.
- Export REST completado: `tmp/wp-export/{pages-en,pages-es,posts-en,posts-es,media}.json` (tmp/ NO se versiona — si no existen, re-ejecutar `node scripts/migrate/01-export-wp.mjs`).
- `@astrojs/mdx` instalado e integrado en `apps/www/astro.config.mjs`.

**Pendiente (en orden)**:
1. Ejecutar/depurar `scripts/migrate/02-to-mdx.mjs` → generar los `.mdx` de las 3 colecciones (frontmatter Zod-válido; HTML de Elementor embebido tal cual, sin convertir a markdown).
2. Iframes Icnea: grep "icnea" en `tmp/wp-export/*.json`, preservar EXACTOS, documentar tabla página→iframe.
3. `03-download-assets.mjs`: descargar `/wp-content/uploads/` referenciados a `apps/www/public/wp-content/uploads/` con path exacto (decodificar percent-encoding → UTF-8; incluir mp4/webm).
4. Routing con `getStaticPaths` sirviendo cada URL EXACTA de producción (posts en `/to-do/`, `/gastronomy/`, `/to-do-news/` y equivalentes ES; home `/` y `/es/`).
5. Tokens visuales: extraer colores/tipografías del CSS del tema archub + kit Elementor → sustituir los 8 `TODO F-Migra` de `packages/config/tokens/index.cjs`.
6. `04-verify-urls.mjs`: tras `pnpm build:www`, cobertura inventario vs `dist/` → reportar X/Y.

### Prompt completo para retomar la fase 4 (lanzar con Task → implementer)

```text
Eres el agente "implementer" que CONTINÚA la fase MIGRACIÓN del workflow init-web-astro
(run init-web-astro-20260612-194558) en /home/yapci/Programacion/caletasuites-web.
Responde en español. NO empieces de cero: lee primero scripts/migrate/*.mjs,
inventario-urls.json, apps/www/src/content/config.ts y apps/www/astro.config.mjs.
Si tmp/wp-export/*.json no existe, regenera con node scripts/migrate/01-export-wp.mjs.

REGLA INNEGOCIABLE: URLs de producción INMUTABLES (ver CLAUDE.md) — cada página/post
debe resolverse en su URL exacta con trailing slash; EN en raíz, ES bajo /es/;
prohibido renombrar slugs o crear redirects; caso imposible → reportar, no cambiar.

Tareas en orden: (1) ejecutar/depurar 02-to-mdx.mjs hasta generar los .mdx de
paginas/posts/apartamentos con frontmatter Zod-válido — HTML Elementor embebido tal
cual; (2) localizar iframes Icnea (grep -i icnea en tmp/wp-export/) y preservarlos
exactos + tabla página→iframe; (3) escribir y ejecutar 03-download-assets.mjs →
apps/www/public/wp-content/uploads/ con path exacto, percent-decoding a UTF-8,
incluir mp4/webm, ~300-500ms entre descargas; (4) routing getStaticPaths para servir
cada URL del inventario; (5) extraer tokens reales (colores/tipografías) del CSS del
tema archub y kit Elementor → sustituir TODO F-Migra en packages/config/tokens/index.cjs;
(6) escribir 04-verify-urls.mjs y reportar cobertura X/Y tras pnpm build:www (debe pasar).
NO toques CLAUDE.md, NO hagas commit. Si te acercas al límite de turnos, PARA y
reporta estado exacto + siguiente paso.
Respuesta final: URLs migradas X/Y por tipo/idioma, assets (n.º, MB), tabla iframes
Icnea, tokens hex, resultado build+verify, pendientes. Footer estándar de
Skills consultados / Skills no relevantes.
```

Al terminar la fase: escribir `artifacts/migration_report.md` (lo escribe el orquestador con el resumen del agente) y cerrar con:
`ypc agents run-phase init-web-astro-20260612-194558 done migracion --artifact .ypc/runs/init-web-astro-20260612-194558/artifacts/migration_report.md`

## Fases restantes (5-14)

El protocolo completo del orquestador está en el prompt generado (regenerable con `ypc_agents_run` si se pierde; el run mantiene su estado). Tras cada fase: `ypc agents run-phase <run-id> done <fase>` → si `gate`, pedir aprobación al usuario con AskUserQuestion.

| # | Fase | Agente | Gate | Notas |
|---|---|---|---|---|
| 5 | blueprint | implementer | no | Completar blueprint con datos reales (parcialmente adelantado en el SAVE de hoy) |
| 6 | skills | skills-analyzer | **SÍ** | Symlinks a skills relevantes (astro, seo, accesibilidad…) |
| 7 | astro-baseline | implementer | no | Layout AAA definitivo + componentes UI |
| 8 | seo-baseline | seo-auditor | no | Sitemap+images, robots, canonical strict, JSON-LD, hreflang. **Respetar URLs inmutables** |
| 9 | geo-baseline | geo-auditor | no | BloqueCitaRapida, FAQAccesible, AutoridadDeclarada, llms.txt |
| 10 | a11y-baseline | accesibilidad-auditor | no | accesibilidad.astro + tokens contrastados + focus + tap targets |
| 11 | gtm-baseline | implementer | no | .env, dataLayer, eventos; GA4 423687681 ya existe; GTM container por confirmar |
| 12 | deploy-baseline | implementer | no | Scripts rsync+SSH Hestia (pedir al usuario ssh_host y remote_dir) |
| 13 | verificación | verifier | **SÍ** | pnpm install + build + lighthouse + html-diff vs web original |
| 14 | plan-f0 | spec-writer | **SÍ** | Tareas humanas a producción (DNS, SSL, SSH, GTM, gh CLI…) |

## Trabajo posterior al workflow (no incluido en el run)

- Réplica visual fina página a página (html-diff vs producción) — iterativa, tipo F2 de logopeda.
- Mejora editorial de textos (sin tocar maquetado) + SEO on-page por página.
- SEM: revisión de landing pages para campañas.
- Cutover DNS y verificación post-deploy (PSI/CrUX, Search Console).
