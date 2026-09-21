import type { LookerQueryPayload } from '../../types/looker';

export const buildKpiMetricsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_order_items.total_sale_price',
    'basic_order_items.count',
    'basic_users.unique_users',
    'basic_order_items.average_sale_price',
  ],
  filters,
  limit: 1,
  vis_config: { type: 'single_value' },
});

export const buildMonthlyTrendQuery = (
  filters: Record<string, string>,
  timeDimension: string = 'basic_order_items.created_at_month'
): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    timeDimension,
    'basic_order_items.total_sale_price',
    'basic_order_items.count',
    'basic_order_items.average_sale_price',
  ],
  filters,
  sorts: [`${timeDimension} asc`],
  limit: 52,
  vis_config: { type: 'looker_area' },
});

export const buildTopBrandsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_products.brand',
    'basic_order_items.total_sale_price',
    'basic_order_items.count',
    'basic_order_items.average_sale_price',
  ],
  filters: {
    ...filters,
    'basic_products.brand': '-NULL',
  },
  sorts: ['basic_order_items.total_sale_price desc'],
  limit: 10,
  vis_config: { type: 'looker_column' },
});

export const buildCategoryRevenueQuery = (
  filters: Record<string, string>,
  dimension: string = 'basic_products.category'
): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    dimension,
    'basic_order_items.total_sale_price',
    'basic_order_items.count',
  ],
  filters: {
    ...filters,
    [dimension]: '-NULL',
  },
  sorts: ['basic_order_items.total_sale_price desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildCountrySalesQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_users.country',
    'basic_order_items.total_sale_price',
    'basic_order_items.count',
  ],
  filters: {
    ...filters,
    'basic_users.country': '-NULL',
  },
  sorts: ['basic_order_items.total_sale_price desc'],
  limit: 10,
  vis_config: { type: 'looker_bar' },
});

export const buildOrderStatusQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_order_items.status',
    'basic_order_items.count',
    'basic_order_items.total_sale_price',
  ],
  filters: {
    ...filters,
    'basic_order_items.status': '-NULL',
  },
  sorts: ['basic_order_items.count desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildProductPerformanceTableQuery = (
  filters: Record<string, string>
): LookerQueryPayload => ({
  model: 'basic_ecomm',
  view: 'basic_order_items',
  fields: [
    'basic_products.category',
    'basic_products.brand',
    'basic_users.unique_users',
    'basic_order_items.count',
    'basic_order_items.average_sale_price',
    'basic_order_items.total_sale_price',
  ],
  filters: {
    ...filters,
    'basic_products.brand': '-NULL',
    'basic_products.category': '-NULL',
  },
  sorts: ['basic_order_items.total_sale_price desc'],
  limit: 50,
  vis_config: { type: 'looker_grid' },
});
