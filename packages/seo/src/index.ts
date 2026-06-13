// @caletasuites/seo — Builders de JSON-LD (schema.org) para Caleta Suites Tenerife.
//
// REGLA INNEGOCIABLE: los datos del negocio (nombre, dirección, URL, redes) son los
// reales de producción. Los builders NO inventan contenido: reciben los datos ya
// resueltos (frontmatter, siteConfig) y los serializan a schema.org válido.
//
// Tipos implementados:
//   - LodgingBusiness: site-wide, en el <head> de todas las páginas (Layout.astro).
//   - Apartment (Accommodation): páginas de la colección apartamentos.
//   - BlogPosting: entradas de la colección posts.
//   - BreadcrumbList: migas donde aplique (apartamentos, posts).

// --- tipos auxiliares --------------------------------------------------------

/** Dirección postal del negocio (schema.org PostalAddress). */
export interface DatosDireccion {
  /** Localidad (p. ej. "La Caleta"). */
  addressLocality: string;
  /** Región/provincia (p. ej. "Santa Cruz de Tenerife"). */
  addressRegion: string;
  /** País en formato ISO 3166-1 alpha-2 (p. ej. "ES"). */
  addressCountry: string;
}

/** Datos para el LodgingBusiness site-wide. */
export interface DatosLodging {
  /** Nombre comercial. */
  nombre: string;
  /** Descripción breve del negocio. */
  descripcion: string;
  /** URL canónica de producción (sin path). */
  url: string;
  /** Imagen/logo representativo (URL absoluta). */
  imagen: string;
  /** Dirección postal. */
  direccion: DatosDireccion;
  /** Perfiles sociales propios (sameAs). Opcional. */
  sameAs?: string[];
}

/** Datos para un Apartment (Accommodation) de la colección apartamentos. */
export interface DatosApartamento {
  /** Nombre de la unidad (title del frontmatter). */
  nombre: string;
  /** URL absoluta de la página de la unidad. */
  url: string;
  /** Imagen principal (URL absoluta). */
  imagen?: string;
  /** Nº de dormitorios. */
  dormitorios: number;
  /** Planta literal del frontmatter (p. ej. "floor-0"). */
  planta: string;
  /** Vista: 'sea' | 'mountain' | 'sea-mountain'. */
  vista: string;
}

/** Datos para un BlogPosting de la colección posts. */
export interface DatosPost {
  /** Titular del artículo. */
  titular: string;
  /** URL absoluta del artículo. */
  url: string;
  /** Imagen destacada (URL absoluta). Opcional. */
  imagen?: string;
  /** Fecha de publicación (ISO 8601). */
  fechaPublicacion: string;
  /** Descripción/extracto. Opcional. */
  descripcion?: string;
}

/** Un nivel de la miga de pan. */
export interface Miga {
  nombre: string;
  /** URL absoluta del nivel. */
  url: string;
}

// --- builders ----------------------------------------------------------------

/**
 * LodgingBusiness site-wide. Va en el <head> de cada página: describe el negocio
 * (Caleta Suites Tenerife, La Caleta, Adeje). `sameAs` solo se incluye si hay
 * perfiles sociales propios.
 */
export function lodgingBusiness(d: DatosLodging) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: d.nombre,
    description: d.descripcion,
    url: d.url,
    image: d.imagen,
    logo: d.imagen,
    address: {
      '@type': 'PostalAddress',
      addressLocality: d.direccion.addressLocality,
      addressRegion: d.direccion.addressRegion,
      addressCountry: d.direccion.addressCountry,
    },
    ...(d.sameAs && d.sameAs.length ? { sameAs: d.sameAs } : {}),
  };
}

/**
 * Apartment (subtipo de Accommodation). Describe una unidad concreta con su nº de
 * habitaciones, planta y vista. La vista se expresa como `amenityFeature` legible.
 */
export function apartment(d: DatosApartamento) {
  // Traduce la planta literal ("floor-0") a un número de planta cuando es posible.
  const numPlanta = (() => {
    const m = d.planta.match(/(\d+)/);
    return m ? Number(m[1]) : undefined;
  })();

  // Etiqueta legible de la vista para amenityFeature.
  const etiquetaVista =
    d.vista === 'sea'
      ? 'Sea view'
      : d.vista === 'mountain'
        ? 'Mountain view'
        : 'Sea and mountain view';

  return {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: d.nombre,
    url: d.url,
    ...(d.imagen ? { image: d.imagen } : {}),
    numberOfRooms: d.dormitorios,
    ...(numPlanta !== undefined ? { floorLevel: numPlanta } : {}),
    amenityFeature: {
      '@type': 'LocationFeatureSpecification',
      name: etiquetaVista,
      value: true,
    },
  };
}

/** BlogPosting para entradas de blog. */
export function blogPosting(d: DatosPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: d.titular,
    url: d.url,
    mainEntityOfPage: d.url,
    datePublished: d.fechaPublicacion,
    ...(d.imagen ? { image: d.imagen } : {}),
    ...(d.descripcion ? { description: d.descripcion } : {}),
  };
}

/** BreadcrumbList a partir de una lista ordenada de migas. */
export function breadcrumbList(migas: Miga[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.nombre,
      item: m.url,
    })),
  };
}
