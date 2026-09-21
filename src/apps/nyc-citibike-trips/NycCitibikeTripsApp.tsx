import React, { useState, useMemo } from 'react';
import type { GovernedAppProps } from '../../types/looker';
import { MetricCard } from '../../components/common/MetricCard';
import { DataChart } from '../../components/common/DataChart';
import { DataTable } from '../../components/common/DataTable';
import { FilterBar } from '../../components/common/FilterBar';
import { useLookerQuery } from '../../looker/hooks/useLookerQuery';
import { useGovernedQuerySync } from '../../looker/hooks/useGovernedQuery';
import {
  buildKpiMetricsQuery,
  buildMonthlyTrendQuery,
  buildHourlyDistributionQuery,
  buildDayOfWeekQuery,
  buildUserTypeQuery,
  buildGenderBreakdownQuery,
  buildTopStationsTableQuery,
} from './queries';
import { Calendar, Users, Bike } from 'lucide-react';

export interface CitibikeFilterState {
  dateRange: string;
  userType: string;
  gender: string;
}

export const NycCitibikeTripsApp: React.FC<GovernedAppProps> = ({ onRegisterQueries }) => {
  const [filters, setFilters] = useState<CitibikeFilterState>({
    dateRange: '365 days',
    userType: '',
    gender: '',
  });

  const activeFilters = useMemo(() => {
    const queryFilters: Record<string, string> = {};
    if (filters.dateRange) {
      queryFilters['trips.start_date'] = filters.dateRange;
    }
    if (filters.userType) {
      queryFilters['trips.user_type'] = filters.userType;
    }
    if (filters.gender) {
      queryFilters['trips.gender'] = filters.gender;
    }
    return queryFilters;
  }, [filters]);

  // Execute governed queries via browser CORS API & Looker SDK
  const kpiQuery = useLookerQuery(useMemo(() => buildKpiMetricsQuery(activeFilters), [activeFilters]));
  const monthlyTrendQuery = useLookerQuery(useMemo(() => buildMonthlyTrendQuery(activeFilters), [activeFilters]));
  const hourlyQuery = useLookerQuery(useMemo(() => buildHourlyDistributionQuery(activeFilters), [activeFilters]));
  const dayOfWeekQuery = useLookerQuery(useMemo(() => buildDayOfWeekQuery(activeFilters), [activeFilters]));
  const userTypeQuery = useLookerQuery(useMemo(() => buildUserTypeQuery(activeFilters), [activeFilters]));
  const genderQuery = useLookerQuery(useMemo(() => buildGenderBreakdownQuery(activeFilters), [activeFilters]));
  const stationsQuery = useLookerQuery(useMemo(() => buildTopStationsTableQuery(activeFilters), [activeFilters]));

  // Synchronize governed query telemetry with the Semantic Inspector
  useGovernedQuerySync([
    { name: 'Executive KPIs', query: kpiQuery },
    { name: 'Monthly Ridership Trend', query: monthlyTrendQuery },
    { name: 'Hourly Distribution', query: hourlyQuery },
    { name: 'Day of Week Pattern', query: dayOfWeekQuery },
    { name: 'User Type Breakdown', query: userTypeQuery },
    { name: 'Gender Demographics', query: genderQuery },
    { name: 'Top Departure Stations', query: stationsQuery },
  ], onRegisterQueries);

  const kpiData = (kpiQuery.data[0] || {}) as Record<string, unknown>;
  const rawTotalTrips = Number(kpiData['trips.count'] || 0);
  const rawAvgDurationSec = Number(kpiData['trips.average_trip_duration'] || 0);
  const avgDurationMinutes = rawAvgDurationSec ? (rawAvgDurationSec / 60).toFixed(1) : 0;

  // Format table data to convert average trip duration to minutes
  const formattedTableData = useMemo(() => {
    return stationsQuery.data.map((row) => {
      const durSec = Number(row['trips.average_trip_duration'] || 0);
      return {
        ...row,
        'trips.average_trip_duration_min': durSec ? Math.round(durSec / 60) : 0,
      };
    });
  }, [stationsQuery.data]);

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Bike className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">NYC Citi Bike Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed by LookML Model <code className="text-blue-400 font-mono">nyc_citibike_trips</code> • Explore{' '}
            <code className="text-purple-400 font-mono">trips</code>
          </p>
        </div>
      </div>

      {/* Declarative Governed Filter Bar */}
      <FilterBar
        filters={filters as unknown as Record<string, string>}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onReset={() => setFilters({ dateRange: '365 days', userType: '', gender: '' })}
        fields={[
          {
            key: 'dateRange',
            icon: <Calendar className="w-3.5 h-3.5" />,
            options: [
              { label: 'Last 30 Days', value: '30 days' },
              { label: 'Last 90 Days', value: '90 days' },
              { label: 'Last 1 Year', value: '365 days' },
              { label: 'Last 2 Years', value: '2 years' },
              { label: 'All Time', value: '' },
            ],
          },
          {
            key: 'userType',
            icon: <Users className="w-3.5 h-3.5" />,
            placeholder: 'All User Types',
            options: [
              { label: 'Subscriber', value: 'Subscriber' },
              { label: 'Customer (Casual)', value: 'Customer' },
            ],
          },
          {
            key: 'gender',
            placeholder: 'All Genders',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Unknown', value: 'unknown' },
            ],
          },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Rides"
          value={rawTotalTrips}
          format="number"
          icon="orders"
          subtext="Total completed trips"
          loading={kpiQuery.loading}
          error={kpiQuery.error}
        />
        <MetricCard
          title="Average Trip Duration"
          value={avgDurationMinutes ? `${avgDurationMinutes} min` : '—'}
          format="raw"
          icon="default"
          subtext={`Avg duration (${Math.round(rawAvgDurationSec)} seconds)`}
          loading={kpiQuery.loading}
          error={kpiQuery.error}
        />
        <MetricCard
          title="Avg Daily Demand"
          value={rawTotalTrips ? Math.round(rawTotalTrips / 365) : 0}
          format="number"
          icon="category"
          subtext="Estimated daily trips across network"
          loading={kpiQuery.loading}
          error={kpiQuery.error}
        />
      </div>

      {/* Monthly Ridership Trend */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <DataChart
          title="Monthly Trip Volume Trend"
          subtitle="Governed monthly trip counts from Looker semantic layer"
          type="area"
          data={monthlyTrendQuery.data}
          xKey="trips.start_month"
          yKey="trips.count"
          format="number"
          loading={monthlyTrendQuery.loading}
          error={monthlyTrendQuery.error}
          height={320}
        />
      </div>

      {/* Commuting Patterns: Hourly & Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <DataChart
            title="Hourly Ridership Distribution"
            subtitle="Trips started by hour of day (0-23)"
            type="bar"
            data={hourlyQuery.data}
            xKey="trips.start_hour_of_day"
            yKey="trips.count"
            format="number"
            loading={hourlyQuery.loading}
            error={hourlyQuery.error}
            height={280}
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <DataChart
            title="Day of Week Pattern"
            subtitle="Weekday vs Weekend trip volumes"
            type="bar"
            data={dayOfWeekQuery.data}
            xKey="trips.start_day_of_week"
            yKey="trips.count"
            format="number"
            loading={dayOfWeekQuery.loading}
            error={dayOfWeekQuery.error}
            height={280}
          />
        </div>
      </div>

      {/* User Segmentation & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <DataChart
            title="User Type Breakdown"
            subtitle="Annual Subscribers vs Casual Customers"
            type="donut"
            data={userTypeQuery.data}
            xKey="trips.user_type"
            yKey="trips.count"
            format="number"
            loading={userTypeQuery.loading}
            error={userTypeQuery.error}
            height={280}
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <DataChart
            title="Rider Gender Demographics"
            subtitle="Reported rider gender mix"
            type="donut"
            data={genderQuery.data}
            xKey="trips.gender"
            yKey="trips.count"
            format="number"
            loading={genderQuery.loading}
            error={genderQuery.error}
            height={280}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <DataTable
          title="Top Departure Stations"
          subtitle="Top Citi Bike stations ranked by starting trip volume"
          data={formattedTableData}
          columns={[
            { key: 'trips.start_station_name', label: 'Station Name', format: 'text' },
            { key: 'trips.count', label: 'Trip Volume', format: 'number' },
            { key: 'trips.average_trip_duration_min', label: 'Avg Duration (min)', format: 'number' },
          ]}
          loading={stationsQuery.loading}
          error={stationsQuery.error}
          modelView="nyc_citibike_trips :: trips"
        />
      </div>
    </div>
  );
};
