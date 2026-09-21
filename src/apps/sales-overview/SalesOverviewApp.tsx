import React, { useState, useMemo } from 'react';
import type { GovernedAppProps } from '../../types/looker';
import { MetricCard } from '../../components/common/MetricCard';
import { DataChart } from '../../components/common/DataChart';
import { DataTable } from '../../components/common/DataTable';
import { useLookerQuery } from '../../looker/hooks/useLookerQuery';
import { useGovernedQuerySync } from '../../looker/hooks/useGovernedQuery';
import { useFieldSuggestions } from '../../looker/hooks/useFieldSuggestions';
import {
  buildKpiMetricsQuery,
  buildMonthlyTrendQuery,
  buildTopBrandsQuery,
  buildCategoryRevenueQuery,
  buildCountrySalesQuery,
  buildOrderStatusQuery,
  buildProductPerformanceTableQuery,
} from './queries';
import { Filter, Calendar, Globe, Tag, CheckCircle, RotateCcw } from 'lucide-react';

export interface SalesFilterState {
  dateRange: string;
  country: string;
  category: string;
  status: string;
  brand: string;
}

export const SalesOverviewApp: React.FC<GovernedAppProps> = ({ onRegisterQueries }) => {
  const [filters, setFilters] = useState<SalesFilterState>({
    dateRange: '24 months',
    country: '',
    category: '',
    status: '',
    brand: '',
  });

  // Dynamic filter suggestions from Looker semantic layer
  const { suggestions: categorySuggestions } = useFieldSuggestions('look_ecomm', 'order_items', 'products.category');
  const { suggestions: countrySuggestions } = useFieldSuggestions('look_ecomm', 'order_items', 'users.country');
  const { suggestions: statusSuggestions } = useFieldSuggestions('look_ecomm', 'order_items', 'order_items.status');

  const categoryOptions = useMemo(() => {
    return ['All Categories', ...(categorySuggestions.length > 0 ? categorySuggestions : [
      'Outerwear & Coats', 'Jeans', 'Sweaters', 'Swim', 'Suits & Sport Coats',
      'Fashion Hoodies & Sweatshirts', 'Sleep & Lounge', 'Shorts', 'Tops & Tees', 'Dresses'
    ])];
  }, [categorySuggestions]);

  const countryOptions = useMemo(() => {
    return ['All Countries', ...(countrySuggestions.length > 0 ? countrySuggestions : [
      'China', 'United States', 'Brasil', 'South Korea', 'United Kingdom',
      'France', 'Germany', 'Spain', 'Japan', 'Australia'
    ])];
  }, [countrySuggestions]);

  const statusOptions = useMemo(() => {
    return ['All Statuses', ...(statusSuggestions.length > 0 ? statusSuggestions : [
      'Complete', 'Shipped', 'Processing', 'Cancelled', 'Returned'
    ])];
  }, [statusSuggestions]);

  const dateRangeOptions = [
    { label: 'Last 2 Years', value: '24 months' },
    { label: 'Last 1 Year', value: '12 months' },
    { label: 'Last 90 Days', value: '90 days' },
    { label: 'Last 30 Days', value: '30 days' },
    { label: 'All Time', value: '' },
  ];

  // Map state to Looker query filters
  const activeLookerFilters = useMemo(() => {
    const filterObj: Record<string, string> = {};
    if (filters.dateRange) {
      filterObj['order_items.created_date'] = filters.dateRange;
    }
    if (filters.country) {
      filterObj['users.country'] = filters.country;
    }
    if (filters.category) {
      filterObj['products.category'] = filters.category;
    }
    if (filters.status) {
      filterObj['order_items.status'] = filters.status;
    }
    if (filters.brand) {
      filterObj['products.brand'] = filters.brand;
    }
    return filterObj;
  }, [filters]);

  const [trendDimension, setTrendDimension] = useState<string>('order_items.created_month');
  const [trendMeasure, setTrendMeasure] = useState<string>('order_items.total_sale_price');
  const [categoryDimension, setCategoryDimension] = useState<string>('products.category');

  // Construct queries
  const kpiPayload = useMemo(() => buildKpiMetricsQuery(activeLookerFilters), [activeLookerFilters]);
  const trendPayload = useMemo(
    () => buildMonthlyTrendQuery(activeLookerFilters, trendDimension),
    [activeLookerFilters, trendDimension]
  );
  const categoryPayload = useMemo(
    () => buildCategoryRevenueQuery(activeLookerFilters, categoryDimension),
    [activeLookerFilters, categoryDimension]
  );
  const brandsPayload = useMemo(() => buildTopBrandsQuery(activeLookerFilters), [activeLookerFilters]);
  const countryPayload = useMemo(() => buildCountrySalesQuery(activeLookerFilters), [activeLookerFilters]);
  const statusPayload = useMemo(() => buildOrderStatusQuery(activeLookerFilters), [activeLookerFilters]);
  const tablePayload = useMemo(() => buildProductPerformanceTableQuery(activeLookerFilters), [activeLookerFilters]);

  // Execute queries via CORS Looker API
  const kpiResult = useLookerQuery(kpiPayload);
  const trendResult = useLookerQuery(trendPayload);
  const categoryResult = useLookerQuery(categoryPayload);
  const brandsResult = useLookerQuery(brandsPayload);
  const countryResult = useLookerQuery(countryPayload);
  const statusResult = useLookerQuery(statusPayload);
  const tableResult = useLookerQuery(tablePayload);

  // Synchronize active queries to Semantic Layer Inspector
  useGovernedQuerySync(
    [
      { name: 'Executive Sales KPIs', query: kpiResult },
      { name: 'Monthly Revenue Trend', query: trendResult },
      { name: 'Revenue by Category', query: categoryResult },
      { name: 'Top 10 Revenue Brands', query: brandsResult },
      { name: 'Geographic Sales Breakdown', query: countryResult },
      { name: 'Order Status Distribution', query: statusResult },
      { name: 'Product & Brand Performance Table', query: tableResult },
    ],
    onRegisterQueries
  );

  const handleFilterChange = (key: keyof SalesFilterState, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: '24 months',
      country: '',
      category: '',
      status: '',
      brand: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.dateRange !== '24 months' ||
    filters.country ||
    filters.category ||
    filters.status ||
    filters.brand
  );

  // Extract KPI values
  const kpiRow = (kpiResult.data[0] || {}) as Record<string, number | undefined>;
  const totalRevenue = kpiRow['order_items.total_sale_price'];
  const totalOrders = kpiRow['order_items.order_count'];
  const avgSalePrice = kpiRow['order_items.average_sale_price'];
  const totalGrossMargin = kpiRow['order_items.total_gross_margin'];
  const grossMarginPct = kpiRow['order_items.total_gross_margin_percentage'];
  const avgSpendPerUser = kpiRow['order_items.average_spend_per_user'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              E-Commerce Sales Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              look_ecomm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed by LookML Explore <span className="text-blue-400 font-mono">look_ecomm.order_items</span> • Direct Browser CORS API with RLS
          </p>
        </div>
      </div>

      {/* Interactive Semantic Filters Bar */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-300 font-medium text-sm">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Semantic Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5" />
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleFilterChange('dateRange', opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    filters.dateRange === opt.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Country Dropdown */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={filters.country || 'All Countries'}
                onChange={(e) => {
                  const val = e.target.value === 'All Countries' ? '' : e.target.value;
                  handleFilterChange('country', val);
                }}
                className="pl-8 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800"
              >
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▾
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={filters.category || 'All Categories'}
                onChange={(e) => {
                  const val = e.target.value === 'All Categories' ? '' : e.target.value;
                  handleFilterChange('category', val);
                }}
                className="pl-8 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▾
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="relative flex items-center">
              <CheckCircle className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={filters.status || 'All Statuses'}
                onChange={(e) => {
                  const val = e.target.value === 'All Statuses' ? '' : e.target.value;
                  handleFilterChange('status', val);
                }}
                className="pl-8 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▾
              </div>
            </div>

            {/* Active Brand Filter Pill */}
            {filters.brand && (
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-200 text-xs font-mono">
                Brand: {filters.brand}
                <button
                  onClick={() => handleFilterChange('brand', '')}
                  className="ml-2 text-purple-400 hover:text-white"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Executive KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Sales"
          value={totalRevenue}
          format="currency"
          icon="dollar"
          subtext="Gross sales revenue"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders}
          format="number"
          icon="orders"
          subtext="Distinct completed orders"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Average Order Value"
          value={avgSalePrice}
          format="currency"
          icon="default"
          subtext="Avg price per item"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Gross Margin"
          value={totalGrossMargin}
          format="currency"
          icon="dollar"
          subtext="Net gross margin ($)"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Margin Percentage"
          value={grossMarginPct ? grossMarginPct * 100 : null}
          format="percent"
          icon="percent"
          subtext="Margin on sales"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Spend Per User"
          value={avgSpendPerUser}
          format="currency"
          icon="category"
          subtext="Avg spend per customer"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Revenue & Margin Trend (2 Cols) */}
        <div className="lg:col-span-2">
          <DataChart
            title="Sales & Margin Trend"
            subtitle="Dynamically switch time granularity, metric, or dual-axis combo view"
            type={trendMeasure === '__combo__' ? 'combo' : 'area'}
            data={trendResult.data}
            xKey={trendDimension}
            yKey={trendMeasure === '__combo__' ? 'order_items.total_sale_price' : trendMeasure}
            yKeys={
              trendMeasure === '__combo__'
                ? [
                    {
                      key: 'order_items.total_sale_price',
                      name: 'Revenue ($)',
                      type: 'area',
                      color: '#38bdf8',
                      format: 'currency',
                      yAxisId: 'left',
                    },
                    {
                      key: 'order_items.order_count',
                      name: 'Orders (#)',
                      type: 'line',
                      color: '#34d399',
                      format: 'number',
                      yAxisId: 'right',
                    },
                  ]
                : undefined
            }
            dimensionOptions={[
              { label: 'Month', field: 'order_items.created_month' },
              { label: 'Week', field: 'order_items.created_week' },
              { label: 'Year', field: 'order_items.created_year' },
            ]}
            activeDimension={trendDimension}
            onDimensionChange={setTrendDimension}
            measureOptions={[
              { label: 'Revenue', field: 'order_items.total_sale_price', format: 'currency' },
              { label: 'Gross Margin', field: 'order_items.total_gross_margin', format: 'currency' },
              { label: 'Orders', field: 'order_items.order_count', format: 'number' },
              { label: 'Combo (Rev + Orders)', field: '__combo__', format: 'currency' },
            ]}
            activeMeasure={trendMeasure}
            onMeasureChange={setTrendMeasure}
            loading={trendResult.loading}
            error={trendResult.error}
            height={320}
            format="currency"
          />
        </div>

        {/* Product Category / Department Share (1 Col) */}
        <div className="lg:col-span-1">
          <DataChart
            title="Sales by Merchandise Mix"
            subtitle="Click slice to filter or pivot by Category / Department"
            type="donut"
            data={categoryResult.data}
            xKey={categoryDimension}
            yKey="order_items.total_sale_price"
            dimensionOptions={[
              { label: 'Category', field: 'products.category' },
              { label: 'Department', field: 'products.department' },
            ]}
            activeDimension={categoryDimension}
            onDimensionChange={setCategoryDimension}
            measureOptions={[
              { label: 'Revenue', field: 'order_items.total_sale_price', format: 'currency' },
              { label: 'Margin', field: 'order_items.total_gross_margin', format: 'currency' },
              { label: 'Orders', field: 'order_items.order_count', format: 'number' },
            ]}
            activeFilterValue={
              categoryDimension === 'products.category' ? filters.category || null : null
            }
            onPointClick={(entry) => {
              if (categoryDimension === 'products.category') {
                const catVal = String(entry['products.category'] || '');
                if (catVal) {
                  handleFilterChange('category', filters.category === catVal ? '' : catVal);
                }
              }
            }}
            loading={categoryResult.loading}
            error={categoryResult.error}
            height={320}
            format="currency"
          />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Brands Bar Chart */}
        <div className="lg:col-span-1">
          <DataChart
            title="Top 10 Brands"
            subtitle="Click any brand to cross-filter"
            type="bar"
            data={brandsResult.data}
            xKey="products.brand"
            yKey="order_items.total_sale_price"
            measureOptions={[
              { label: 'Revenue', field: 'order_items.total_sale_price', format: 'currency' },
              { label: 'Margin', field: 'order_items.total_gross_margin', format: 'currency' },
              { label: 'Orders', field: 'order_items.order_count', format: 'number' },
            ]}
            activeFilterValue={filters.brand || null}
            loading={brandsResult.loading}
            error={brandsResult.error}
            height={320}
            format="currency"
            onPointClick={(entry) => {
              const brandVal = String(entry['products.brand'] || '');
              if (brandVal) {
                handleFilterChange('brand', filters.brand === brandVal ? '' : brandVal);
              }
            }}
          />
        </div>

        {/* Geographic Country Distribution */}
        <div className="lg:col-span-1">
          <DataChart
            title="Sales by Country"
            subtitle="Click any market bar to filter"
            type="bar"
            data={countryResult.data}
            xKey="users.country"
            yKey="order_items.total_sale_price"
            measureOptions={[
              { label: 'Revenue', field: 'order_items.total_sale_price', format: 'currency' },
              { label: 'Margin', field: 'order_items.total_gross_margin', format: 'currency' },
              { label: 'Orders', field: 'order_items.order_count', format: 'number' },
            ]}
            activeFilterValue={filters.country || null}
            loading={countryResult.loading}
            error={countryResult.error}
            height={320}
            format="currency"
            onPointClick={(entry) => {
              const countryVal = String(entry['users.country'] || '');
              if (countryVal) {
                handleFilterChange('country', filters.country === countryVal ? '' : countryVal);
              }
            }}
          />
        </div>

        {/* Order Status Distribution */}
        <div className="lg:col-span-1">
          <DataChart
            title="Order Status Breakdown"
            subtitle="Click any slice to cross-filter by status"
            type="donut"
            data={statusResult.data}
            xKey="order_items.status"
            yKey="order_items.count"
            measureOptions={[
              { label: 'Units', field: 'order_items.count', format: 'number' },
              { label: 'Revenue', field: 'order_items.total_sale_price', format: 'currency' },
            ]}
            activeFilterValue={filters.status || null}
            onPointClick={(entry) => {
              const statusVal = String(entry['order_items.status'] || '');
              if (statusVal) {
                handleFilterChange('status', filters.status === statusVal ? '' : statusVal);
              }
            }}
            loading={statusResult.loading}
            error={statusResult.error}
            height={320}
            format="number"
          />
        </div>
      </div>

      {/* Detailed Product Performance Table */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
        <DataTable
          title="Product Category & Brand Performance"
          subtitle="Governed metrics sorted by total sales revenue"
          data={tableResult.data}
          loading={tableResult.loading}
          error={tableResult.error}
          modelView="look_ecomm.order_items"
          columns={[
            { key: 'products.category', label: 'Category', format: 'text' },
            { key: 'products.brand', label: 'Brand', format: 'text' },
            { key: 'order_items.order_count', label: 'Orders', format: 'number' },
            { key: 'order_items.count', label: 'Items Sold', format: 'number' },
            { key: 'order_items.average_sale_price', label: 'Avg Price', format: 'currency' },
            { key: 'order_items.total_sale_price', label: 'Total Sales', format: 'currency' },
            { key: 'order_items.total_gross_margin', label: 'Gross Margin', format: 'currency' },
          ]}
        />
      </div>
    </div>
  );
};
