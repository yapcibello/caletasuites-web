// Vídeo de fondo de secciones Elementor — reimplementación nativa.
//
// El sitio original usa Elementor con secciones cuyo fondo es un vídeo de YouTube
// (data-settings: background_background:"video", background_video_link:"...").
// Elementor rellena por JS el <div class="elementor-background-video-embed"> con
// el reproductor. Sin ese runtime, el contenedor queda vacío y la sección se ve
// sin fondo. Este script monta nativamente un iframe de YouTube como fondo
// (silenciado, autoplay, en bucle), preservando el vídeo original del sitio.

export {};

interface SettingsElementor {
  background_background?: string;
  background_video_link?: string;
  background_play_on_mobile?: string;
}

// Extrae el ID de vídeo de una URL de YouTube (youtu.be/ID o youtube.com/watch?v=ID).
function youtubeId(url: string): string | null {
  const limpio = url.replace(/\\\//g, '/');
  const m =
    limpio.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    limpio.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    limpio.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function montarVideoFondo(): void {
  const contenedores = document.querySelectorAll<HTMLElement>(
    '.elementor-background-video-container',
  );

  contenedores.forEach((contenedor) => {
    // El embed vacío que Elementor rellenaría por JS.
    const embed = contenedor.querySelector<HTMLElement>('.elementor-background-video-embed');
    if (!embed || embed.dataset.csMounted === '1') return;

    // La sección portadora declara el vídeo en data-settings.
    const seccion = contenedor.closest<HTMLElement>('[data-settings]');
    const raw = seccion?.getAttribute('data-settings');
    if (!raw) return;

    let settings: SettingsElementor;
    try {
      settings = JSON.parse(raw) as SettingsElementor;
    } catch {
      return;
    }
    if (settings.background_background !== 'video' || !settings.background_video_link) return;

    const id = youtubeId(settings.background_video_link);
    if (!id) return;

    // En móvil, respetar background_play_on_mobile (el original lo activa).
    const enMovil = window.matchMedia('(max-width: 767px)').matches;
    if (enMovil && settings.background_play_on_mobile !== 'yes') return;

    // Iframe de YouTube como fondo: silenciado, autoplay, bucle (playlist=self),
    // sin controles ni UI. playsinline para iOS.
    const iframe = document.createElement('iframe');
    iframe.src =
      `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}` +
      '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.title = '';
    iframe.style.cssText =
      'position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:177.77vh;transform:translate(-50%,-50%);border:0;pointer-events:none;';

    embed.appendChild(iframe);
    embed.dataset.csMounted = '1';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', montarVideoFondo, { once: true });
} else {
  montarVideoFondo();
}
