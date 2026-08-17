/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOOKER_BASE_URL?: string;
  readonly VITE_LOOKER_CLIENT_ID?: string;
  readonly VITE_LOOKER_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
