---
name: generate-governed-app
description: End-to-end workflow, architectural standards, and validation procedures for AI agents to generate, validate, and register new governed Looker data applications in the host shell.
---

# Looker Governed AI Data App Generation Skill

This skill guides AI agents (like Claude) through generating new, high-performance, governed data applications backed by Looker's semantic layer via direct browser CORS API and OAuth 2.0 PKCE.

---

## 1. Architectural Roles & Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AI Agent Client (Claude)                                 │
│    • Explores LookML semantic layer (Looker MCP)            │
│    • Scaffolds app files: queries.ts & <Name>App.tsx        │
│    • Registers app in src/apps/registry.ts                  │
│    • Runs validation harness before completing task         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Verified & Registered
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Governed Host Shell (Runtime Platform)                   │
│    • User logs in via OAuth 2.0 PKCE                        │
│    • Header App Switcher allows switching between apps      │
│    • Direct browser CORS API execution with Looker RLS      │
│    • Deep-link URL routing (/?app=<app-id>)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step App Generation Workflow

### Step 1: Semantic Exploration via Looker MCP

Before writing code, inspect the target model and explore using Looker MCP tools:

1. `get_dashboards` or `query` to understand relevant business questions.
2. Introspect dimensions and measures to prevent field name hallucinations.
   - _Rule_: Always use the exact `<view_name>.<field_name>` syntax (e.g. `basic_order_items.created_at_month`, not `basic_order_items.created_month`).
3. Query field value suggestions using `get_field_value_suggestions` for dropdown filters.

---

### Step 2: Bootstrap via the Scaffolder CLI

Use the built-in scaffolder script to bootstrap the directory, files, and registry entry:

```bash
npm run scaffold:app -- --id <app-id> --name "<Human App Name>" --model <model_name> --view <explore_name> --category "<Category>"
```

_Example_:

```bash
npm run scaffold:app -- --id inventory-analytics --name "Inventory & Logistics" --model supply_chain --view inventory_items --category "Operations"
```

This creates:

- `src/apps/<app-id>/queries.ts`
- `src/apps/<app-id>/<PascalCase>App.tsx`
- Automatically registers the app in `src/apps/registry.ts`.

---

### Step 3: Implement Declarative Queries (`queries.ts`)

Formulate typed query builders adhering to `LookerQueryPayload`. Reference `.agents/skills/looker-queries/` for chart-specific dimension/measure rules:

```typescript
import type { LookerQueryPayload } from "../../types/looker";

export const buildKpiQuery = (
  filters: Record<string, string>,
): LookerQueryPayload => ({
  model: "supply_chain",
  view: "inventory_items",
  fields: [
    "inventory_items.total_cost",
    "inventory_items.count",
    "inventory_items.average_days_in_stock",
  ],
  filters,
  limit: 1,
  vis_config: { type: "single_value" },
});

export const buildCategoryBreakdownQuery = (
  filters: Record<string, string>,
): LookerQueryPayload => ({
  model: "supply_chain",
  view: "inventory_items",
  fields: ["products.category", "inventory_items.total_cost"],
  filters: {
    ...filters,
    "products.category": "-NULL",
  },
  sorts: ["inventory_items.total_cost desc"],
  limit: 10,
  vis_config: { type: "looker_donut" },
});
```

---

### Step 4: Implement Interactive UI Component (`<PascalCase>App.tsx`)

Implement the standard contract:

- Component accepts `GovernedAppProps` (`{ onRegisterQueries }`).
- Use `useLookerQuery` with `useMemo` wrapped query payloads.
- Connect dynamic filter controls to query parameters.
- Use shared UI components:
  - `<MetricCard title="..." value={...} format="currency|number|percent" loading={...} error={...} />`
  - `<DataChart title="..." type="area|bar|line|donut" data={...} xKey="..." yKey="..." loading={...} error={...} />`
  - `<DataTable title="..." data={...} columns={...} loading={...} error={...} />`
- Register queries with `onRegisterQueries` in a `useEffect` so they appear in the Query Inspector.

---

### Step 5: Execute Validation Gates (MANDATORY)

Before notifying the user that the app is ready, you **MUST** run the validation suite:

#### 1. MCP-Native Semantic Query Validation (Zero Local Credentials Required):

For every query function defined in `queries.ts`, use your active **Looker MCP connection** to dry-run the query:

- Call `query_sql`, or `query` with **`limit: 0`**, passing the exact `model`, `explore`, `fields`, and `filters` payload.
- **Always use `limit: 0`.** Looker still compiles the full SQL and the database still plans it, so field names, joins, and filter syntax are fully verified, but zero rows are scanned and no warehouse compute is billed on most dialects. Never dry-run with a non-zero limit.
- **If it compiles to SQL**: The semantic model, dimensions, measures, and filter syntax are 100% verified.
- **If Looker returns an error** (e.g., `Field not found`): Inspect the explore schema via `get_dimensions` / `get_measures`, fix the field names in `queries.ts`, and re-test.

> [!NOTE]
> Because Claude performs this semantic compilation check directly through its active Looker MCP session, **business users do not need to configure any Looker API credentials or access tokens in their local terminal environment.**

#### 2. App Contract & TypeScript Validation (Local, Zero-Auth):

```bash
npm run validate:app <app-id>
```

- **What it does**: Verifies required files (`queries.ts`, `*App.tsx`), checks registration in `src/apps/registry.ts`, and executes `tsc --noEmit`.
- This check is purely local and requires zero Looker tokens or network calls.

#### 3. Full Project Build:

```bash
npm run build
```

- Verifies that the app compiles into its isolated lazy chunk and all imports resolve cleanly.

#### Fallback: When Looker MCP Is Unavailable

If you have no Looker MCP connection, fall back to the CLI validator:

```bash
npm run validate:queries <app-id>
```

If it reports missing credentials, instruct the user to run `npm run auth:login`, which opens a browser for a one-time Looker sign-in. **Never attempt to locate, extract, or read Looker tokens from the user's keychain, shell history, or credential files.**

---

### Step 6: User Hand-Off & Deep-Link

Provide the user with the direct deep-link to the new application:

```
http://localhost:3000/?app=<app-id>
```

The user opens the link and authenticates seamlessly via browser OAuth 2.0 PKCE. All semantic queries are guaranteed valid.
