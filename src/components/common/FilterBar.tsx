import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label?: string;
  options: (string | FilterOption)[];
  icon?: React.ReactNode;
  placeholder?: string;
  type?: 'select' | 'buttons';
}

export interface FilterBarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset?: () => void;
  fields: FilterField[];
  title?: string;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  fields,
  title = 'Interactive Semantic Filters',
  className = '',
}) => {
  const hasActiveFilters = Object.values(filters).some((val) => Boolean(val));

  const normalizeOption = (opt: string | FilterOption): FilterOption => {
    return typeof opt === 'string' ? { label: opt, value: opt } : opt;
  };

  return (
    <div
      className={`bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-lg mb-6 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center space-x-2 text-slate-300 font-medium text-sm">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>{title}</span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {fields.map((field) => {
            const currentValue = filters[field.key] || '';
            const normalizedOptions = field.options.map(normalizeOption);

            if (field.type === 'buttons') {
              return (
                <div
                  key={field.key}
                  className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60"
                >
                  {field.icon && <span className="ml-2 mr-1.5 text-slate-400">{field.icon}</span>}
                  {normalizedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onFilterChange(field.key, opt.value)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                        currentValue === opt.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              );
            }

            // Default: Dropdown select
            return (
              <div key={field.key} className="relative flex items-center">
                {field.icon && (
                  <span className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none flex items-center">
                    {field.icon}
                  </span>
                )}
                <select
                  value={currentValue}
                  onChange={(e) => onFilterChange(field.key, e.target.value)}
                  className={`${
                    field.icon ? 'pl-8' : 'pl-3'
                  } pr-8 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800`}
                >
                  {field.placeholder && <option value="">{field.placeholder}</option>}
                  {normalizedOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▾
                </div>
              </div>
            );
          })}

          {/* Reset Filters */}
          {onReset && hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/60 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
