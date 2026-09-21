/**
 * Persistent credential storage for the Looker CLI OAuth session.
 *
 * The refresh token is a long-lived secret. It is written to the user's home
 * directory with restrictive permissions (0600 file inside a 0700 directory),
 * matching the convention used by gcloud, gh, and stripe. The OS keychain was
 * evaluated and rejected because it requires a natively-compiled dependency,
 * which is a poor trade for non-technical users running `npm install`.
 *
 * Credentials are keyed by instance + client so engineers can switch between
 * development and production Looker instances without clobbering each other.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const CREDENTIALS_DIR = path.join(os.homedir(), '.looker-ai-data-apps');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

export interface StoredCredentials {
  base_url: string;
  client_id: string;
  refresh_token?: string;
  access_token?: string;
  /** ISO-8601 expiry of access_token. */
  expires_at?: string;
  updated_at: string;
}

interface CredentialsFile {
  version: 1;
  accounts: Record<string, StoredCredentials>;
}

const accountKey = (baseUrl: string, clientId: string): string =>
  `${baseUrl.replace(/\/+$/, '')}::${clientId}`;

const readFileSafe = (): CredentialsFile => {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return { version: 1, accounts: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as CredentialsFile;
    if (!parsed || parsed.version !== 1 || typeof parsed.accounts !== 'object') {
      return { version: 1, accounts: {} };
    }
    return parsed;
  } catch {
    // A corrupt store should never block the user; treat it as empty.
    return { version: 1, accounts: {} };
  }
};

export const readCredentials = (
  baseUrl: string,
  clientId: string
): StoredCredentials | null => {
  const store = readFileSafe();
  return store.accounts[accountKey(baseUrl, clientId)] || null;
};

export const writeCredentials = (creds: StoredCredentials): void => {
  const store = readFileSafe();
  store.accounts[accountKey(creds.base_url, creds.client_id)] = {
    ...creds,
    updated_at: new Date().toISOString(),
  };

  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
  // mkdirSync/writeFileSync honor mode only on creation; enforce on every write.
  fs.chmodSync(CREDENTIALS_DIR, 0o700);
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
};

export const clearCredentials = (baseUrl?: string, clientId?: string): boolean => {
  if (!fs.existsSync(CREDENTIALS_FILE)) return false;

  if (!baseUrl || !clientId) {
    fs.rmSync(CREDENTIALS_FILE, { force: true });
    return true;
  }

  const store = readFileSafe();
  const key = accountKey(baseUrl, clientId);
  if (!store.accounts[key]) return false;

  delete store.accounts[key];
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
  return true;
};

export const getCredentialsPath = (): string => CREDENTIALS_FILE;
