import type { LookerQueryPayload } from '../../types/looker';

export const buildKpiMetricsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'order_items.total_sale_price',
    'order_items.order_count',
    'order_items.average_sale_price',
    'order_items.total_gross_margin',
    'order_items.total_gross_margin_percentage',
    'order_items.average_spend_per_user',
    'order_items.count',
  ],
  filters,
  limit: 1,
  vis_config: { type: 'single_value' },
});

export const buildMonthlyTrendQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'order_items.created_month',
    'order_items.total_sale_price',
    'order_items.order_count',
  ],
  filters,
  sorts: ['order_items.created_month asc'],
  limit: 24,
  vis_config: { type: 'looker_area' },
});

export const buildCategoryRevenueQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'products.category',
    'order_items.total_sale_price',
    'order_items.order_count',
  ],
  filters: {
    ...filters,
    'products.category': '-NULL',
  },
  sorts: ['order_items.total_sale_price desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildTopBrandsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'products.brand',
    'order_items.total_sale_price',
    'order_items.order_count',
  ],
  filters: {
    ...filters,
    'products.brand': '-NULL',
  },
  sorts: ['order_items.total_sale_price desc'],
  limit: 10,
  vis_config: { type: 'looker_column' },
});

export const buildCountrySalesQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'users.country',
    'order_items.total_sale_price',
    'order_items.order_count',
  ],
  filters: {
    ...filters,
    'users.country': '-NULL',
  },
  sorts: ['order_items.total_sale_price desc'],
  limit: 10,
  vis_config: { type: 'looker_bar' },
});

export const buildOrderStatusQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'order_items.status',
    'order_items.count',
    'order_items.total_sale_price',
  ],
  filters: {
    ...filters,
    'order_items.status': '-NULL',
  },
  sorts: ['order_items.count desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildProductPerformanceTableQuery = (
  filters: Record<string, string>
): LookerQueryPayload => ({
  model: 'look_ecomm',
  view: 'order_items',
  fields: [
    'products.category',
    'products.brand',
    'order_items.order_count',
    'order_items.count',
    'order_items.average_sale_price',
    'order_items.total_sale_price',
    'order_items.total_gross_margin',
  ],
  filters: {
    ...filters,
    'products.category': '-NULL',
    'products.brand': '-NULL',
  },
  sorts: ['order_items.total_sale_price desc'],
  limit: 50,
  vis_config: { type: 'looker_grid' },
});
