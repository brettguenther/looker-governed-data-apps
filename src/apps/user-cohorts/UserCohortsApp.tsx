import React, { useState, useMemo, useEffect } from 'react';
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

export const UserCohortsApp: React.FC<GovernedAppProps> = ({ onRegisterQueries }) => {
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
          <h1 className="text-2xl font-bold text-white tracking-tight">User Cohorts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Governed by LookML Model <code className="text-blue-400 font-mono">basic_ecomm</code> • Explore{' '}
            <code className="text-purple-400 font-mono">basic_users</code>
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
          value={Number(kpiData['basic_users.count'] || 0)}
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
          xKey="basic_users.count"
          yKey="basic_users.count"
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
          columns={[{ key: 'basic_users.count', label: 'Total Count' }]}
          loading={tableQuery.loading}
          error={tableQuery.error}
        />
      </div>
    </div>
  );
};
