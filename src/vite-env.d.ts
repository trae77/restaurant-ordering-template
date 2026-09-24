/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_RESTAURANT_NAME: string;
  readonly VITE_TAGLINE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
