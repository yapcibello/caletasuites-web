# Runbook — caletasuites-web

> Proyecto en fase de bootstrap — sin operaciones en producción todavía. Este runbook se completará en las fases deploy-baseline (12) y plan F0 (14) del workflow init-web-astro.

## Desarrollo local

```bash
corepack enable        # una vez por máquina
pnpm install
pnpm dev:www           # http://localhost:4321
pnpm build:www         # build de producción a apps/www/dist/
```

## Migración (re-ejecutable)

```bash
node scripts/migrate/00-inventario.mjs      # sitemaps → inventario-urls.json
node scripts/migrate/01-export-wp.mjs       # REST API → tmp/wp-export/*.json
node scripts/migrate/02-to-mdx.mjs          # JSON → MDX en apps/www/src/content/
# 03-download-assets.mjs y 04-verify-urls.mjs — pendientes (ver plan de continuación)
```

## Deploy / Rollback / Backup

```bash
# Verificar conexión FTP antes del primer deploy
bash scripts/ftp-check.sh

# Build + deploy (primer deploy o tras cambios de código)
pnpm deploy:www --build

# Solo deploy (si dist/ ya está actualizado)
pnpm deploy:www
```

**Rollback manual**: no hay rollback automático (manifiest cleanup no atómico). Si el smoke falla o se detecta un bug:

```bash
git revert <commit-del-cambio>
pnpm deploy:www --build
```

El WordPress de origen sigue intacto hasta el cutover DNS — se puede deshacer el cutover DNS como rollback de emergencia. Ver [proyecto/despliegue.md](despliegue.md) para el flujo completo.

## Debug — Problemas comunes

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| Warnings glob-loader en build | Colecciones de contenido vacías (migración incompleta) | Esperado hasta completar fase 4; desaparece al generar los MDX |
| Push HTTPS falla (`could not read Username`) | Sin credenciales HTTPS ni gh CLI | El remoto ya está en SSH (`git@github.com:yapcibello/caletasuites-web.git`) |
| Build sin GTM | `PUBLIC_GTM_ID` ausente | Comportamiento por diseño: copiar `.env.example` → `.env` con el container real |
