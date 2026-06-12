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
    slug: z.string(),
    dormitorios: z.number().int().nonnegative(),
    planta: z.string(),
    vista: z.enum(['sea', 'mountain', 'sea-mountain']),
    tipo: z.enum(['apartment', 'penthouse']),
    galeria: z.array(z.string()),
    // URL del iframe de Icnea (motor de reservas) — opcional, se mantiene intacta.
    icneaUrl: z.string().url().optional(),
    idioma,
  }),
});

// Colección `paginas` — páginas institucionales.
const paginas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    idioma,
    descripcion: z.string(),
  }),
});

// Colección `posts` — blog (categorías existentes en producción).
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    categoria: z.enum(['to-do', 'gastronomy', 'to-do-news']),
    fecha: z.date(),
    idioma,
    heroImage: z.string().optional(),
    descripcion: z.string(),
  }),
});

export const collections = {
  apartamentos,
  paginas,
  posts,
};
