import React, { useState } from 'react';
import { Download, ArrowUpDown, Loader2, Database } from 'lucide-react';

interface ColumnDef {
  key: string;
  label: string;
  format?: 'currency' | 'number' | 'text' | 'date';
}

interface DataTableProps {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  columns: ColumnDef[];
  loading?: boolean;
  error?: Error | null;
  modelView?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  subtitle,
  data,
  columns,
  loading = false,
  error = null,
  modelView,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDirection === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const formatCellValue = (val: unknown, format?: string): string => {
    if (val === null || val === undefined) return '—';
    const num = Number(val);
    if (!isNaN(num) && (format === 'currency' || (!format && typeof val === 'number'))) {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
      }
      return new Intl.NumberFormat('en-US').format(num);
    }
    return String(val);
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_looker_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
            {modelView && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 border border-blue-800/60 text-blue-300">
                <Database className="w-2.5 h-2.5 mr-1" />
                {modelView}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-mono">
            {data.length} row{data.length !== 1 ? 's' : ''} returned
          </span>
          <button
            onClick={exportCSV}
            disabled={data.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-slate-200 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/60 uppercase tracking-wider text-[11px] text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 cursor-pointer select-none hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col.label}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="font-mono">Streaming semantic data from Looker...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-rose-400">
                  Failed to fetch table data: {error.message}
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No records match current filter criteria.
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/40 transition-colors font-mono text-[11.5px]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-slate-200">
                      {formatCellValue(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
