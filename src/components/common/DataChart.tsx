import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, AlertCircle, Layers, BarChart3, X } from 'lucide-react';

export interface DimensionOption {
  label: string;
  field: string;
}

export interface MeasureOption {
  label: string;
  field: string;
  format?: 'currency' | 'number' | 'percent';
}

export interface MultiSeriesConfig {
  key: string;
  name?: string;
  color?: string;
  type?: 'bar' | 'line' | 'area';
  format?: 'currency' | 'number' | 'percent';
  yAxisId?: 'left' | 'right';
}

export interface DataChartProps {
  title: string;
  subtitle?: string;
  type: 'area' | 'bar' | 'line' | 'donut' | 'combo';
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  yKeys?: MultiSeriesConfig[];
  xLabel?: string;
  yLabel?: string;
  loading?: boolean;
  error?: Error | null;
  height?: number;
  format?: 'currency' | 'number' | 'percent';
  colors?: string[];
  onBarClick?: (entry: Record<string, unknown>) => void;
  onPointClick?: (entry: Record<string, unknown>) => void;
  activeFilterValue?: string | null;
  dimensionOptions?: DimensionOption[];
  activeDimension?: string;
  onDimensionChange?: (field: string) => void;
  measureOptions?: MeasureOption[];
  activeMeasure?: string;
  onMeasureChange?: (field: string) => void;
}

const DEFAULT_PALETTE = [
  '#38bdf8', // Sky 400
  '#818cf8', // Indigo 400
  '#c084fc', // Purple 400
  '#34d399', // Emerald 400
  '#fbbf24', // Amber 400
  '#f87171', // Red 400
  '#22d3ee', // Cyan 400
  '#a78bfa', // Violet 400
];

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: unknown;
    color?: string;
    payload?: Record<string, unknown>;
    dataKey?: string;
  }>;
  label?: string | number;
  sliceLabelKey?: string;
  metricLabel?: string;
  valueFormatter?: (val: unknown, name?: string) => string;
}

