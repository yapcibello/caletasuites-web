// Re-export de compatibilidad: algunos call-sites importan `@caletasuites/config/tailwind-preset`
// (sin punto) y otros `@caletasuites/config/tailwind.preset`. Ambos resuelven al mismo preset.
module.exports = require('./tailwind.preset.cjs');
