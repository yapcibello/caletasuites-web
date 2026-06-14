// Design tokens de Caleta Suites — colores, fuentes y espacios.
//
// Valores REALES extraídos del CSS de origen (https://caletasuitestenerife.com/),
// tema WordPress archub/archub-child + kit global de Elementor (elementor-kit-10).
// Fuentes consultadas:
//   - Kit Elementor: /wp-content/uploads/elementor/css/post-10.css
//     (variables --e-global-color-* y --e-global-typography-*)
//   - Estilos inline de la home y archub/assets/css/base/typography.css
// La paleta de marca real es una gama de azules suaves; el texto usa grises.

/** Paleta de color real (azules de marca + grises de texto). */
const colors = {
  // Azul de marca dominante (botones/CTAs/iconos). Origen: #85a6c7 recurrente
  // en estilos inline de la home (background-color/fill/color) y kit post-10.css.
  primary: {
    DEFAULT: '#37597C', // Azul medio de marca
    dark: '#6288AA', // Azul profundo (hover/variantes), origen home inline
    light: '#A9C5DE', // Azul claro, origen home inline + kit
  },
  // Color "primary" global de Elementor (titulares/texto fuerte). Origen:
  // --e-global-color-primary:#000000 en post-10.css.
  secondary: {
    DEFAULT: '#000000', // Negro de titulares (Elementor global primary)
    dark: '#000000',
    light: '#32373C', // Gris oscuro recurrente, origen kit/home
  },
  // Texto principal. Origen: --e-global-color-text:#535353 (post-10.css).
  ink: {
    DEFAULT: '#535353', // Gris texto cuerpo (Elementor global text)
    light: '#4A4A4A', // Gris texto secundario, origen home inline (color:)
  },
  // Acento. Origen: azul claro de marca #a9c5de usado en detalles/iconos.
  accent: '#A9C5DE',
};

/** Familias tipográficas reales del tema/kit Elementor. */
const fontFamily = {
  // Cuerpo: el kit global de Elementor (post-10.css) fija Montserrat para
  // primary/secondary/text/accent. El tema base (typography.css) usa
  // "Be Vietnam Pro"; el kit la sobrescribe a Montserrat en la home.
  // Origen carga: Google Fonts (montserrat.css en /uploads/elementor/google-fonts/).
  sans: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  // Titulares: idem, Montserrat (--e-global-typography-primary-font-family).
  // Nota: el tema base define "Syne" para h1-h6, pero el kit Elementor de la
  // home unifica todo en Montserrat (peso 600 titulares, 400 cuerpo).
  heading: ['Montserrat', 'Georgia', 'Times New Roman', 'serif'],
};

/** Escala de espaciado provisional (extiende la de Tailwind). */
const spacing = {
  // TODO F-Migra: gutters/secciones del tema WP — no extraído en sub-fase 4d
  // (alcance limitado a colores y tipografías). Valor provisional.
  section: '5rem',
};

module.exports = { colors, fontFamily, spacing };
