/**
 * Looker Configuration & Environment Settings
 */

export interface LookerConfig {
  baseUrl: string;
  clientId: string;
  redirectUri: string;
}

export const getLookerConfig = (): LookerConfig => {
  const baseUrl = import.meta.env.VITE_LOOKER_BASE_URL || 'https://your-company.looker.com';
  const clientId = import.meta.env.VITE_LOOKER_CLIENT_ID || 'looker-oauth-app';
  const redirectUri = import.meta.env.VITE_LOOKER_REDIRECT_URI || `${window.location.origin}/callback`;

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''), // strip trailing slashes
    clientId,
    redirectUri,
  };
};
