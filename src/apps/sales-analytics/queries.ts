import type { LookerQueryPayload } from '../../types/looker';

export const buildKpiQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'edg_orders',
  view: 'fct_orders',
  fields: ['fct_orders.total_sales'],
  filters,
  limit: 1,
  vis_config: { type: 'single_value' },
});

export const buildWeeklySalesQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'edg_orders',
  view: 'fct_orders',
  fields: ['fct_orders.order_date_week', 'fct_orders.total_sales'],
  filters,
  sorts: ['fct_orders.order_date_week asc'],
  limit: 500,
  vis_config: { type: 'looker_area' },
});

export const buildChannelSalesQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'edg_orders',
  view: 'fct_orders',
  fields: ['fct_orders.sales_channel', 'fct_orders.total_sales'],
  filters,
  sorts: ['fct_orders.total_sales desc'],
  limit: 10,
  vis_config: { type: 'looker_column' },
});

export const buildCategorySalesQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'edg_orders',
  view: 'fct_orders',
  fields: ['fct_orders.consolidated_category', 'fct_orders.total_sales'],
  filters,
  sorts: ['fct_orders.total_sales desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildDetailedTableQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'edg_orders',
  view: 'fct_orders',
  fields: [
    'fct_orders.order_date_week',
    'fct_orders.sales_channel',
    'fct_orders.consolidated_category',
    'fct_orders.total_sales',
  ],
  filters,
  sorts: ['fct_orders.total_sales desc'],
  limit: 50,
  vis_config: { type: 'looker_grid' },
});
