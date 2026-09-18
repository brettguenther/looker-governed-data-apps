#!/usr/bin/env node
/**
 * Looker Governed Data App Scaffolder
 *
 * Scaffolds a new governed data application directory with queries.ts,
 * <PascalName>App.tsx, and automatically registers it in src/apps/registry.ts.
 *
 * Usage:
 *   npx tsx scripts/scaffold-app.ts --id <app-id> --name "<App Name>" --model <model> --view <view> [--category <category>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const toPascalCase = (str: string): string => {
  return str
    .replace(/[-_]([a-z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      options[key] = value;
      if (value !== 'true') i++;
    }
  }

  return options;
};

async function main() {
  const options = parseArgs();
  const appId = options.id;
  const appName = options.name || appId;
  const model = options.model;
  const view = options.view;
  const category = options.category || 'Analytics';

  if (!appId || !model || !view) {
    console.error(
      'Usage: npx tsx scripts/scaffold-app.ts --id <app-id> --name "<App Name>" --model <model> --view <view> [--category <category>]'
    );
    console.error('Example: npx tsx scripts/scaffold-app.ts --id user-cohorts --name "User Cohorts" --model basic_ecomm --view basic_users');
    process.exit(1);
  }

  const pascalName = `${toPascalCase(appId)}App`;
  const targetDir = path.join(rootDir, 'src', 'apps', appId);

  if (fs.existsSync(targetDir)) {
    console.error(`❌ Error: Directory already exists at ${targetDir}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`Scaffolding New Governed Looker App: [${appId}]`);
  console.log(`Component: ${pascalName} | Model: ${model} | View: ${view}`);
  console.log(`======================================================\n`);

  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Create queries.ts
  const queriesContent = `import type { LookerQueryPayload } from '../../types/looker';

export const buildKpiMetricsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: '${model}',
  view: '${view}',
  fields: [
    '${view}.count',
  ],
  filters,
  limit: 1,
  vis_config: { type: 'single_value' },
});

export const buildMainTrendQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: '${model}',
  view: '${view}',
  fields: [
    '${view}.count',
  ],
  filters,
  limit: 30,
  vis_config: { type: 'looker_area' },
});

export const buildDetailedTableQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: '${model}',
  view: '${view}',
  fields: [
    '${view}.count',
  ],
  filters,
  limit: 50,
  vis_config: { type: 'looker_grid' },
});
`;

  fs.writeFileSync(path.join(targetDir, 'queries.ts'), queriesContent, 'utf-8');
  console.log(`✅ Created src/apps/${appId}/queries.ts`);

  // 2. Create <PascalName>App.tsx
  const appComponentContent = `import React, { useState, useMemo, useEffect } from 'react';
import type { GovernedAppProps } from '../../types/looker';
import { MetricCard } from '../../components/common/MetricCard';
import { DataChart } from '../../components/common/DataChart';
import { DataTable } from '../../components/common/DataTable';
import { useLookerQuery } from '../../looker/hooks/useLookerQuery';
import {
  buildKpiMetricsQuery,
  buildMainTrendQuery,
  buildDetailedTableQuery,
} from './queries';
import { Filter, Calendar, RotateCcw } from 'lucide-react';

export interface AppFilterState {
  dateRange: string;
}

export const ${pascalName}: React.FC<GovernedAppProps> = ({ onRegisterQueries }) => {
  const [filters, setFilters] = useState<AppFilterState>({
    dateRange: '30 days',
  });

  const activeFilters = useMemo(() => {
    const queryFilters: Record<string, string> = {};
    if (filters.dateRange) {
      // Map to LookML filter expression
    }
    return queryFilters;
  }, [filters]);

  // Execute governed queries via browser CORS API
  const kpiQuery = useLookerQuery(useMemo(() => buildKpiMetricsQuery(activeFilters), [activeFilters]));
  const trendQuery = useLookerQuery(useMemo(() => buildMainTrendQuery(activeFilters), [activeFilters]));
  const tableQuery = useLookerQuery(useMemo(() => buildDetailedTableQuery(activeFilters), [activeFilters]));

  // Register queries with the Semantic Inspector
  useEffect(() => {
    if (onRegisterQueries) {
      onRegisterQueries([
        {
          name: 'KPI Metrics',
          payload: kpiQuery.queryPayload,
          executionTimeMs: kpiQuery.executionTimeMs,
          status: kpiQuery.loading ? 'loading' : kpiQuery.error ? 'error' : 'success',
        },
        {
          name: 'Trend Over Time',
          payload: trendQuery.queryPayload,
          executionTimeMs: trendQuery.executionTimeMs,
          status: trendQuery.loading ? 'loading' : trendQuery.error ? 'error' : 'success',
        },
        {
          name: 'Details Table',
          payload: tableQuery.queryPayload,
          executionTimeMs: tableQuery.executionTimeMs,
          status: tableQuery.loading ? 'loading' : tableQuery.error ? 'error' : 'success',
        },
      ]);
    }
  }, [
    onRegisterQueries,
    kpiQuery.queryPayload,
    kpiQuery.executionTimeMs,
    kpiQuery.loading,
    kpiQuery.error,
    trendQuery.queryPayload,
    trendQuery.executionTimeMs,
    trendQuery.loading,
    trendQuery.error,
    tableQuery.queryPayload,
    tableQuery.executionTimeMs,
    tableQuery.loading,
    tableQuery.error,
  ]);

  const kpiData = (kpiQuery.data[0] || {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">${appName}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Governed by LookML Model <code className="text-blue-400 font-mono">${model}</code> • Explore{' '}
            <code className="text-purple-400 font-mono">${view}</code>
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-300 font-medium text-sm">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Interactive Filters:</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="7 days" className="bg-slate-900">Last 7 Days</option>
                <option value="30 days" className="bg-slate-900">Last 30 Days</option>
                <option value="90 days" className="bg-slate-900">Last 90 Days</option>
                <option value="365 days" className="bg-slate-900">Last 1 Year</option>
                <option value="" className="bg-slate-900">All Time</option>
              </select>
            </div>
            <button
              onClick={() => setFilters({ dateRange: '30 days' })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Count"
          value={Number(kpiData['${view}.count'] || 0)}
          format="number"
          loading={kpiQuery.loading}
          error={kpiQuery.error}
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <DataChart
          title="Volume Summary"
          type="bar"
          data={trendQuery.data}
          xKey="${view}.count"
          yKey="${view}.count"
          loading={trendQuery.loading}
          error={trendQuery.error}
          height={320}
        />
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <DataTable
          title="Detailed Records"
          data={tableQuery.data}
          columns={[{ key: '${view}.count', label: 'Total Count' }]}
          loading={tableQuery.loading}
          error={tableQuery.error}
        />
      </div>
    </div>
  );
};
`;

  fs.writeFileSync(path.join(targetDir, `${pascalName}.tsx`), appComponentContent, 'utf-8');
  console.log(`✅ Created src/apps/${appId}/${pascalName}.tsx`);

  // 3. Register in src/apps/registry.ts
  const registryPath = path.join(rootDir, 'src', 'apps', 'registry.ts');
  let registryContent = fs.readFileSync(registryPath, 'utf-8');

  // Add import
  const importStatement = `import { ${pascalName} } from './${appId}/${pascalName}';\n`;
  if (!registryContent.includes(pascalName)) {
    registryContent = importStatement + registryContent;
  }

  // Add entry into APP_REGISTRY object
  const registryEntry = `  '${appId}': {
    id: '${appId}',
    name: '${appName}',
    description: 'AI-generated application for ${model} :: ${view}',
    model: '${model}',
    view: '${view}',
    category: '${category}',
    icon: 'Layers',
    component: ${pascalName},
  },
`;

  registryContent = registryContent.replace(
    /export const APP_REGISTRY: Record<string, GovernedAppDefinition> = {/,
    `export const APP_REGISTRY: Record<string, GovernedAppDefinition> = {\n${registryEntry}`
  );

  fs.writeFileSync(registryPath, registryContent, 'utf-8');
  console.log(`✅ Auto-registered [${appId}] in src/apps/registry.ts`);

  console.log(`\n🎉 Scaffolding complete for [${appId}]!`);
  console.log(`\nNext Steps for Claude / Developer:`);
  console.log(`1. Customize dimensions & measures in: src/apps/${appId}/queries.ts`);
  console.log(`2. Dry-run query validation against Looker: npm run validate:queries ${appId}`);
  console.log(`3. Validate app contract and TypeScript: npm run validate:app ${appId}`);
  console.log(`4. Open in browser: http://localhost:3000/?app=${appId}\n`);
}

main().catch((err) => {
  console.error('Fatal error during scaffolding:', err);
  process.exit(1);
});
