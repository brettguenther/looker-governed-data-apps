/**
 * Node-compatible Looker OAuth 2.0 PKCE session.
 *
 * @looker/sdk-rtl's OAuthSession already implements the complete PKCE protocol
 * (authorization URL construction, code redemption, and refresh-token
 * rotation). Its browser coupling is limited to a few members that touch
 * sessionStorage and window.location, so we subclass and override only those.
 *
 * This guarantees the CLI and the browser Host Shell (src/looker/auth/session.ts)
 * speak a byte-identical protocol, rather than maintaining a second
 * hand-rolled PKCE implementation that could drift.
 */

import { Looker40SDK } from '@looker/sdk/lib/4.0/methods';
import {
  BrowserServices,
  BrowserTransport,
  OAuthSession,
  AuthToken,
  agentPrefix,
  type IApiSettings,
  type IApiSection,
} from '@looker/sdk-rtl';

import { getCliLookerConfig, type CliLookerConfig } from './config.js';
import { NodeCryptoHash } from './crypto.js';
import { awaitAuthorizationCode, openBrowser, isHeadless } from './loopback.js';
import { readCredentials, writeCredentials, clearCredentials } from './token-store.js';

class NodeApiSettings implements IApiSettings {
  base_url: string;
  looker_url: string;
  client_id: string;
  redirect_uri: string;
  verify_ssl = true;
  timeout = 120;
  agentTag = 'LookerGenDataAppsCLI/1.0';

  constructor(config: CliLookerConfig) {
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

export class NodeOAuthSession extends OAuthSession {
  private verifier: string | null = null;
  private readonly config: CliLookerConfig;

  constructor(config: CliLookerConfig) {
    const settings = new NodeApiSettings(config);
    const services = new BrowserServices({
      settings,
      transport: new BrowserTransport(settings),
      crypto: new NodeCryptoHash(),
    });
    super(services);
    this.config = config;
    this.hydrateFromStore();
  }

  /* -- Overrides replacing sessionStorage with process-local state -------- */

  override get code_verifier(): string | null {
    return this.verifier;
  }

  override set code_verifier(value: string | null) {
    this.verifier = value;
  }

  /** Not applicable: the CLI never navigates a page, so there is no return URL. */
  override get returnUrl(): string | null {
    return null;
  }

  override set returnUrl(_value: string | null) {
    /* no-op */
  }

  override clearStorage(): void {
    this.verifier = null;
    clearCredentials(this.config.baseUrl, this.config.clientId);
  }

  /* -- Persistence -------------------------------------------------------- */

  hydrateFromStore(): void {
    const stored = readCredentials(this.config.baseUrl, this.config.clientId);
    if (!stored) return;

    this.activeToken.setToken({
      access_token: stored.access_token || '',
      refresh_token: stored.refresh_token,
      token_type: 'Bearer',
      expires_in: 0,
    });

    if (stored.expires_at) {
      this.activeToken.expiresAt = new Date(stored.expires_at);
    }
  }

  persistToStore(): void {
    if (!this.activeToken.refresh_token && !this.activeToken.access_token) return;

    writeCredentials({
      base_url: this.config.baseUrl,
      client_id: this.config.clientId,
      refresh_token: this.activeToken.refresh_token,
      access_token: this.activeToken.access_token,
      expires_at: this.activeToken.expiresAt?.toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  override async getToken(): Promise<AuthToken> {
    const token = await super.getToken();
    this.persistToStore();
    return token;
  }

  /* -- Interactive loopback login ----------------------------------------- */

  override async login(): Promise<AuthToken> {
    if (this.isAuthenticated()) {
      return this.activeToken;
    }

    // A stored refresh token means we can authenticate without user interaction.
    if (this.activeToken.refresh_token) {
      try {
        const refreshed = await this.getToken();
        if (refreshed.isActive()) return refreshed;
      } catch {
        // Refresh token was revoked or expired; fall through to interactive login.
        this.activeToken = new AuthToken();
      }
    }

    const state = new NodeCryptoHash().secureRandom(16);
    const authUrl = await this.createAuthCodeRequestUrl('cors_api', state);
    const headless = isHeadless();

    // Start listening before opening the browser to avoid a redirect race.
    const pendingCode = awaitAuthorizationCode(
      this.config.port,
      state,
      this.config.baseUrl
    );

    console.log(`\nSign in to ${this.config.baseUrl} by opening this URL:\n`);
    console.log(`  ${authUrl}\n`);

    if (headless) {
      // A headless host cannot render the consent screen, and `xdg-open`
      // reports success there while doing nothing, so never claim we opened it.
      console.log('No display detected, so the browser was not launched for you.');
      console.log('If you are signing in from another machine, forward the port first:\n');
      console.log(`  ssh -L ${this.config.port}:localhost:${this.config.port} <this-host>\n`);
    } else {
      openBrowser(authUrl);
    }

    console.log(`Waiting for the callback on ${this.config.redirectUri} ...`);


    const { code } = await pendingCode;
    await this.redeemAuthCode(code, this.code_verifier || undefined);
    this.persistToStore();
    return this.activeToken;
  }

  override async logout(): Promise<boolean> {
    try {
      return await super.logout();
    } finally {
      this.clearStorage();
    }
  }

  getConfig(): CliLookerConfig {
    return this.config;
  }
}

let sessionInstance: NodeOAuthSession | null = null;

export const getNodeLookerSession = (): NodeOAuthSession => {
  if (!sessionInstance) {
    sessionInstance = new NodeOAuthSession(getCliLookerConfig());
  }
  return sessionInstance;
};

export const getNodeLookerSDK = (): Looker40SDK => {
  return new Looker40SDK(getNodeLookerSession());
};

// `agentPrefix` is re-exported so callers can tag ad-hoc requests consistently.
export { agentPrefix };
