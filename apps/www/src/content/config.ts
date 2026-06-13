import { defineCollection, z } from 'astro:content';

// Content Collections de Caleta Suites — API clásica (`type: 'content'`).
// Idioma por entrada: 'en' | 'es' (réplica WPML; EN raíz, ES bajo /es/).
//
// REGLA INNEGOCIABLE: los `slug` reproducen 1:1 las URLs de producción de
// caletasuitestenerife.com. No modificar slugs existentes (sin redirecciones 301).

const idioma = z.enum(['en', 'es']);

// Colección `apartamentos` — 10 unidades (apartments + penthouses).
const apartamentos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Slug WPML de producción. Se llama `wpSlug` (no `slug`) porque en Astro 5 el
    // campo `slug` está RESERVADO para colecciones `type: 'content'` y no puede
    // declararse en el schema de usuario.
    wpSlug: z.string(),
    // Pathname de producción INMUTABLE (con trailing slash). Fuente de verdad del
    // routing: el slug WPML no basta (la home usa slug propio pero path '/'). Es el
    // `link` REST normalizado y NUNCA se deriva ni modifica.
    path: z.string(),
    dormitorios: z.number().int().nonnegative(),
    planta: z.string(),
    vista: z.enum(['sea', 'mountain', 'sea-mountain']),
    tipo: z.enum(['apartment', 'penthouse']),
    galeria: z.array(z.string()),
    // URL del iframe de Icnea (motor de reservas) — opcional, se mantiene intacta.
    icneaUrl: z.string().url().optional(),
    // Clave del fichero HTML crudo de Elementor en src/content/_raw/<col>/<rawKey>.html.
    rawKey: z.string(),
    idioma,
  }),
});

// Colección `paginas` — páginas institucionales.
const paginas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Slug WPML de producción — ver nota en apartamentos (campo reservado en Astro 5).
    wpSlug: z.string(),
    // Pathname de producción INMUTABLE (con trailing slash) — ver nota en apartamentos.
    path: z.string(),
    // Clave del fichero HTML crudo de Elementor en src/content/_raw/paginas/<rawKey>.html.
    rawKey: z.string(),
    idioma,
    descripcion: z.string(),
  }),
});

// Colección `posts` — blog (categorías existentes en producción).
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Slug WPML de producción — ver nota en apartamentos (campo reservado en Astro 5).
    wpSlug: z.string(),
    // Pathname de producción INMUTABLE (con trailing slash) — ver nota en apartamentos.
    path: z.string(),
    categoria: z.enum(['to-do', 'gastronomy', 'to-do-news']),
    fecha: z.date(),
    idioma,
    heroImage: z.string().optional(),
    // Clave del fichero HTML crudo de Elementor en src/content/_raw/posts/<rawKey>.html.
    rawKey: z.string(),
    descripcion: z.string(),
  }),
});

export const collections = {
  apartamentos,
  paginas,
  posts,
};
