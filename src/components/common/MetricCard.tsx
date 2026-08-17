import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Layers, Percent, Loader2, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string | null | undefined;
  subtext?: string;
  change?: number;
  icon?: 'dollar' | 'orders' | 'category' | 'percent' | 'default';
  format?: 'currency' | 'number' | 'percent' | 'raw';
  loading?: boolean;
  error?: Error | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  change,
  icon = 'default',
  format = 'number',
  loading = false,
  error = null,
}) => {
  const formatValue = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined) return '—';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return String(val);

    switch (format) {
      case 'currency':
        if (num >= 1_000_000) {
          return `$${(num / 1_000_000).toFixed(2)}M`;
        }
        if (num >= 1_000) {
          return `$${(num / 1_000).toFixed(1)}k`;
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
      case 'percent':
        return `${num.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(Math.round(num));
      default:
        return String(val);
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'dollar':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'orders':
        return <ShoppingBag className="w-5 h-5 text-blue-400" />;
      case 'category':
        return <Layers className="w-5 h-5 text-purple-400" />;
      case 'percent':
        return <Percent className="w-5 h-5 text-amber-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-lg hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400 tracking-wide uppercase">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
          {getIcon()}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center space-x-2 py-1">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-sm text-slate-500 font-mono">Querying Looker...</span>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-rose-400 py-1">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs truncate" title={error.message}>Error loading metric</span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-bold tracking-tight text-white">
              {formatValue(value)}
            </span>
            {change !== undefined && (
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  change >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
              </span>
            )}
          </div>
        )}
      </div>

      {subtext && !loading && !error && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
          <span>{subtext}</span>
        </p>
      )}
    </div>
  );
};
