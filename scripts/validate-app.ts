#!/usr/bin/env node
/**
 * Governed Data App Contract & TypeScript Validator
 *
 * Verifies that an app adheres to the host shell contract:
 * 1. Required files exist: queries.ts, *App.tsx
 * 2. Registered in src/apps/registry.ts
 * 3. TypeScript compiles with zero errors (tsc --noEmit)
 *
 * Usage:
 *   npx tsx scripts/validate-app.ts <app-id>
 *   npx tsx scripts/validate-app.ts all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  return args[0] || 'all';
};

const validateAppStructure = (appId: string): { ok: boolean; errors: string[] } => {
  const errors: string[] = [];
  const appDir = path.join(rootDir, 'src', 'apps', appId);

  if (!fs.existsSync(appDir)) {
    errors.push(`App directory not found: ${appDir}`);
    return { ok: false, errors };
  }

  const queriesFile = path.join(appDir, 'queries.ts');
  if (!fs.existsSync(queriesFile)) {
    errors.push(`Missing queries.ts in ${appDir}`);
  }

  // Look for any *App.tsx file
  const appFiles = fs.readdirSync(appDir);
  const mainAppFile = appFiles.find((f) => f.endsWith('App.tsx'));
  if (!mainAppFile) {
    errors.push(`Missing *App.tsx component file in ${appDir}`);
  }

  // Check registry.ts
  const registryFile = path.join(rootDir, 'src', 'apps', 'registry.ts');
  if (fs.existsSync(registryFile)) {
    const registryContent = fs.readFileSync(registryFile, 'utf-8');
    if (!registryContent.includes(`'${appId}':`) && !registryContent.includes(`"${appId}":`)) {
      errors.push(`App [${appId}] is not registered in src/apps/registry.ts!`);
    }
  } else {
    errors.push(`src/apps/registry.ts does not exist!`);
  }

  return { ok: errors.length === 0, errors };
};

async function main() {
  const target = parseArgs();
  console.log(`\n======================================================`);
  console.log(`Validating Host Shell App Contract: [${target}]`);
  console.log(`======================================================\n`);

  let appIds: string[] = [];
  if (target === 'all') {
    const appsDir = path.join(rootDir, 'src', 'apps');
    const entries = fs.readdirSync(appsDir, { withFileTypes: true });
    appIds = entries
      .filter((e) => e.isDirectory() && e.name !== 'app-generator')
      .map((e) => e.name);
  } else {
    appIds = [target];
  }

  let structureOk = true;
  for (const appId of appIds) {
    process.stdout.write(`• Checking structure & registry for [${appId}]... `);
    const { ok, errors } = validateAppStructure(appId);
    if (ok) {
      console.log(`✅ OK`);
    } else {
      console.log(`❌ FAIL`);
      errors.forEach((e) => console.error(`  - ${e}`));
      structureOk = false;
    }
  }

  if (!structureOk) {
    console.error('\n❌ App structure validation failed.');
    process.exit(1);
  }

  // Run TypeScript check
  process.stdout.write('\n• Running TypeScript check (tsc --noEmit)... ');
  try {
    execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'pipe' });
    console.log('✅ Typecheck Passed');
  } catch (err: unknown) {
    console.log('❌ Typecheck Failed');
    if (err && typeof err === 'object' && 'stdout' in err) {
      console.error(String((err as { stdout: Buffer }).stdout));
    } else {
      console.error(err);
    }
    process.exit(1);
  }

  console.log('\n🎉 All app contracts and TypeScript types validated successfully!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
