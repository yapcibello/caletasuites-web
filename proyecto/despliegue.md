# Despliegue — caletasuites-web

## Entorno de producción

- **Plataforma**: Hestia VPS (rsync+SSH, patrón logopedajessica-web) — decidido en discovery; scripts de deploy pendientes (fase 12 del workflow init-web-astro)
- **URL**: https://caletasuitestenerife.com/ (actualmente sirve el WordPress origen; el cutover DNS/vhost se planificará en el plan F0)
- **Rama de deploy**: main

## Requisitos previos

- Alias SSH y ruta remota del Hestia VPS (pendiente de que el usuario los facilite — ver PENDIENTES.md)
- `pnpm build:www` pasando con cobertura 100% de URLs del inventario

## Pasos de despliegue

```bash
# Pendiente — se generará en la fase deploy-baseline (12) del workflow:
# pnpm build:www && rsync -avz --delete apps/www/dist/ <ssh_host>:<remote_dir>/
```

## Variables de entorno

| Variable | Descripción | Origen |
|----------|-------------|--------|
| PUBLIC_GTM_ID | Container de Google Tag Manager (GTM-XXXXXX); si falta, el Layout omite GTM | .env |

## Verificación post-deploy

- [ ] Smoke con `auditoria-web-quick` + PSI/CrUX (GA4 423687681 ya mide el dominio)
- [ ] Verificar muestreo de URLs antiguas (páginas, posts, assets) → 200 sin redirects
