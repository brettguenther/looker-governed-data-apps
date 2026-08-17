import { Looker40SDK } from '@looker/sdk/lib/4.0/methods';
import {
  BrowserServices,
  OAuthSession,
  AuthToken,
  type IApiSettings,
  type IApiSection,
} from '@looker/sdk-rtl';
import { getLookerConfig } from '../config';

const TOKEN_STORAGE_KEY = 'looker_oauth_token_data';

export class BrowserOAuthSettings implements IApiSettings {
  base_url: string;
  looker_url: string;
  client_id: string;
  redirect_uri: string;
  verify_ssl: boolean = true;
  timeout: number = 120;
  agentTag: string = 'LookerGenDataApps/1.0';

  constructor() {
    const config = getLookerConfig();
    this.base_url = config.baseUrl;
    this.looker_url = config.baseUrl;
    this.client_id = config.clientId;
    this.redirect_uri = config.redirectUri;
  }

  isConfigured(): boolean {
    return Boolean(this.base_url && this.client_id && this.redirect_uri);
  }

  readConfig(): IApiSection {
    return {
      base_url: this.base_url,
      looker_url: this.looker_url,
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      verify_ssl: String(this.verify_ssl),
      timeout: String(this.timeout),
      agentTag: this.agentTag,
    };
  }
}

/**
 * Enhanced OAuthSession that persists the access and refresh tokens to sessionStorage.
 * This prevents session loss across page navigations, component re-renders, and browser refreshes.
 */
export class PersistentOAuthSession extends OAuthSession {
  constructor(services: BrowserServices) {
    super(services);
    this.restoreStoredToken();
  }

  restoreStoredToken(): void {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const tokenData = JSON.parse(stored);
        if (tokenData && tokenData.access_token) {
          this.activeToken.setToken(tokenData);
          if (tokenData.expiresAt) {
            this.activeToken.expiresAt = new Date(tokenData.expiresAt);
          }
        }
      }
    } catch (err) {
      console.warn('Could not restore Looker OAuth token from storage:', err);
    }
  }

  saveTokenToStorage(): void {
    try {
      if (this.activeToken && this.activeToken.access_token) {
        const tokenData = {
          access_token: this.activeToken.access_token,
          token_type: this.activeToken.token_type,
          expires_in: this.activeToken.expires_in,
          refresh_token: this.activeToken.refresh_token,
          expiresAt: this.activeToken.expiresAt?.toISOString(),
        };
        sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Could not persist Looker OAuth token to storage:', err);
    }
  }

  async redeemAuthCode(authCode: string, codeVerifier?: string): Promise<AuthToken> {
    const token = await super.redeemAuthCode(authCode, codeVerifier);
    this.saveTokenToStorage();
    return token;
  }

  async getToken(): Promise<AuthToken> {
    if (!this.isAuthenticated() && !this.activeToken.access_token) {
      this.restoreStoredToken();
    }
    const token = await super.getToken();
    this.saveTokenToStorage();
    return token;
  }

  isAuthenticated(): boolean {
    if (!this.activeToken.isActive() && !this.activeToken.access_token) {
      this.restoreStoredToken();
    }
    return this.activeToken.isActive();
  }

  clearStorage(): void {
    super.clearStorage();
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  async logout(): Promise<boolean> {
    try {
      return await super.logout();
    } finally {
      this.clearStorage();
    }
  }
}

let sessionInstance: PersistentOAuthSession | null = null;
let sdkInstance: Looker40SDK | null = null;

export const getLookerSession = (): PersistentOAuthSession => {
  if (!sessionInstance) {
    const settings = new BrowserOAuthSettings();
    const services = new BrowserServices({ settings });
    sessionInstance = new PersistentOAuthSession(services);
  }
  return sessionInstance;
};

export const getLookerSDK = (): Looker40SDK => {
  if (!sdkInstance) {
    const session = getLookerSession();
    sdkInstance = new Looker40SDK(session);
  }
  return sdkInstance;
};

export const resetLookerSession = (): void => {
  if (sessionInstance) {
    sessionInstance.clearStorage();
  }
  sessionInstance = null;
  sdkInstance = null;
};
