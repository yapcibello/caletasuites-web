# Pendientes — caletasuites-web

> Workflow init-web-astro COMPLETADO (14 fases). Tareas restantes = camino a producción. Detalle completo en [planes/2026-06-13-f0-bootstrap-caletasuites/README.md](planes/2026-06-13-f0-bootstrap-caletasuites/README.md).

## Prioritario (bloquean producción)

- [ ] Facilitar acceso al Hestia VPS: `WWW_SSH_HOST` + `WWW_REMOTE_DIR` en `.env` raíz
- [ ] Decidir contraste del azul de marca #85A6C7 (falla AA 2.54:1) — oscurecer / texto oscuro / solo no-texto
- [ ] Decidir CMP / banner de cookies (Consent Mode está en 'denied'; gancho listo)
- [ ] Verificar contenedor GTM-KBCWRTFS (tag GA4 423687681, triggers de eventos)

## Antes del cutover

- [ ] html-diff visual página a página vs producción WP
- [ ] Self-host de Montserrat (ahora Google Fonts)
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
