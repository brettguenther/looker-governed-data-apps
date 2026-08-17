import React, { useState, useMemo } from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import { DataChart } from '../../components/common/DataChart';
import { DataTable } from '../../components/common/DataTable';
import { FilterBar, type FilterValues } from '../../components/common/FilterBar';
import { useLookerQuery } from '../../looker/hooks/useLookerQuery';
import { useFieldSuggestions } from '../../looker/hooks/useFieldSuggestions';
import {
  buildKpiQuery,
  buildWeeklySalesQuery,
  buildChannelSalesQuery,
  buildCategorySalesQuery,
  buildDetailedTableQuery,
} from './queries';
import type { LookerQueryPayload } from '../../types/looker';

interface SalesAnalyticsAppProps {
  onRegisterQueries?: (
    queries: Array<{
      name: string;
      payload: LookerQueryPayload;
      executionTimeMs?: number | null;
      status: 'success' | 'loading' | 'error';
    }>
  ) => void;
}

export const SalesAnalyticsApp: React.FC<SalesAnalyticsAppProps> = ({ onRegisterQueries }) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({
    year: '2024',
    category: '',
    channel: '',
  });

  // Dynamic filter suggestions from Looker semantic layer
  const { suggestions: categorySuggestions } = useFieldSuggestions('edg_orders', 'fct_orders', 'consolidated_category');
  const { suggestions: channelSuggestions } = useFieldSuggestions('edg_orders', 'fct_orders', 'sales_channel');

  const categoryOptions = useMemo(() => {
    return ['All Categories', ...(categorySuggestions.length > 0 ? categorySuggestions : ['WINE', 'SPIRITS', 'BEER', 'SPIRITS RTD', 'Other'])];
  }, [categorySuggestions]);

  const channelOptions = useMemo(() => {
    return ['All Channels', ...(channelSuggestions.length > 0 ? channelSuggestions : ['Retail Store', 'Online', 'Wholesale', 'Distributor', 'Direct to Consumer'])];
  }, [channelSuggestions]);

  // Construct Looker filter object
  const activeFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (filterValues.year) {
      filters['fct_orders.order_date_year'] = filterValues.year;
    }
    if (filterValues.category) {
      filters['fct_orders.consolidated_category'] = filterValues.category;
    }
    if (filterValues.channel) {
      filters['fct_orders.sales_channel'] = filterValues.channel;
    }
    return filters;
  }, [filterValues]);

  // Dynamic Looker queries executed over CORS
  const kpiQueryPayload = useMemo(() => buildKpiQuery(activeFilters), [activeFilters]);
  const weeklyQueryPayload = useMemo(() => buildWeeklySalesQuery(activeFilters), [activeFilters]);
  const channelQueryPayload = useMemo(() => buildChannelSalesQuery(activeFilters), [activeFilters]);
  const categoryQueryPayload = useMemo(() => buildCategorySalesQuery(activeFilters), [activeFilters]);
  const tableQueryPayload = useMemo(() => buildDetailedTableQuery(activeFilters), [activeFilters]);

  const kpiResult = useLookerQuery(kpiQueryPayload);
  const weeklyResult = useLookerQuery(weeklyQueryPayload);
  const channelResult = useLookerQuery(channelQueryPayload);
  const categoryResult = useLookerQuery(categoryQueryPayload);
  const tableResult = useLookerQuery(tableQueryPayload);

  // Expose queries to the Semantic Layer Inspector
  React.useEffect(() => {
    if (onRegisterQueries) {
      onRegisterQueries([
        {
          name: 'Executive KPI Total Sales',
          payload: kpiQueryPayload,
          executionTimeMs: kpiResult.executionTimeMs,
          status: kpiResult.loading ? 'loading' : kpiResult.error ? 'error' : 'success',
        },
        {
          name: 'Weekly Revenue Trend',
          payload: weeklyQueryPayload,
          executionTimeMs: weeklyResult.executionTimeMs,
          status: weeklyResult.loading ? 'loading' : weeklyResult.error ? 'error' : 'success',
        },
        {
          name: 'Top Sales Channels',
          payload: channelQueryPayload,
          executionTimeMs: channelResult.executionTimeMs,
          status: channelResult.loading ? 'loading' : channelResult.error ? 'error' : 'success',
        },
        {
          name: 'Category Distribution',
          payload: categoryQueryPayload,
          executionTimeMs: categoryResult.executionTimeMs,
          status: categoryResult.loading ? 'loading' : categoryResult.error ? 'error' : 'success',
        },
        {
          name: 'Detailed Transaction Records',
          payload: tableQueryPayload,
          executionTimeMs: tableResult.executionTimeMs,
          status: tableResult.loading ? 'loading' : tableResult.error ? 'error' : 'success',
        },
      ]);
    }
  }, [
    onRegisterQueries,
    kpiQueryPayload,
    weeklyQueryPayload,
    channelQueryPayload,
    categoryQueryPayload,
    tableQueryPayload,
    kpiResult.executionTimeMs,
    kpiResult.loading,
    kpiResult.error,
    weeklyResult.executionTimeMs,
    weeklyResult.loading,
    weeklyResult.error,
    channelResult.executionTimeMs,
    channelResult.loading,
    channelResult.error,
    categoryResult.executionTimeMs,
    categoryResult.loading,
    categoryResult.error,
    tableResult.executionTimeMs,
    tableResult.loading,
    tableResult.error,
  ]);

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterValues({
      year: '2024',
      category: '',
      channel: '',
    });
  };

  // KPI calculations
  const totalSalesVal = (kpiResult.data[0] as Record<string, unknown>)?.[
    'fct_orders.total_sales'
  ] as number | undefined;

  const topChannelVal = (channelResult.data[0] as Record<string, unknown>)?.[
    'fct_orders.sales_channel'
  ] as string | undefined;

  const topCategoryVal = (categoryResult.data[0] as Record<string, unknown>)?.[
    'fct_orders.consolidated_category'
  ] as string | undefined;

  return (
    <div className="space-y-6">
      {/* Title & App Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Commercial Sales Performance App
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Governed by LookML model <span className="text-blue-400 font-mono">edg_orders.fct_orders</span> • Direct CORS API
          </p>
        </div>
      </div>

      {/* Interactive Semantic Filters */}
      <FilterBar
        filters={filterValues}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        categoryOptions={categoryOptions}
        channelOptions={channelOptions}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Governed Sales"
          value={totalSalesVal}
          format="currency"
          icon="dollar"
          change={12.4}
          subtext={filterValues.year ? `Year ${filterValues.year} to date` : 'All time aggregated'}
          loading={kpiResult.loading}
          error={kpiResult.error}
        />
        <MetricCard
          title="Top Sales Channel"
          value={topChannelVal || '—'}
          format="raw"
          icon="orders"
          subtext="Highest volume channel"
          loading={channelResult.loading}
          error={channelResult.error}
        />
        <MetricCard
          title="Leading Category"
          value={topCategoryVal || '—'}
          format="raw"
          icon="category"
          subtext="Dominant product line"
          loading={categoryResult.loading}
          error={categoryResult.error}
        />
        <MetricCard
          title="Active Filter Scope"
          value={
            filterValues.category
              ? filterValues.category
              : filterValues.channel
              ? filterValues.channel
              : 'Enterprise Wide'
          }
          format="raw"
          icon="percent"
          subtext="Row-Level Security applied"
        />
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend (2 cols wide) */}
        <div className="lg:col-span-2">
          <DataChart
            title="Sales Revenue Trend by Week"
            subtitle="Looker time dimension aggregation"
            type="area"
            data={weeklyResult.data}
            xKey="fct_orders.order_date_week"
            yKey="fct_orders.total_sales"
            loading={weeklyResult.loading}
            error={weeklyResult.error}
            height={320}
            format="currency"
          />
        </div>

        {/* Category Share Donut (1 col wide) */}
        <div className="lg:col-span-1">
          <DataChart
            title="Sales by Category"
            subtitle="Product category distribution"
            type="donut"
            data={categoryResult.data}
            xKey="fct_orders.consolidated_category"
            yKey="fct_orders.total_sales"
            loading={categoryResult.loading}
            error={categoryResult.error}
            height={320}
            format="currency"
          />
        </div>
      </div>

      {/* Secondary Chart: Channel Breakdown */}
      <div className="grid grid-cols-1 gap-6">
        <DataChart
          title="Revenue by Sales Channel"
          subtitle="Click any bar to filter entire application dynamically"
          type="bar"
          data={channelResult.data}
          xKey="fct_orders.sales_channel"
          yKey="fct_orders.total_sales"
          loading={channelResult.loading}
          error={channelResult.error}
          height={260}
          format="currency"
          onBarClick={(entry) => {
            const channel = entry?.['fct_orders.sales_channel'];
            if (typeof channel === 'string') {
              handleFilterChange('channel', channel);
            }
          }}
        />
      </div>

      {/* Governed Data Table */}
      <DataTable
        title="Governed Transaction Breakdown"
        subtitle="Real-time multi-dimensional view with client-side sorting & export"
        data={tableResult.data}
        loading={tableResult.loading}
        error={tableResult.error}
        modelView="edg_orders.fct_orders"
        columns={[
          { key: 'fct_orders.order_date_week', label: 'Order Week', format: 'date' },
          { key: 'fct_orders.sales_channel', label: 'Sales Channel', format: 'text' },
          { key: 'fct_orders.consolidated_category', label: 'Category', format: 'text' },
          { key: 'fct_orders.total_sales', label: 'Total Sales', format: 'currency' },
        ]}
      />
    </div>
  );
};
