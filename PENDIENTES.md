# Pendientes — caletasuites-web

## Prioritario

- [ ] **Completar fase 4 (migración WP→Astro)** del run `init-web-astro-20260612-194558` — ver plan [planes/2026-06-12-continuacion-init-web-astro.md](planes/2026-06-12-continuacion-init-web-astro.md): ejecutar 02-to-mdx, iframes Icnea, assets, routing URLs 1:1, tokens reales, verify-urls
- [ ] Fases 5-14 del workflow init-web-astro (blueprint definitivo, skills, baselines SEO/GEO/AAA/GTM/deploy, verificación, plan F0)
- [ ] Obtener del usuario: alias SSH y ruta remota del Hestia VPS para el deploy

## Mejoras

- [ ] Instalar `gh` CLI (el push ya funciona por SSH; gh facilitará PRs/issues)
- [ ] Confirmar GTM container para la nueva web (GA4 423687681 ya existe)

## Ideas

- [ ] Mejora editorial de textos página a página tras la migración (sin tocar maquetado)
- [ ] Revisión SEM de landing pages para campañas

## Deuda técnica

- [ ] Tokens de `packages/config/tokens/index.cjs` provisionales (8 marcados `TODO F-Migra`) — sustituir por valores extraídos del CSS real del tema archub
- [ ] Colecciones de contenido vacías hasta completar la migración (warnings glob-loader en build, esperados)
