// Eventos GA4 vía GTM/dataLayer — Caleta Suites (alquiler vacacional).
//
// Script de cliente NO intrusivo: NO modifica el DOM visible ni el maquetado.
// Solo registra listeners de clic delegados en document y empuja eventos al
// dataLayer que GTM (contenedor GTM-KBCWRTFS) traduce a eventos GA4.
//
// page_view es automático (Google Tag dentro del contenedor) — no se replica aquí.
//
// Naming según skill gtm-ga4-eventos: snake_case, prefijo de categoría.
//   - reserva_click  → interacción con el motor de reservas Icnea (enlaces/iframe).
//   - contact_click  → clic en teléfono (tel:) o email (mailto:) del footer/sitio.
//
// El Consent Mode default 'denied' se fija en el <head> (Layout.astro). Con
// analytics_storage='denied' GA4 sigue recibiendo estos eventos como datos
// modelados; al aceptar cookies (caletaConsentGranted) pasan a medición plena.

// `export {}` convierte este archivo en un módulo ES, requisito para que
// `declare global` (augmentación del scope global) sea válido en TypeScript.
export {};

interface DataLayerEvent {
  event: string;
  [clave: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    /** Gancho del CMP/banner: actualiza Consent Mode a 'granted' al aceptar cookies. */
    caletaConsentGranted?: (opciones?: { analytics?: boolean; ads?: boolean }) => void;
  }
}

// Empuja un evento al dataLayer de forma segura (si GTM aún no cargó, se encola).
function push(evento: DataLayerEvent): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(evento);
}

// Empuja un comando gtag() (consent update) con el mismo formato que el snippet
// del <head>: dataLayer.push(arguments) → ['consent','update',{...}].
function gtagPush(...args: unknown[]): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args as unknown as DataLayerEvent);
}

// content_group aproximado por ruta (coherente con el Regex Table de GTM).
function contentGroup(path: string): string {
  if (/^\/(es\/)?$/.test(path)) return 'Home';
  if (/aticos|penthouses|apartamentos|apartments/.test(path)) return 'Alojamientos';
  if (/blog|post/.test(path)) return 'Blog';
  if (/contact|contacto/.test(path)) return 'Contacto';
  if (/aviso-legal|privacidad|privacy|cookie|condiciones|booking|accesib|accessib/.test(path))
    return 'Legal';
  return 'Otros';
}

// Detecta clic en enlace de reserva Icnea (enlace a icnea.net o dentro del
// contenedor del iframe de reservas). NO altera el enlace ni su comportamiento.
function esEnlaceReserva(el: Element): boolean {
  const enlace = el.closest('a');
  const dentroIframeReserva = el.closest('.icnea-iframe-container, [id*="icnea" i]');
  if (dentroIframeReserva) return true;
  if (!enlace) return false;
  const href = enlace.getAttribute('href') || '';
  return /icnea\.net/i.test(href);
}

function registrar(): void {
  const path = window.location.pathname;

  document.addEventListener(
    'click',
    (ev) => {
      const objetivo = ev.target as Element | null;
      if (!objetivo) return;

      // 1) Reservas — clic saliente al motor Icnea (enlaces o área del iframe).
      if (esEnlaceReserva(objetivo)) {
        const enlace = objetivo.closest('a');
        push({
          event: 'reserva_click',
          pagina_origen: path,
          content_group: contentGroup(path),
          destino: enlace?.getAttribute('href') || 'icnea_iframe',
        });
        return;
      }

      // 2) Contacto — clic en teléfono o email (footer y resto del sitio).
      const enlace = objetivo.closest('a');
      if (enlace) {
        const href = enlace.getAttribute('href') || '';
        if (href.startsWith('tel:') || href.startsWith('mailto:')) {
          push({
            event: 'contact_click',
            pagina_origen: path,
            content_group: contentGroup(path),
            metodo: href.startsWith('tel:') ? 'telefono' : 'email',
            destino: href,
          });
        }
      }
    },
    // Captura para no depender de que otros handlers no hagan stopPropagation;
    // passive porque NUNCA llamamos preventDefault (no alteramos la navegación).
    { capture: true, passive: true },
  );
}

// Gancho de consentimiento para el futuro CMP/banner (decisión de maquetado del
// usuario — aquí solo se deja preparado). Actualiza el Consent Mode a 'granted'.
function instalarGanchoConsentimiento(): void {
  window.caletaConsentGranted = (opciones = { analytics: true, ads: false }) => {
    const update: Record<string, string> = {};
    if (opciones.analytics) update['analytics_storage'] = 'granted';
    if (opciones.ads) {
      update['ad_storage'] = 'granted';
      update['ad_user_data'] = 'granted';
      update['ad_personalization'] = 'granted';
    }
    // Mismo formato gtag(arguments) que el Consent Mode default del <head>.
    gtagPush('consent', 'update', update);
  };
}

instalarGanchoConsentimiento();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registrar, { once: true });
} else {
  registrar();
}
