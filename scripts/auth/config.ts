/**
 * Node-side Looker configuration resolution for CLI tooling.
 *
 * Mirrors src/looker/config.ts but reads from process.env (Node) instead of
 * import.meta.env (Vite), and additionally resolves the loopback OAuth settings
 * used by the interactive `npm run auth:login` flow.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

let envLoaded = false;

/**
 * Loads environment variables from local dotenv-style files without adding a
 * dependency. Existing process.env values always win so that CI and explicit
 * shell exports are never silently overridden.
 */
export const loadLocalEnvSecrets = (): void => {
  if (envLoaded) return;
  envLoaded = true;

  const homeDir = process.env.HOME || os.homedir();
  const envCandidates = [
    path.join(rootDir, '.env'),
    path.join(homeDir, '.env_looker'),
    path.join(homeDir, '.env_secrets'),
  ];

  for (const envFile of envCandidates) {
    if (!fs.existsSync(envFile)) continue;
    const content = fs.readFileSync(envFile, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(
        /^(?:export\s+)?([A-Za-z0-9_]+)=(?:"([^"]*)"|'([^']*)'|([^#\s]+))/
      );
      if (match) {
        const key = match[1];
        const val = match[2] || match[3] || match[4] || '';
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
};

export interface CliLookerConfig {
  /** Looker instance base URL with any trailing slashes stripped. */
  baseUrl: string;
  /** OAuth client_guid registered by a Looker admin for CLI use. */
  clientId: string;
  /** Loopback redirect URI. Must exactly match the registered redirect_uri. */
  redirectUri: string;
  /** Loopback port parsed from redirectUri. */
  port: number;
}

export const DEFAULT_OAUTH_CLIENT_ID = 'looker-ai-data-apps-cli';
export const DEFAULT_OAUTH_PORT = 8000;

export const getBaseUrl = (): string => {
  loadLocalEnvSecrets();
  const url =
    process.env.LOOKER_BASE_URL ||
    process.env.LOOKERSDK_BASE_URL ||
    process.env.VITE_LOOKER_BASE_URL ||
    '';
  return url.replace(/\/+$/, '');
};

export const getCliLookerConfig = (): CliLookerConfig => {
  loadLocalEnvSecrets();

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'Missing Looker instance URL. Set LOOKER_BASE_URL (or VITE_LOOKER_BASE_URL) in your environment or .env file.'
    );
  }

  const clientId = process.env.LOOKER_OAUTH_CLIENT_ID || DEFAULT_OAUTH_CLIENT_ID;

  const port = Number(process.env.LOOKER_OAUTH_PORT || DEFAULT_OAUTH_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid LOOKER_OAUTH_PORT: ${process.env.LOOKER_OAUTH_PORT}`);
  }

  const redirectUri =
    process.env.LOOKER_OAUTH_REDIRECT_URI || `http://localhost:${port}/callback`;

  return { baseUrl, clientId, redirectUri, port };
};
