# Despliegue — caletasuites-web

## Entorno de producción

- **Plataforma**: Hestia VPS vía FTP (patrón smedialab-web / vitali-web)
- **URL**: https://caletasuitestenerife.com/
- **Rama de deploy**: main
- **Mecanismo**: ZIP de `apps/www/dist/` → lftp upload → PHP trigger (extractTo + manifest cleanup + smoke)

## Prerrequisitos

1. **Credenciales FTP** del panel Hestia → copiar en `.env` (ver `.env.example`)
2. Herramientas locales: `lftp`, `curl`, `openssl`, `zip`
3. `pnpm build:www` completando sin errores

## Verificar conexión FTP (antes del primer deploy)

```bash
bash scripts/ftp-check.sh
```

Valida login y que `FTP_REMOTE_DIR` existe en la jaula FTP. No dispara fail2ban (para en el primer fallo).

## Despliegue

```bash
# Build + deploy en un paso (recomendado en el primer deploy o tras cambios de código):
pnpm deploy:www --build

# Solo deploy (si el build ya está hecho y apps/www/dist/ está actualizado):
pnpm deploy:www
```

### Flujo interno del script (`scripts/deploy-ftp.sh`)

1. Crea `dist-deploy-YYYYMMDD_HHMMSS.zip` desde `apps/www/dist/`
2. Sube el ZIP vía lftp a `${FTP_REMOTE_DIR}${ZIP_NAME}`
3. Genera `_deploy/deploy-<16hex>.php` (nombre y token aleatorios — H-87)
4. Sube el PHP trigger a `${FTP_REMOTE_DIR}_deploy/`
5. Llama `https://caletasuitestenerife.com/_deploy/<trigger>.php?token=<token>` vía curl
6. El PHP ejecuta en el servidor:
   - Auth timing-safe (`hash_equals`)
   - Auto-delete del propio PHP
   - Construye manifest_pre (archivos existentes antes del extract)
   - `extractTo()` en dos fases: páginas/assets → sitemaps (evita GSC 404 históricos)
   - Calcula huérfanos (manifest_pre − manifest_zip) y los borra
   - Borra dirs vacíos resultantes
   - Borra el ZIP staging
   - Smoke loopback a 3 URLs (/, /apartments/, /sitemap-index.xml)
   - Responde `OK:extracted=N:cleaned=N:...` o `FAIL:smoke:...`
7. Fallback FTP: borra el PHP si no se auto-deletó
8. Smoke externo desde local (verificación cruzada)

### Variables de entorno requeridas (`.env`)

| Variable | Descripción |
|----------|-------------|
| `FTP_HOST` | Servidor FTP de Hestia |
| `FTP_USER` | Usuario FTP del dominio |
| `FTP_PASS` | Contraseña FTP |
| `FTP_REMOTE_DIR` | Ruta absoluta en jaula FTP (ej: `/home/user/web/caletasuitestenerife.com/public_html/`) |
| `DEPLOY_BASE_URL` | `https://caletasuitestenerife.com` |

### Variables de entorno opcionales (build, en `apps/www/.env`)

| Variable | Descripción |
|----------|-------------|
| `PUBLIC_GTM_ID` | Container GTM (GTM-KBCWRTFS); si falta, el Layout omite GTM y Consent Mode |

## Prerrequisito en el servidor (PHP trigger)

El servidor debe tener **PHP disponible** para el dominio en Hestia. El PHP trigger
se sube a `_deploy/` (subdir temporal) y Hestia/Apache lo ejecuta. Tras la ejecución
se auto-elimina. Si el servidor no tiene PHP, el deploy fallará en el paso 5 con
`ERROR:curl-failed` o HTTP 404/500 — en ese caso, contactar con el proveedor de hosting
para activar PHP para el dominio.

## Smoke test configurado

```json
[
  {"url": "/", "grep": "Caleta"},
  {"url": "/apartments/"},
  {"url": "/sitemap-index.xml", "grep": "sitemapindex"}
]
```

## Rollback manual

No hay rollback automático. Si el smoke falla post-deploy o se detecta un bug:

```bash
git revert <commit-del-cambio>
pnpm deploy:www --build
```

Si el sitio está caído y no se puede redeplegar, restaurar desde Hestia FileManager
usando el backup más reciente del hosting.

## Cutover DNS (pendiente)

El cutover se realiza UNA VEZ, cuando el site Astro esté listo para sustituir al WordPress:

1. Hacer el primer deploy con `pnpm deploy:www --build` (el hosting ya sirve el site Astro)
2. Desde el panel DNS del dominio, apuntar los registros A/CNAME al IP del servidor Hestia
3. Verificar propagación: `dig caletasuitestenerife.com` y `curl -I https://caletasuitestenerife.com/`
4. Ejecutar `pnpm deploy:www` de nuevo para asegurarse de que el ZIP más reciente está en producción

> [!CAUTION]
> Antes del cutover, confirmar que TODAS las URLs del inventario (126 páginas) responden
> 200 en el servidor Hestia. Usar `scripts/04-verify-urls.mjs` apuntando al Hestia.

## Verificación post-deploy

- [ ] Smoke: `curl -I https://caletasuitestenerife.com/` → 200
- [ ] Verificar muestreo de URLs antiguas → 200 sin redirects 301
- [ ] GTM funcionando: `curl -s https://caletasuitestenerife.com/ | grep GTM-KBCWRTFS`
- [ ] PSI/CrUX: PageSpeed Insights + Core Web Vitals
