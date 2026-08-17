import React from 'react';
import { Filter, Calendar, Tag, Radio, RotateCcw } from 'lucide-react';

export interface FilterValues {
  year: string;
  category: string;
  channel: string;
}

interface FilterBarProps {
  filters: FilterValues;
  onFilterChange: (key: keyof FilterValues, value: string) => void;
  onReset: () => void;
  categoryOptions?: string[];
  channelOptions?: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  categoryOptions = ['All Categories', 'WINE', 'SPIRITS', 'BEER', 'SPIRITS RTD', 'Other'],
  channelOptions = ['All Channels', 'Retail Store', 'Online', 'Wholesale', 'Distributor', 'Direct to Consumer'],
}) => {
  const years = [
    { label: '2024', value: '2024' },
    { label: '2023', value: '2023' },
    { label: 'All Time', value: '' },
  ];

  const hasActiveFilters = Boolean(filters.year !== '2024' || filters.category || filters.channel);

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Title */}
        <div className="flex items-center space-x-2 text-slate-300 font-medium text-sm">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Interactive Semantic Filters:</span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Buttons */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5" />
            {years.map((y) => (
              <button
                key={y.label}
                onClick={() => onFilterChange('year', y.value)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  filters.year === y.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {y.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="relative flex items-center">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={filters.category || 'All Categories'}
              onChange={(e) => {
                const val = e.target.value === 'All Categories' ? '' : e.target.value;
                onFilterChange('category', val);
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

          {/* Channel Dropdown */}
          <div className="relative flex items-center">
            <Radio className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={filters.channel || 'All Channels'}
              onChange={(e) => {
                const val = e.target.value === 'All Channels' ? '' : e.target.value;
                onFilterChange('channel', val);
              }}
              className="pl-8 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800"
            >
              {channelOptions.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▾
            </div>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
