import React, { useState, useMemo } from 'react';
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
import type { GovernedAppProps } from '../../types/looker';
import { Filter, Calendar, Globe, Tag, CheckCircle, RotateCcw } from 'lucide-react';

export interface EcommFilterState {
  dateRange: string;
  country: string;
  category: string;
  status: string;
  brand: string;
}

export const BasicEcommApp: React.FC<GovernedAppProps> = ({ onRegisterQueries }) => {
  const [filters, setFilters] = useState<EcommFilterState>({
    dateRange: '2 years',
    country: '',
    category: '',
    status: '',
    brand: '',
  });

  // Dynamic filter suggestions from the semantic layer
  const { suggestions: categorySuggestions } = useFieldSuggestions('basic_ecomm', 'basic_products', 'category');
  const { suggestions: countrySuggestions } = useFieldSuggestions('basic_ecomm', 'basic_users', 'country');
  const { suggestions: statusSuggestions } = useFieldSuggestions('basic_ecomm', 'basic_order_items', 'status');

  const categoryOptions = useMemo(() => {
    return ['All Categories', ...(categorySuggestions.length > 0 ? categorySuggestions : [
      'Accessories', 'Active', 'Blazers & Jackets', 'Clothing Sets', 'Dresses',
      'Fashion Hoodies & Sweatshirts', 'Intimates', 'Jeans', 'Jumpsuits & Rompers', 'Leggings', 'Outerwear & Coats', 'Pants', 'Shorts', 'Skirts', 'Sleep & Lounge', 'Socks & Hosiery', 'Suits', 'Sweaters', 'Swim', 'Tops & Tees', 'Underwear'
    ])];
  }, [categorySuggestions]);

  const countryOptions = useMemo(() => {
    return ['All Countries', ...(countrySuggestions.length > 0 ? countrySuggestions : [
      'Australia', 'Austria', 'Belgium', 'Brasil', 'China', 'Colombia', 'Deutschland', 'España', 'France', 'Germany', 'Japan', 'United Kingdom', 'United States'
    ])];
  }, [countrySuggestions]);

  const statusOptions = useMemo(() => {
    return ['All Statuses', ...(statusSuggestions.length > 0 ? statusSuggestions : [
      'Complete', 'Shipped', 'Processing', 'Cancelled', 'Returned'
    ])];
  }, [statusSuggestions]);

  const dateRangeOptions = [
    { label: 'Last 2 Years', value: '2 years' },
    { label: 'Last 1 Year', value: '1 year' },
    { label: 'Last 90 Days', value: '90 days' },
    { label: 'All Time', value: '' },
  ];

  // Build Looker filters object
  const activeLookerFilters = useMemo(() => {
    const filterObj: Record<string, string> = {};
    if (filters.dateRange) {
      filterObj['basic_order_items.created_at_date'] = filters.dateRange;
    }
    if (filters.country) {
      filterObj['basic_users.country'] = filters.country;
    }
    if (filters.category) {
      filterObj['basic_products.category'] = filters.category;
    }
    if (filters.status) {
      filterObj['basic_order_items.status'] = filters.status;
    }
    if (filters.brand) {
      filterObj['basic_products.brand'] = filters.brand;
    }
    return filterObj;
  }, [filters]);

  const [trendDimension, setTrendDimension] = useState<string>('basic_order_items.created_at_month');
  const [trendMeasure, setTrendMeasure] = useState<string>('basic_order_items.total_sale_price');
  const [categoryDimension, setCategoryDimension] = useState<string>('basic_products.category');

  // Construct queries
  const kpiPayload = useMemo(() => buildKpiMetricsQuery(activeLookerFilters), [activeLookerFilters]);
  const trendPayload = useMemo(
    () => buildMonthlyTrendQuery(activeLookerFilters, trendDimension),
    [activeLookerFilters, trendDimension]
  );
  const brandsPayload = useMemo(() => buildTopBrandsQuery(activeLookerFilters), [activeLookerFilters]);
  const categoryPayload = useMemo(
    () => buildCategoryRevenueQuery(activeLookerFilters, categoryDimension),
    [activeLookerFilters, categoryDimension]
  );
  const countryPayload = useMemo(() => buildCountrySalesQuery(activeLookerFilters), [activeLookerFilters]);
  const statusPayload = useMemo(() => buildOrderStatusQuery(activeLookerFilters), [activeLookerFilters]);
  const tablePayload = useMemo(() => buildProductPerformanceTableQuery(activeLookerFilters), [activeLookerFilters]);

  // Execute reactive queries via Looker SDK CORS API
  const kpiResult = useLookerQuery(kpiPayload);
  const trendResult = useLookerQuery(trendPayload);
  const brandsResult = useLookerQuery(brandsPayload);
  const categoryResult = useLookerQuery(categoryPayload);
  const countryResult = useLookerQuery(countryPayload);
  const statusResult = useLookerQuery(statusPayload);
  const tableResult = useLookerQuery(tablePayload);

  // Synchronize active queries to Semantic Layer Inspector
  useGovernedQuerySync(
    [
      { name: 'Executive KPIs', query: kpiResult },
      { name: 'Monthly Revenue & Volume Trend', query: trendResult },
      { name: 'Top Brands by Revenue', query: brandsResult },
      { name: 'Revenue by Category', query: categoryResult },
      { name: 'Geographic Markets', query: countryResult },
      { name: 'Order Status Distribution', query: statusResult },
      { name: 'Product & Brand Performance Table', query: tableResult },
    ],
    onRegisterQueries
  );

  const handleFilterChange = (key: keyof EcommFilterState, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: '2 years',
      country: '',
      category: '',
      status: '',
      brand: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.dateRange !== '2 years' ||
    filters.country ||
    filters.category ||
    filters.status ||
    filters.brand
  );

  // Extract KPI values from first row of response
  const kpiRow = (kpiResult.data[0] || {}) as Record<string, number | undefined>;
  const totalRevenue = kpiRow['basic_order_items.total_sale_price'];
  const totalUnits = kpiRow['basic_order_items.count'];
  const uniqueUsers = kpiRow['basic_users.unique_users'];
  const avgSalePrice = kpiRow['basic_order_items.average_sale_price'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              E-Commerce Executive Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400">
              basic_ecomm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed by LookML Explore <span className="text-blue-400 font-mono">basic_ecomm.basic_order_items</span> • Direct CORS API
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

            {/* Active Brand filter pill */}
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

      {/* 4 Executive KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Governed Revenue"
          value={totalRevenue}
          format="currency"
          icon="dollar"
          change={8.7}
          subtext="Gross sales generated"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Order Items Sold"
          value={totalUnits}
          format="number"
          icon="orders"
          change={14.2}
          subtext="Total item units volume"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Unique Customers"
          value={uniqueUsers}
          format="number"
          icon="category"
          change={5.3}
          subtext="Distinct purchasing users"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Average Sale Price"
          value={avgSalePrice}
          format="currency"
          icon="percent"
          subtext="Revenue per order item"
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Revenue & Volume Trend (2 Cols) */}
        <div className="lg:col-span-2">
          <DataChart
            title="Performance Time-Series Trend"
            subtitle="Dynamically switch time granularity, metric, or dual-axis combo view"
            type={trendMeasure === '__combo__' ? 'combo' : 'area'}
            data={trendResult.data}
            xKey={trendDimension}
            yKey={trendMeasure === '__combo__' ? 'basic_order_items.total_sale_price' : trendMeasure}
            yKeys={
              trendMeasure === '__combo__'
                ? [
                    {
                      key: 'basic_order_items.total_sale_price',
                      name: 'Revenue ($)',
                      type: 'area',
                      color: '#38bdf8',
                      format: 'currency',
                      yAxisId: 'left',
                    },
                    {
                      key: 'basic_order_items.count',
                      name: 'Units Sold (#)',
                      type: 'line',
                      color: '#34d399',
                      format: 'number',
                      yAxisId: 'right',
                    },
                  ]
                : undefined
            }
            dimensionOptions={[
              { label: 'Month', field: 'basic_order_items.created_at_month' },
              { label: 'Week', field: 'basic_order_items.created_at_week' },
              { label: 'Year', field: 'basic_order_items.created_at_year' },
            ]}
            activeDimension={trendDimension}
            onDimensionChange={setTrendDimension}
            measureOptions={[
              { label: 'Revenue', field: 'basic_order_items.total_sale_price', format: 'currency' },
              { label: 'Units Sold', field: 'basic_order_items.count', format: 'number' },
              { label: 'Avg Price', field: 'basic_order_items.average_sale_price', format: 'currency' },
              { label: 'Combo (Rev + Units)', field: '__combo__', format: 'currency' },
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
            title="Merchandise Mix"
            subtitle="Click slice to filter or pivot by Category / Department"
            type="donut"
            data={categoryResult.data}
            xKey={categoryDimension}
            yKey="basic_order_items.total_sale_price"
            dimensionOptions={[
              { label: 'Category', field: 'basic_products.category' },
              { label: 'Department', field: 'basic_products.department' },
            ]}
            activeDimension={categoryDimension}
            onDimensionChange={setCategoryDimension}
            measureOptions={[
              { label: 'Revenue', field: 'basic_order_items.total_sale_price', format: 'currency' },
              { label: 'Units', field: 'basic_order_items.count', format: 'number' },
            ]}
            activeFilterValue={
              categoryDimension === 'basic_products.category' ? filters.category || null : null
            }
            onPointClick={(entry) => {
              if (categoryDimension === 'basic_products.category') {
                const cat = entry?.['basic_products.category'];
                if (typeof cat === 'string') {
                  handleFilterChange('category', filters.category === cat ? '' : cat);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Brands Bar Chart */}
        <DataChart
          title="Top 10 Brands"
          subtitle="Click any brand bar to cross-filter the dashboard"
          type="bar"
          data={brandsResult.data}
          xKey="basic_products.brand"
          yKey="basic_order_items.total_sale_price"
          measureOptions={[
            { label: 'Revenue', field: 'basic_order_items.total_sale_price', format: 'currency' },
            { label: 'Units Sold', field: 'basic_order_items.count', format: 'number' },
            { label: 'Avg Price', field: 'basic_order_items.average_sale_price', format: 'currency' },
          ]}
          activeFilterValue={filters.brand || null}
          loading={brandsResult.loading}
          error={brandsResult.error}
          height={280}
          format="currency"
          colors={['#34a853', '#4285f4', '#fbbc04', '#ea4335', '#a142f4', '#24c1e0', '#fa7b17', '#f439a0']}
          onPointClick={(entry) => {
            const brand = entry?.['basic_products.brand'];
            if (typeof brand === 'string') {
              handleFilterChange('brand', filters.brand === brand ? '' : brand);
            }
          }}
        />

        {/* Geographic Markets Bar Chart */}
        <DataChart
          title="Top Geographic Markets"
          subtitle="Click any country bar to filter dynamically"
          type="bar"
          data={countryResult.data}
          xKey="basic_users.country"
          yKey="basic_order_items.total_sale_price"
          measureOptions={[
            { label: 'Revenue', field: 'basic_order_items.total_sale_price', format: 'currency' },
            { label: 'Units Sold', field: 'basic_order_items.count', format: 'number' },
          ]}
          activeFilterValue={filters.country || null}
          loading={countryResult.loading}
          error={countryResult.error}
          height={280}
          format="currency"
          colors={['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#12b5cb', '#6e2594']}
          onPointClick={(entry) => {
            const country = entry?.['basic_users.country'];
            if (typeof country === 'string') {
              handleFilterChange('country', filters.country === country ? '' : country);
            }
          }}
        />
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DataChart
            title="Order Status Distribution"
            subtitle="Click any slice to cross-filter by fulfillment status"
            type="donut"
            data={statusResult.data}
            xKey="basic_order_items.status"
            yKey="basic_order_items.count"
            measureOptions={[
              { label: 'Units', field: 'basic_order_items.count', format: 'number' },
              { label: 'Revenue', field: 'basic_order_items.total_sale_price', format: 'currency' },
            ]}
            activeFilterValue={filters.status || null}
            onPointClick={(entry) => {
              const status = entry?.['basic_order_items.status'];
              if (typeof status === 'string') {
                handleFilterChange('status', filters.status === status ? '' : status);
              }
            }}
            loading={statusResult.loading}
            error={statusResult.error}
            height={260}
            format="number"
            colors={['#34a853', '#4285f4', '#fbbc04', '#ea4335', '#9aa0a6']}
          />
        </div>

        {/* Governed Product Performance Table */}
        <div className="lg:col-span-2">
          <DataTable
            title="Product Category & Brand Performance"
            subtitle="Governed multi-dimensional metrics with client-side sorting & export"
            data={tableResult.data}
            loading={tableResult.loading}
            error={tableResult.error}
            modelView="basic_ecomm.basic_order_items"
            columns={[
              { key: 'basic_products.category', label: 'Category', format: 'text' },
              { key: 'basic_products.brand', label: 'Brand', format: 'text' },
              { key: 'basic_users.unique_users', label: 'Customers', format: 'number' },
              { key: 'basic_order_items.count', label: 'Units Sold', format: 'number' },
              { key: 'basic_order_items.average_sale_price', label: 'Avg Price', format: 'currency' },
              { key: 'basic_order_items.total_sale_price', label: 'Total Revenue', format: 'currency' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
