#!/usr/bin/env node
/**
 * Looker LookML Explore Introspection CLI
 *
 * Inspects dimensions and measures for any LookML model & explore directly
 * from your Looker instance without requiring manual UI exploration.
 *
 * Usage:
 *   npx tsx scripts/introspect-explore.ts --model <model> --view <view> [--json]
 *   npm run looker:explore -- --model nyc_citibike_trips --view trips
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const loadLocalEnvSecrets = () => {
  const envPaths = [
    path.join(rootDir, '.env'),
    path.join(process.env.HOME || '', '.env_looker'),
    path.join(process.env.HOME || '', '.env_secrets'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const [k, ...v] = trimmed.split('=');
        if (k && v.length > 0 && !process.env[k.trim()]) {
          let val = v.join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[k.trim()] = val;
        }
      });
    }
  }
};

loadLocalEnvSecrets();

if (process.env.LOOKER_VERIFY_SSL === 'false' || process.env.LOOKER_VERIFY_SSL === '0' || !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const getBaseUrl = (): string => {
  let url = process.env.LOOKER_BASE_URL || process.env.LOOKERSDK_BASE_URL || process.env.VITE_LOOKER_BASE_URL || 'https://your-company.looker.com';
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    }
  }

  return options;
};

async function getAccessToken(baseUrl: string): Promise<string> {
  if (process.env.LOOKER_ACCESS_TOKEN) return process.env.LOOKER_ACCESS_TOKEN;
  if (process.env.LOOKERSDK_ACCESS_TOKEN) return process.env.LOOKERSDK_ACCESS_TOKEN;

  const clientId = process.env.LOOKER_CLIENT_ID || process.env.LOOKERSDK_CLIENT_ID;
  const clientSecret = process.env.LOOKER_CLIENT_SECRET || process.env.LOOKERSDK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing LOOKER_CLIENT_ID or LOOKER_CLIENT_SECRET credentials in .env');
  }

  const res = await fetch(`${baseUrl}/api/4.0/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Looker authentication failed (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

interface LookMLField {
  name: string;
  label: string;
  type: string;
  description?: string;
  hidden?: boolean;
}

interface ExploreResponse {
  name: string;
  label?: string;
  description?: string;
  fields?: {
    dimensions?: LookMLField[];
    measures?: LookMLField[];
  };
}

async function main() {
  const options = parseArgs();
  const model = options.model as string;
  const view = options.view as string;
  const isJson = Boolean(options.json);

  if (!model || !view) {
    console.error('Usage: npx tsx scripts/introspect-explore.ts --model <model> --view <view> [--json]');
    console.error('Example: npm run looker:explore -- --model nyc_citibike_trips --view trips');
    process.exit(1);
  }

  const baseUrl = getBaseUrl();
  const token = await getAccessToken(baseUrl);

  const res = await fetch(
    `${baseUrl}/api/4.0/lookml_models/${encodeURIComponent(model)}/explores/${encodeURIComponent(view)}?fields=name,label,description,fields(dimensions(name,label,type,description,hidden),measures(name,label,type,description,hidden))`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Failed to introspect explore ${model}::${view} (${res.status}): ${errText}`);
    process.exit(1);
  }

  const data = (await res.json()) as ExploreResponse;

  if (isJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const dimensions = (data.fields?.dimensions || []).filter((d) => !d.hidden);
  const measures = (data.fields?.measures || []).filter((m) => !m.hidden);

  console.log(`\n======================================================`);
  console.log(`LookML Explore: ${model} :: ${view}`);
  if (data.label) console.log(`Label: ${data.label}`);
  if (data.description) console.log(`Description: ${data.description}`);
  console.log(`======================================================\n`);

  console.log(`📊 MEASURES (${measures.length})`);
  console.log(`--------------------------------------------------------------------------------`);
  measures.forEach((m) => {
    console.log(`• ${m.name.padEnd(35)} [${m.type.padEnd(10)}] - ${m.label}`);
    if (m.description) console.log(`    Description: ${m.description}`);
  });

  console.log(`\n📐 DIMENSIONS (${dimensions.length})`);
  console.log(`--------------------------------------------------------------------------------`);
  dimensions.forEach((d) => {
    console.log(`• ${d.name.padEnd(35)} [${d.type.padEnd(10)}] - ${d.label}`);
    if (d.description) console.log(`    Description: ${d.description}`);
  });
  console.log(`\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
