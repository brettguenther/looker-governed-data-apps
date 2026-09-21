import type { IUser } from '@looker/sdk/lib/4.0/models';

export interface LookerQueryPayload {
  model: string;
  view: string;
  fields: string[];
  pivots?: string[];
  filters?: Record<string, string>;
  sorts?: string[];
  limit?: string | number;
  column_limit?: string;
  total?: boolean;
  row_total?: string;
  subtotals?: string[];
  dynamic_fields?: string | Array<Record<string, unknown>>;
  query_timezone?: string;
  vis_config?: Record<string, unknown>;
}

export type LookerUser = Partial<IUser>;

export interface FilterState {
  year?: string;
  dateRange?: string;
  category?: string;
  salesChannel?: string;
  [key: string]: string | undefined;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: number;
  changePeriod?: string;
  icon?: string;
  format?: 'currency' | 'number' | 'percent';
  loading?: boolean;
  error?: string | null;
}

export interface ChartSeriesConfig {
  dataKey: string;
  name?: string;
  color?: string;
}

export interface RegisteredQuery {
  name: string;
  payload: LookerQueryPayload;
  executionTimeMs?: number | null;
  status: 'success' | 'loading' | 'error';
  fromCache?: boolean;
}

export interface GovernedAppProps {
  onRegisterQueries?: (queries: RegisteredQuery[]) => void;
}

