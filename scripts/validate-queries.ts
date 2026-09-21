#!/usr/bin/env node
/**
 * Looker Semantic Query Validator
 *
 * Validates that queries defined in an application's queries.ts file
 * are syntactically and semantically valid against Looker's LookML models.
 *
 * Authentication is delegated to scripts/auth/resolve.ts, which tries in order:
 * 1. CLI flag: --token <token>
 * 2. Environment variables: LOOKER_ACCESS_TOKEN or LOOKERSDK_ACCESS_TOKEN
 * 3. Stored OAuth refresh token (silent refresh, see `npm run auth:login`)
 * 4. Interactive browser login (TTY sessions only)
 * 5. Client credentials: LOOKER_CLIENT_ID + LOOKER_CLIENT_SECRET
 *
 * Usage:
 *   npx tsx scripts/validate-queries.ts <app-id> [--token <access_token>]
 *   npx tsx scripts/validate-queries.ts all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getBaseUrl, loadLocalEnvSecrets } from './auth/config.js';
import { resolveAccessToken } from './auth/resolve.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to parse CLI arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  let appId = '';
  let token = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      appId = args[i];
    }
  }

  return { appId: appId || 'basic-ecomm', token };
};

loadLocalEnvSecrets();

if (process.env.LOOKER_VERIFY_SSL === 'false' || process.env.LOOKER_VERIFY_SSL === '0' || !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}


// Dry-run query against Looker SQL compilation API
const dryRunQuery = async (
  baseUrl: string,
  token: string,
  queryPayload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; sqlSnippet?: string }> => {
  const url = `${baseUrl}/api/4.0/queries/run/sql`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...queryPayload,
        // `queries/run/sql` compiles without executing, and LIMIT 0 keeps the
        // emitted SQL free to run on most dialects if anyone copies it out.
        limit: '0',
      }),
    });

    if (res.ok) {
      const sql = await res.text();
      return { ok: true, sqlSnippet: sql.trim().replace(/\s+/g, ' ').slice(0, 120) };
    }

    const errText = await res.text();
    let parsedMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      parsedMsg = parsed.message || parsed.error || errText;
    } catch {
      // ignore
    }
    return { ok: false, error: `HTTP ${res.status}: ${parsedMsg}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
};

async function validateAppQueries(appId: string, baseUrl: string, token: string) {
  console.log(`\n======================================================`);
  console.log(`Validating queries for app: [${appId}]`);
  console.log(`Looker Instance: ${baseUrl}`);
  console.log(`======================================================\n`);

  const queriesFilePath = path.join(rootDir, 'src', 'apps', appId, 'queries.ts');
  if (!fs.existsSync(queriesFilePath)) {
    console.error(`❌ Error: queries.ts not found at ${queriesFilePath}`);
    return false;
  }

  // Import queries module
  const queriesModule = await import(queriesFilePath);
  const exportedFunctions = Object.entries(queriesModule).filter(
    ([, value]) => typeof value === 'function'
  );

  if (exportedFunctions.length === 0) {
    console.warn(`⚠️ Warning: No query builder functions exported in ${queriesFilePath}`);
    return true;
  }

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of exportedFunctions) {
    let payload: Record<string, unknown> | null = null;
    try {
      // Execute query builder with empty / default filters
      payload = (fn as (filters: Record<string, string>) => Record<string, unknown>)({});
    } catch (err) {
      console.error(`❌ [FAIL] ${name}(): failed to evaluate function: ${err}`);
      failed++;
      continue;
    }

    if (!payload || !payload.model || !payload.view || !Array.isArray(payload.fields)) {
      console.error(
        `❌ [FAIL] ${name}(): Returned payload must have 'model', 'view', and 'fields' array.`
      );
      failed++;
      continue;
    }

    process.stdout.write(`• Checking ${name}... `);
    const result = await dryRunQuery(baseUrl, token, payload);

    if (result.ok) {
      console.log(`✅ PASS`);
      console.log(
        `  model: ${payload.model} | view: ${payload.view} | fields: [${payload.fields.join(', ')}]`
      );
      if (result.sqlSnippet) {
        console.log(`  SQL: ${result.sqlSnippet}...`);
      }
      passed++;
    } else {
      console.log(`❌ FAIL`);
      console.log(`  model: ${payload.model} | view: ${payload.view}`);
      console.log(`  fields: [${payload.fields.join(', ')}]`);
      console.error(`  Error: ${result.error}`);
      failed++;
    }
  }

  console.log(`\nSummary for ${appId}: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  return failed === 0;
}

async function main() {
  const { appId, token: suppliedToken } = parseArgs();
  const baseUrl = getBaseUrl();

  let token: string;
  try {
    token = await resolveAccessToken({ suppliedToken });
  } catch (err) {
    console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }

  let allSuccess = true;

  if (appId === 'all') {
    const appsDir = path.join(rootDir, 'src', 'apps');
    const entries = fs.readdirSync(appsDir, { withFileTypes: true });
    const appDirs = entries
      .filter((e) => e.isDirectory() && e.name !== 'app-generator')
      .map((e) => e.name);

    for (const dir of appDirs) {
      const success = await validateAppQueries(dir, baseUrl, token);
      if (!success) allSuccess = false;
    }
  } else {
    allSuccess = await validateAppQueries(appId, baseUrl, token);
  }

  if (!allSuccess) {
    console.error('\n❌ Query validation failed for one or more queries.');
    process.exit(1);
  } else {
    console.log('\n🎉 All Looker semantic queries validated successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});
