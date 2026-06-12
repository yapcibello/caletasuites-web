/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** ID del contenedor de Google Tag Manager (GTM-XXXXXX). */
  readonly PUBLIC_GTM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
