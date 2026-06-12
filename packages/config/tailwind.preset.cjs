// Preset Tailwind compartido — ÚNICA fuente de tokens de marca de Caleta Suites.
// Las apps NO duplican la paleta: la consumen vía `presets: [require('@caletasuites/config/tailwind-preset')]`.
//
// TODO F-Migra: TODOS los valores de color/fuente de este archivo son PROVISIONALES.
// La paleta y tipografía reales se extraerán del CSS del tema WordPress (archub-child)
// de https://caletasuitestenerife.com/ durante la fase de migración. No tratar estos
// valores como definitivos ni construir UI final sobre ellos hasta esa extracción.

const tokens = require('./tokens/index.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      spacing: tokens.spacing,
    },
  },
  plugins: [],
};
