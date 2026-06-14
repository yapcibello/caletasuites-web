# Pendientes — caletasuites-web

> Workflow init-web-astro COMPLETADO (14 fases). Tareas restantes = camino a producción. Detalle completo en [planes/2026-06-13-f0-bootstrap-caletasuites/README.md](planes/2026-06-13-f0-bootstrap-caletasuites/README.md).

## Prioritario (bloquean producción)

- [ ] Obtener credenciales FTP del panel Hestia (ver `.env.example`) y poblar `.env` raíz — sin esto no hay deploy
- [ ] Verificar contenedor GTM-KBCWRTFS (tag GA4 423687681, triggers de eventos) — MCP GTM sin conexión en el entorno actual; ver checklist en `proyecto/api.md` / hacerlo desde máquina con red

## Antes del cutover

- [ ] html-diff visual página a página vs producción WP
- [ ] Self-host de Montserrat — OJO: `font-montserrat.css` apunta a woff2 locales que NO existen y NO hay `<link>` a Google Fonts → Montserrat NO carga (cae a system-ui). Hay que descargar los woff2 (requiere red; bloqueado en este entorno). Ver `scripts/fetch-montserrat.sh`
- [ ] Smoke de reservas Icnea en el dominio nuevo

## Cutover y post-deploy

- [ ] Deploy a Hestia (`pnpm deploy:www`) + cutover DNS/vhost (WP como rollback)
- [ ] PSI/CrUX post-deploy + reenviar sitemap en Search Console + monitor GA4

## Ideas

- [ ] Mejora editorial de textos página a página (sin tocar maquetado) + SEO on-page
- [ ] Bloques visibles GEO (cita rápida, FAQ) — requieren decisión de maquetado
- [ ] SEM: landings para campañas Google Ads
- [ ] Migrar en el valle estacional (mayo-junio) para minimizar riesgo

## Deuda técnica

- [ ] `spacing.section` en tokens sigue provisional (TODO F-Migra)
- [ ] Instalar `gh` CLI (opcional; push ya funciona por SSH)
