import type { LookerQueryPayload } from '../../types/looker';

export const buildKpiMetricsQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.count',
    'trips.average_trip_duration',
  ],
  filters,
  limit: 1,
  vis_config: { type: 'single_value' },
});

export const buildMonthlyTrendQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.start_month',
    'trips.count',
  ],
  filters,
  sorts: ['trips.start_month asc'],
  limit: 24,
  vis_config: { type: 'looker_area' },
});

export const buildHourlyDistributionQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.start_hour_of_day',
    'trips.count',
  ],
  filters,
  sorts: ['trips.start_hour_of_day asc'],
  limit: 24,
  vis_config: { type: 'looker_column' },
});

export const buildDayOfWeekQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.start_day_of_week',
    'trips.count',
  ],
  filters,
  sorts: ['trips.count desc'],
  limit: 7,
  vis_config: { type: 'looker_bar' },
});

export const buildUserTypeQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.user_type',
    'trips.count',
  ],
  filters: {
    ...filters,
    'trips.user_type': '-NULL',
  },
  sorts: ['trips.count desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildGenderBreakdownQuery = (filters: Record<string, string>): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.gender',
    'trips.count',
  ],
  filters: {
    ...filters,
    'trips.gender': '-NULL',
  },
  sorts: ['trips.count desc'],
  limit: 10,
  vis_config: { type: 'looker_donut' },
});

export const buildTopStationsTableQuery = (
  filters: Record<string, string>
): LookerQueryPayload => ({
  model: 'nyc_citibike_trips',
  view: 'trips',
  fields: [
    'trips.start_station_name',
    'trips.count',
    'trips.average_trip_duration',
  ],
  filters: {
    ...filters,
    'trips.start_station_name': '-NULL',
  },
  sorts: ['trips.count desc'],
  limit: 50,
  vis_config: { type: 'looker_grid' },
});
