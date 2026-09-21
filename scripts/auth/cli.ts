#!/usr/bin/env node
/**
 * Looker CLI authentication commands.
 *
 * Usage:
 *   npm run auth:login     Sign in through the browser (OAuth 2.0 PKCE)
 *   npm run auth:status    Show the currently authenticated user
 *   npm run auth:logout    Revoke the session and delete stored credentials
 */

import { Looker40SDK } from '@looker/sdk/lib/4.0/methods';

import { getCliLookerConfig } from './config.js';
import { getNodeLookerSession } from './session.js';
import { readCredentials, getCredentialsPath, clearCredentials } from './token-store.js';

const describeUser = async (session: ReturnType<typeof getNodeLookerSession>) => {
  const sdk = new Looker40SDK(session);
  const me = await sdk.ok(sdk.me());
  return me;
};

const commandLogin = async (): Promise<number> => {
  const config = getCliLookerConfig();
  const session = getNodeLookerSession();

  if (session.isAuthenticated()) {
    const me = await describeUser(session);
    console.log(`\nAlready signed in as ${me.display_name} <${me.email}>`);
    console.log(`Instance: ${config.baseUrl}\n`);
    return 0;
  }

  await session.login();

  const me = await describeUser(session);
  console.log(`Signed in as ${me.display_name} <${me.email}>`);
  console.log(`Instance:    ${config.baseUrl}`);
  console.log(`Credentials: ${getCredentialsPath()} (mode 0600)\n`);
  return 0;
};

const commandStatus = async (): Promise<number> => {
  const config = getCliLookerConfig();
  const stored = readCredentials(config.baseUrl, config.clientId);

  console.log(`\nInstance:    ${config.baseUrl}`);
  console.log(`OAuth client: ${config.clientId}`);
  console.log(`Redirect URI: ${config.redirectUri}`);

  if (!stored) {
    console.log(`\nNot signed in. Run \`npm run auth:login\` to authenticate.\n`);
    return 1;
  }

  console.log(`Credentials: ${getCredentialsPath()}`);
  console.log(`Last updated: ${stored.updated_at}`);

  const session = getNodeLookerSession();
  try {
    const me = await describeUser(session);
    console.log(`\nAuthenticated as ${me.display_name} <${me.email}>\n`);
    return 0;
  } catch (err) {
    console.log(
      `\nStored credentials could not be used: ${err instanceof Error ? err.message : String(err)}`
    );
    console.log('Run `npm run auth:login` to sign in again.\n');
    return 1;
  }
};

const commandLogout = async (): Promise<number> => {
  const config = getCliLookerConfig();
  const stored = readCredentials(config.baseUrl, config.clientId);

  if (!stored) {
    console.log('\nNo stored credentials to remove.\n');
    return 0;
  }

  const session = getNodeLookerSession();
  try {
    await session.logout();
  } catch {
    // The remote session may already be invalid; local cleanup still matters.
    clearCredentials(config.baseUrl, config.clientId);
  }

  console.log(`\nSigned out of ${config.baseUrl} and removed stored credentials.\n`);
  return 0;
};

async function main() {
  const command = process.argv[2] || 'status';

  const handlers: Record<string, () => Promise<number>> = {
    login: commandLogin,
    status: commandStatus,
    logout: commandLogout,
  };

  const handler = handlers[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error('Expected one of: login, status, logout');
    process.exit(2);
  }

  process.exit(await handler());
}

main().catch((err) => {
  console.error(`\nAuthentication error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
