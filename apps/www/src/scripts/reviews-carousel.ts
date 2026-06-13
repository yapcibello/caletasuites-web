// Carrusel de testimonios — reimplementación nativa (sin Swiper ni jQuery).
//
// El sitio original usa el widget de testimonios de Elementor con Swiper. Sin ese
// runtime los slides se apilan en vertical. Este script opera sobre las clases ya
// existentes en el HTML migrado (.elementor-main-swiper, .swiper-wrapper,
// .swiper-slide, .elementor-swiper-button-next/prev, .swiper-pagination) y replica
// el comportamiento de producción: navegación por páginas, puntos de paginación,
// autoplay con pausa al interactuar y swipe táctil nativo (vía scroll-snap del CSS).
//
// Es no-op en cualquier página que no contenga .elementor-main-swiper (guard).

// Estilos del carrusel (scoped a .elementor-main-swiper). Se importan aquí para que
// Astro los bundlee junto a este script; los selectores no afectan a otras páginas.
import '../styles/reviews-carousel.css';

export {};

// Intervalo de autoplay (ms).
const AUTOPLAY_MS = 5000;

// Inicializa un carrusel concreto a partir de su contenedor raíz.
function initCarrusel(root: HTMLElement): void {
  const wrapper = root.querySelector<HTMLElement>('.swiper-wrapper');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('.swiper-slide'));
  const btnPrev = root.querySelector<HTMLElement>('.elementor-swiper-button-prev');
  const btnNext = root.querySelector<HTMLElement>('.elementor-swiper-button-next');
  const paginacion = root.querySelector<HTMLElement>('.swiper-pagination');

  // Sin pista o sin slides no hay nada que orquestar.
  if (!wrapper || slides.length === 0) return;

  // Respeta la preferencia de movimiento reducido: sin autoplay (pero la navegación
  // manual y el swipe siguen funcionando).
  const prefiereReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Asegura el aria-label de los botones (el HTML migrado ya los trae, pero por
  // robustez los reforzamos por si faltaran).
  if (btnPrev && !btnPrev.getAttribute('aria-label')) btnPrev.setAttribute('aria-label', 'Previous');
  if (btnNext && !btnNext.getAttribute('aria-label')) btnNext.setAttribute('aria-label', 'Next');

  // --- Cálculo de páginas --------------------------------------------------
  // Una "página" es el conjunto de slides visibles simultáneamente. Se deriva del
  // ancho real de un slide (el CSS define 4/2/1 según breakpoint), no de un valor fijo.
  function slidesPorPagina(): number {
    if (slides.length === 0) return 1;
    const anchoSlide = slides[0].getBoundingClientRect().width;
    if (anchoSlide <= 0) return 1;
    // gap entre slides leído de la variable CSS (fallback 24px).
    const gap = parseFloat(getComputedStyle(wrapper!).columnGap || '24') || 24;
    const anchoVisible = wrapper!.clientWidth;
    return Math.max(1, Math.round((anchoVisible + gap) / (anchoSlide + gap)));
  }

  function numPaginas(): number {
    return Math.max(1, Math.ceil(slides.length / slidesPorPagina()));
  }

  function paginaActual(): number {
    const ancho = wrapper!.clientWidth;
    if (ancho <= 0) return 0;
    return Math.round(wrapper!.scrollLeft / ancho);
  }

  // --- Navegación ----------------------------------------------------------
  function irAPagina(indice: number): void {
    const total = numPaginas();
    const destino = Math.max(0, Math.min(indice, total - 1));
    wrapper!.scrollTo({ left: destino * wrapper!.clientWidth, behavior: 'smooth' });
  }

  function avanzar(): void {
    irAPagina(paginaActual() + 1);
  }

  function retroceder(): void {
    irAPagina(paginaActual() - 1);
  }

  // --- Puntos de paginación ------------------------------------------------
  // Genera un botón por página dentro de .swiper-pagination.
  function construirPuntos(): void {
    if (!paginacion) return;
    const total = numPaginas();
    paginacion.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const punto = document.createElement('button');
      punto.type = 'button';
      punto.className = 'swiper-pagination-bullet';
      punto.setAttribute('aria-label', `Go to slide group ${i + 1}`);
      punto.addEventListener('click', () => {
        irAPagina(i);
        reiniciarAutoplay();
      });
      paginacion.appendChild(punto);
    }
  }

  // Resalta el punto correspondiente a la página visible.
  function actualizarPuntos(): void {
    if (!paginacion) return;
    const actual = paginaActual();
    const puntos = paginacion.querySelectorAll<HTMLElement>('.swiper-pagination-bullet');
    puntos.forEach((p, i) => {
      const activo = i === actual;
      p.classList.toggle('swiper-pagination-bullet-active', activo);
      p.setAttribute('aria-current', activo ? 'true' : 'false');
    });
  }

  // Atenúa las flechas en los extremos.
  function actualizarFlechas(): void {
    const actual = paginaActual();
    const total = numPaginas();
    btnPrev?.setAttribute('aria-disabled', actual <= 0 ? 'true' : 'false');
    btnNext?.setAttribute('aria-disabled', actual >= total - 1 ? 'true' : 'false');
  }

  function sincronizarEstado(): void {
    actualizarPuntos();
    actualizarFlechas();
  }

  // --- Autoplay ------------------------------------------------------------
  let timer: number | null = null;

  function tick(): void {
    // Al llegar al final, vuelve al inicio (bucle suave).
    if (paginaActual() >= numPaginas() - 1) {
      irAPagina(0);
    } else {
      avanzar();
    }
  }

  function arrancarAutoplay(): void {
    if (prefiereReducido || timer !== null) return;
    timer = window.setInterval(tick, AUTOPLAY_MS);
  }

  function pararAutoplay(): void {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function reiniciarAutoplay(): void {
    pararAutoplay();
    arrancarAutoplay();
  }

  // --- Eventos -------------------------------------------------------------
  btnNext?.addEventListener('click', () => {
    avanzar();
    reiniciarAutoplay();
  });
  btnPrev?.addEventListener('click', () => {
    retroceder();
    reiniciarAutoplay();
  });

  // Los botones de Elementor son <div role="button">: soportan Enter/Espacio.
  [btnPrev, btnNext].forEach((btn) => {
    btn?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn === btnNext ? avanzar() : retroceder();
        reiniciarAutoplay();
      }
    });
  });

  // Sincroniza el estado visual mientras el usuario hace scroll/swipe (con rAF
  // para no saturar el hilo).
  let rafPendiente = false;
  wrapper.addEventListener('scroll', () => {
    if (rafPendiente) return;
    rafPendiente = true;
    requestAnimationFrame(() => {
      rafPendiente = false;
      sincronizarEstado();
    });
  });

  // Pausa el autoplay cuando el usuario interactúa con el carrusel.
  root.addEventListener('mouseenter', pararAutoplay);
  root.addEventListener('mouseleave', arrancarAutoplay);
  root.addEventListener('focusin', pararAutoplay);
  root.addEventListener('focusout', arrancarAutoplay);
  root.addEventListener('pointerdown', pararAutoplay);

  // Recalcula páginas/puntos al redimensionar (cambia el breakpoint 4/2/1).
  let resizeTimer: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      construirPuntos();
      sincronizarEstado();
    }, 150);
  });

  // --- Arranque ------------------------------------------------------------
  construirPuntos();
  sincronizarEstado();
  arrancarAutoplay();
}

// Guard: solo actúa si existe al menos un carrusel en la página.
function init(): void {
  const carruseles = document.querySelectorAll<HTMLElement>('.elementor-main-swiper');
  if (carruseles.length === 0) return; // no-op en el resto de páginas
  carruseles.forEach((root) => initCarrusel(root));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
