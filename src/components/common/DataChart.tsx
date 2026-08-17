import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';

export interface DataChartProps {
  title: string;
  subtitle?: string;
  type: 'area' | 'bar' | 'line' | 'donut';
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  loading?: boolean;
  error?: Error | null;
  height?: number;
  format?: 'currency' | 'number' | 'percent';
  colors?: string[];
  onBarClick?: (entry: Record<string, unknown>) => void;
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

export const DataChart: React.FC<DataChartProps> = ({
  title,
  subtitle,
  type,
  data,
  xKey,
  yKey,
  loading = false,
  error = null,
  height = 300,
  format = 'currency',
  colors = DEFAULT_PALETTE,
  onBarClick,
}) => {
  const formatYAxis = (val: number | string): string => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (format === 'currency') {
      if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
      if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
      return `$${num}`;
    }
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return String(num);
  };

  const formatTooltipValue = (val: unknown): string => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const cleanXValue = (val: unknown): string => {
    if (!val) return '';
    const str = String(val);
    // If it's a date like 2024-05-12, format nicely
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(5); // Show MM-DD
    }
    return str;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {loading && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Querying Looker...</span>
          </div>
        )}
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
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tickFormatter={cleanXValue}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(val) => [formatTooltipValue(val), yKey.split('.').pop()]}
                  labelFormatter={(lbl) => String(lbl)}
                />
                <Area
                  type="monotone"
                  dataKey={yKey}
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            ) : type === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tickFormatter={cleanXValue}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [formatTooltipValue(val), yKey.split('.').pop()]}
                />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#818cf8' }}
                  activeDot={{ r: 6, fill: '#a5b4fc' }}
                />
              </LineChart>
            ) : type === 'donut' ? (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [formatTooltipValue(val), 'Value']}
                />
                <Pie
                  data={data}
                  dataKey={yKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              /* Bar / Column Chart */
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={xKey}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) => (String(val).length > 12 ? `${String(val).slice(0, 10)}…` : String(val))}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [formatTooltipValue(val), yKey.split('.').pop()]}
                />
                <Bar
                  dataKey={yKey}
                  radius={[6, 6, 0, 0]}
                  onClick={(entry) => onBarClick && onBarClick(entry as Record<string, unknown>)}
                  className={onBarClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
