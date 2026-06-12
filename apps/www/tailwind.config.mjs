import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Preset compartido: ÚNICA fuente de tokens de marca (paleta provisional TODO F-Migra).
const caletaPreset = require('@caletasuites/config/tailwind-preset');

/** @type {import('tailwindcss').Config} */
export default {
  presets: [caletaPreset],
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
