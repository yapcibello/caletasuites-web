// Configuración del sitio Caleta Suites Tenerife.
// Datos reales del negocio: marca, dominio, ubicación, contacto, analytics.
// El GTM ID viene del .env de la app (import.meta.env.PUBLIC_GTM_ID); aquí solo
// se referencia GA4 a título informativo (se conecta a través del contenedor GTM).

export const siteConfig = {
  name: 'Caleta Suites Tenerife',
  legalName: 'Caleta Suites Tenerife',
  title: 'Caleta Suites Tenerife — Alquiler vacacional en La Caleta, Adeje',
  description:
    'Apartamentos y áticos de alquiler vacacional en La Caleta, Adeje (Tenerife). Vistas al mar, a pie de playa.',

  // Dominio de producción (inmutable, con trailing slash en todas las rutas).
  url: 'https://caletasuitestenerife.com',

  // Idiomas (réplica WPML actual): EN en raíz, ES bajo /es/, x-default = en.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'] as const,
    xDefault: 'en',
  },

  // Ubicación real (alquiler vacacional).
  location: {
    locality: 'La Caleta',
    municipality: 'Adeje',
    region: 'Santa Cruz de Tenerife',
    island: 'Tenerife',
    country: 'ES',
    geoRegion: 'ES-CN',
  },

  // Perfiles sociales propios (sameAs del JSON-LD). Extraídos del footer real del
  // tema WordPress (_chrome/footer-*.html). Solo perfiles oficiales del negocio.
  sameAs: [
    'https://www.facebook.com/caletasuitestenerife',
    'https://www.instagram.com/caletasuitestenerife/',
  ],

  // Logo oficial de marca (logo del JSON-LD LodgingBusiness).
  logo: '/wp-content/uploads/2022/03/caltea-suites-logo-retina.webp',

  // Imagen por defecto para Open Graph (fallback site-wide cuando una página no
  // declara ogImage propio de Yoast).
  defaultOgImage: '/wp-content/uploads/2024/03/apto-09-2.webp',

  // Analytics — GA4 existente (propiedad 423687681), conectado vía contenedor GTM.
  // El ID de GTM se inyecta desde apps/www/.env (PUBLIC_GTM_ID).
  analytics: {
    ga4PropertyId: '423687681',
  },
} as const;

export type SiteConfig = typeof siteConfig;