const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  sliceLabelKey,
  metricLabel,
  valueFormatter,
}) => {
  if (!active || !payload || !payload.length) return null;

  let titleText: string | null = null;
  if (label !== undefined && label !== null && String(label).trim() !== '') {
    titleText = String(label);
  } else if (sliceLabelKey && payload[0]?.payload?.[sliceLabelKey]) {
    titleText = String(payload[0].payload[sliceLabelKey]);
  } else if (payload[0]?.name) {
    titleText = String(payload[0].name);
  }

  return (
    <div className="bg-slate-900 border border-slate-700/90 rounded-xl px-3.5 py-2.5 shadow-2xl text-xs z-50 pointer-events-none min-w-[140px]">
      {titleText && (
        <div className="text-slate-200 font-semibold text-xs mb-1.5 pb-1 border-b border-slate-800">
          {titleText}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const itemColor = entry.color || '#38bdf8';
          const itemName =
            entry.name && entry.name !== titleText
              ? entry.name
              : metricLabel || 'Value';
          const formattedVal = valueFormatter
            ? valueFormatter(entry.value, itemName)
            : String(entry.value ?? '');

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: itemColor }}
                />
                <span className="text-slate-400 font-medium">{itemName}:</span>
              </div>
              <span className="text-white font-bold font-mono text-xs">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DataChart: React.FC<DataChartProps> = ({
  title,
  subtitle,
  type,
  data,
  xKey,
  yKey,
  yKeys,
  loading = false,
  error = null,
  height = 300,
  format = 'currency',
  colors = DEFAULT_PALETTE,
  onBarClick,
  onPointClick,
  activeFilterValue = null,
  dimensionOptions,
  activeDimension,
  onDimensionChange,
  measureOptions,
  activeMeasure,
  onMeasureChange,
}) => {
  const [internalDimension, setInternalDimension] = useState<string>(xKey);
  const [internalMeasure, setInternalMeasure] = useState<string>(yKey);

  const effectiveXKey = activeDimension ?? (dimensionOptions ? internalDimension : xKey);
  const effectiveYKey = activeMeasure ?? (measureOptions ? internalMeasure : yKey);

  const activeMeasureOption = measureOptions?.find((m) => m.field === effectiveYKey);
  const effectiveFormat = activeMeasureOption?.format ?? format;

  const handleInteract = onPointClick || onBarClick;

  const handleDimensionSelect = (field: string) => {
    setInternalDimension(field);
    if (onDimensionChange) {
      onDimensionChange(field);
    }
  };

  const handleMeasureSelect = (field: string) => {
    setInternalMeasure(field);
    if (onMeasureChange) {
      onMeasureChange(field);
    }
  };

  const formatAxisNumber = (
    val: number | string,
    fmt: 'currency' | 'number' | 'percent' = effectiveFormat
  ): string => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (fmt === 'percent') {
      const pct = Math.abs(num) <= 1 && num !== 0 ? num * 100 : num;
      return `${pct.toFixed(1)}%`;
    }
    if (fmt === 'currency') {
      if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
      if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
      return `$${num.toFixed(0)}`;
    }
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return String(Math.round(num * 100) / 100);
  };

  const formatTooltipNumber = (
    val: unknown,
    fmt: 'currency' | 'number' | 'percent' = effectiveFormat
  ): string => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (fmt === 'percent') {
      const pct = Math.abs(num) <= 1 && num !== 0 ? num * 100 : num;
      return `${pct.toFixed(2)}%`;
    }
    if (fmt === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const cleanXValue = (val: unknown): string => {
    if (!val) return '';
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(5);
    }
    return str;
  };

  const hasRightAxis = Boolean(yKeys?.some((s) => s.yAxisId === 'right'));
  const rightAxisFormat = yKeys?.find((s) => s.yAxisId === 'right')?.format ?? 'number';

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
      {/* Header Row with Title, Active Filter Badge, and Dynamic Switchers */}
      <div className="flex flex-col space-y-3 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
              {activeFilterValue && (
                <button
                  onClick={() => handleInteract && handleInteract({ [effectiveXKey]: activeFilterValue })}
                  title="Click to clear cross-filter"
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors"
                >
                  <span>Filtered: {activeFilterValue}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          {loading && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-mono shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Querying...</span>
            </div>
          )}
        </div>

        {/* Dynamic Dimension & Measure Switcher Pills */}
        {(dimensionOptions?.length || measureOptions?.length) ? (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            {dimensionOptions && dimensionOptions.length > 0 ? (
              <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800/80 rounded-lg p-0.5">
                <span className="flex items-center text-[10px] text-slate-500 font-medium px-1.5">
                  <Layers className="w-3 h-3 mr-1 text-slate-500" />
                  By
                </span>
                {dimensionOptions.map((opt) => {
                  const isActive = effectiveXKey === opt.field;
                  return (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => handleDimensionSelect(opt.field)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div />
            )}

            {measureOptions && measureOptions.length > 0 && (
              <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800/80 rounded-lg p-0.5">
                <span className="flex items-center text-[10px] text-slate-500 font-medium px-1.5">
                  <BarChart3 className="w-3 h-3 mr-1 text-slate-500" />
                  Metric
                </span>
                {measureOptions.map((opt) => {
                  const isActive = effectiveYKey === opt.field;
                  return (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => handleMeasureSelect(opt.field)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div style={{ height }} className="w-full relative flex items-center justify-center">
        {loading && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-mono">Executing query on semantic layer...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-rose-400 p-4 text-center">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-semibold">Semantic Layer Query Error</p>
            <p className="text-xs text-rose-300/80 max-w-sm">{error.message}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono">No data returned for current filters</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {yKeys && yKeys.length > 0 && type !== 'donut' ? (
              /* Multi-Series / Dual-Axis Composed Chart */
              <ComposedChart
                data={data}
                margin={{ top: 10, right: hasRightAxis ? 5 : 10, left: -10, bottom: 0 }}
                onClick={(state) => {
                  if (handleInteract && state?.activePayload?.[0]?.payload) {
                    handleInteract(state.activePayload[0].payload as Record<string, unknown>);
                  }
                }}
              >
                <defs>
                  <linearGradient id="comboAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={effectiveXKey}
                  tickFormatter={cleanXValue}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => formatAxisNumber(val, yKeys[0]?.format ?? effectiveFormat)}
                  tickLine={false}
                  axisLine={false}
                />
                {hasRightAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => formatAxisNumber(val, rightAxisFormat)}
                    tickLine={false}
                    axisLine={false}
                  />
                )}
                <Tooltip
                  content={
                    <CustomChartTooltip
                      valueFormatter={(val, name) => {
                        const series = yKeys.find((s) => (s.name || s.key) === name || s.key === name);
                        return formatTooltipNumber(val, series?.format ?? effectiveFormat);
                      }}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#94a3b8' }}
                />
                {yKeys.map((series, idx) => {
                  const seriesColor = series.color || colors[idx % colors.length];
                  const axisId = series.yAxisId || 'left';
                  const seriesName = series.name || series.key.split('.').pop() || series.key;
                  const sType = series.type || (idx === 0 ? 'area' : 'line');

                  if (sType === 'bar') {
                    return (
                      <Bar
                        key={series.key}
                        yAxisId={axisId}
                        dataKey={series.key}
                        name={seriesName}
                        fill={seriesColor}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  }
                  if (sType === 'line') {
                    return (
                      <Line
                        key={series.key}
                        yAxisId={axisId}
                        type="monotone"
                        dataKey={series.key}
                        name={seriesName}
                        stroke={seriesColor}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: seriesColor }}
                      />
                    );
                  }
                  return (
                    <Area
                      key={series.key}
                      yAxisId={axisId}
                      type="monotone"
                      dataKey={series.key}
                      name={seriesName}
                      stroke={seriesColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#comboAreaGradient)"
                    />
                  );
                })}
              </ComposedChart>
            ) : type === 'area' ? (
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(state) => {
                  if (handleInteract && state?.activePayload?.[0]?.payload) {
                    handleInteract(state.activePayload[0].payload as Record<string, unknown>);
                  }
                }}
                className={handleInteract ? 'cursor-pointer' : ''}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={effectiveXKey}
                  tickFormatter={cleanXValue}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => formatAxisNumber(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      metricLabel={activeMeasureOption?.label || effectiveYKey.split('.').pop()}
                      valueFormatter={(val) => formatTooltipNumber(val)}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey={effectiveYKey}
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            ) : type === 'line' ? (
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(state) => {
                  if (handleInteract && state?.activePayload?.[0]?.payload) {
                    handleInteract(state.activePayload[0].payload as Record<string, unknown>);
                  }
                }}
                className={handleInteract ? 'cursor-pointer' : ''}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={effectiveXKey}
                  tickFormatter={cleanXValue}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => formatAxisNumber(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      metricLabel={activeMeasureOption?.label || effectiveYKey.split('.').pop()}
                      valueFormatter={(val) => formatTooltipNumber(val)}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey={effectiveYKey}
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#818cf8' }}
                  activeDot={{ r: 6, fill: '#a5b4fc' }}
                />
              </LineChart>
            ) : type === 'donut' ? (
              <PieChart>
                <Tooltip
                  content={
                    <CustomChartTooltip
                      sliceLabelKey={effectiveXKey}
                      metricLabel={activeMeasureOption?.label || 'Value'}
                      valueFormatter={(val) => formatTooltipNumber(val)}
                    />
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
                <Pie
                  data={data}
                  dataKey={effectiveYKey}
                  nameKey={effectiveXKey}
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  onClick={(slice) => {
                    if (handleInteract) {
                      const payload = (slice?.payload ?? slice) as Record<string, unknown>;
                      handleInteract(payload);
                    }
                  }}
                  className={handleInteract ? 'cursor-pointer' : ''}
                >
                  {data.map((entry, index) => {
                    const entryVal = String(entry[effectiveXKey] ?? '');
                    const isDimmed =
                      activeFilterValue && entryVal !== String(activeFilterValue);
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                        fillOpacity={isDimmed ? 0.3 : 1}
                        stroke={
                          activeFilterValue && entryVal === String(activeFilterValue)
                            ? '#ffffff'
                            : 'none'
                        }
                        strokeWidth={2}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            ) : (
              /* Bar / Column Chart */
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={effectiveXKey}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) =>
                    String(val).length > 12 ? `${String(val).slice(0, 10)}…` : String(val)
                  }
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => formatAxisNumber(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      metricLabel={activeMeasureOption?.label || effectiveYKey.split('.').pop()}
                      valueFormatter={(val) => formatTooltipNumber(val)}
                    />
                  }
                />
                <Bar
                  dataKey={effectiveYKey}
                  radius={[6, 6, 0, 0]}
                  onClick={(entry) =>
                    handleInteract && handleInteract(entry as Record<string, unknown>)
                  }
                  className={
                    handleInteract ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
                  }
                >
                  {data.map((entry, index) => {
                    const entryVal = String(entry[effectiveXKey] ?? '');
                    const isDimmed =
                      activeFilterValue && entryVal !== String(activeFilterValue);
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                        fillOpacity={isDimmed ? 0.3 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
