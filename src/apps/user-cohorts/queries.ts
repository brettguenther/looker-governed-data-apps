import type { LookerQueryPayload } from '../../types/looker';

export const buildKpiMetricsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_users.unique_users',
    'basic_order_items.count',
  ],
  filters,
  limit: 1,
  vis_config: { type: 'single_value' },
});

export const buildMainTrendQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_order_items.created_at_month',
    'basic_users.unique_users',
  ],
  filters,
  limit: 30,
  vis_config: { type: 'looker_area' },
});

export const buildDetailedTableQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_users.country',
    'basic_users.gender',
    'basic_users.unique_users',
    'basic_order_items.total_sale_price',
  ],
  filters,
  limit: 50,
  vis_config: { type: 'looker_grid' },
});
