import { ApiSettings } from '@looker/sdk-rtl';

const CONFIG_KEY = 'looker-oauth-config';

/**
 * An OAuth Session configuration provider that persists settings to sessionStorage.
 */
export class OAuthConfigProvider extends ApiSettings {
  /**
   * The config is read from the constructor and stored in sessionStorage
   * so it's available for the OAuth redirect.
   * @param {import('@looker/sdk-rtl').IApiSettings} settings
   */
  constructor(settings) {
    // The 'super' call will store the initial settings in the object
    super(settings);

    // Store the configuration for use after the OAuth redirect
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
  }

  /**
   * readConfig is overridden to read from storage.
   * This is essential for the OAuth callback page.
   */
  readConfig() {
    const stored = sessionStorage.getItem(CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failure parsing config', e);
      }
    }
    // Fallback to initial settings if storage is not available
    return super.readConfig();
  }
}
