/**
 * Credential precedence chain shared by the CLI validation scripts.
 *
 * Priority order:
 *   1. --token <value>                       explicit override, always wins
 *   2. LOOKER_ACCESS_TOKEN / LOOKERSDK_...   CI-friendly
 *   3. stored refresh token                  silent, no user interaction
 *   4. interactive browser login             TTY only
 *   5. LOOKER_CLIENT_ID + CLIENT_SECRET      service-account fallback
 */

import { getBaseUrl, getCliLookerConfig, loadLocalEnvSecrets } from './config.js';
import { readCredentials } from './token-store.js';
import { NodeOAuthSession } from './session.js';

export interface ResolveOptions {
  /** Token supplied via --token. */
  suppliedToken?: string;
  /** Allow opening a browser. Defaults to auto-detection. */
  interactive?: boolean;
}

const isInteractiveShell = (): boolean =>
  Boolean(process.stdout.isTTY) && !process.env.CI;

const loginWithClientCredentials = async (): Promise<string | null> => {
  const clientId = process.env.LOOKER_CLIENT_ID || process.env.LOOKERSDK_CLIENT_ID;
  const clientSecret =
    process.env.LOOKER_CLIENT_SECRET || process.env.LOOKERSDK_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const res = await fetch(`${getBaseUrl()}/api/4.0/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!res.ok) {
    throw new Error(`Looker login failed (HTTP ${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
};

export const resolveAccessToken = async (opts: ResolveOptions = {}): Promise<string> => {
  loadLocalEnvSecrets();

  // 1. Explicit flag
  if (opts.suppliedToken) return opts.suppliedToken;

  // 2. Environment
  const envToken = process.env.LOOKER_ACCESS_TOKEN || process.env.LOOKERSDK_ACCESS_TOKEN;
  if (envToken) return envToken;

  const interactive = opts.interactive ?? isInteractiveShell();

  // 3 and 4. Stored refresh token, then interactive login.
  let oauthError: string | null = null;
  try {
    const config = getCliLookerConfig();
    const stored = readCredentials(config.baseUrl, config.clientId);
    const session = new NodeOAuthSession(config);

    if (stored?.refresh_token) {
      const token = await session.getToken();
      if (token.isActive() && token.access_token) return token.access_token;
    }

    if (interactive) {
      const token = await session.login();
      if (token.access_token) return token.access_token;
    }
  } catch (err) {
    oauthError = err instanceof Error ? err.message : String(err);
  }

  // 5. Service-account client credentials
  const credentialToken = await loginWithClientCredentials();
  if (credentialToken) return credentialToken;

  throw new Error(
    [
      'No Looker credentials available.',
      oauthError ? `  OAuth attempt failed: ${oauthError}` : '',
      '',
      interactive
        ? 'Run `npm run auth:login` to sign in through your browser.'
        : 'This is a non-interactive shell. Provide --token <access_token>, set LOOKER_ACCESS_TOKEN,\n' +
          'or configure LOOKER_CLIENT_ID and LOOKER_CLIENT_SECRET.',
    ]
      .filter(Boolean)
      .join('\n')
  );
};
