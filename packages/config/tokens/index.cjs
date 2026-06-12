// Design tokens de Caleta Suites — colores, fuentes y espacios.
//
// TODO F-Migra: token extraído de la web real.
// TODOS los valores de este archivo son PROVISIONALES. Se reemplazarán por los
// valores reales extraídos del CSS del tema WordPress (archub-child) de
// https://caletasuitestenerife.com/ en la fase de migración. Estructura estable;
// valores a confirmar.

/** Paleta de color provisional (alquiler vacacional, tonos costa/mar). */
const colors = {
  // TODO F-Migra: token extraído de la web real — color de marca principal.
  primary: {
    DEFAULT: '#1A6E8E', // Azul mar provisional
    dark: '#124E66',
    light: '#7FB8CC',
  },
  // TODO F-Migra: token extraído de la web real — color secundario / arena.
  secondary: {
    DEFAULT: '#C9A66B', // Arena provisional
    dark: '#9E7E47',
    light: '#E6D3AE',
  },
  // TODO F-Migra: token extraído de la web real — texto principal.
  ink: {
    DEFAULT: '#2D2D2D',
    light: '#4A4A4A',
  },
  // TODO F-Migra: token extraído de la web real — acento / CTAs.
  accent: '#E07A5F',
};

/** Familias tipográficas provisionales. */
const fontFamily = {
  // TODO F-Migra: token extraído de la web real — fuente de cuerpo del tema WP.
  sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  // TODO F-Migra: token extraído de la web real — fuente de titulares del tema WP.
  heading: ['Georgia', 'Times New Roman', 'serif'],
};

/** Escala de espaciado provisional (extiende la de Tailwind). */
const spacing = {
  // TODO F-Migra: token extraído de la web real — gutters/secciones del tema WP.
  section: '5rem',
};

module.exports = { colors, fontFamily, spacing };
