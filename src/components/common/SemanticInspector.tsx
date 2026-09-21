import React, { useState } from 'react';
import { X, Code2, ShieldCheck, Terminal, Copy, Check, ExternalLink, Zap, RotateCcw } from 'lucide-react';
import type { RegisteredQuery } from '../../types/looker';
import { getLookerConfig } from '../../looker/config';
import { clearLookerQueryCache, getLookerQueryCacheStats } from '../../looker/hooks/useLookerQuery';

interface SemanticInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  queries: RegisteredQuery[];
}

export const SemanticInspector: React.FC<SemanticInspectorProps> = ({ isOpen, onClose, queries }) => {
  const [activeTab, setActiveTab] = useState<'queries' | 'governance' | 'code'>('queries');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);
  const config = getLookerConfig();

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleClearCache = () => {
    clearLookerQueryCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 1500);
  };

  const cacheStats = getLookerQueryCacheStats();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Semantic Layer Inspector</h2>
              <p className="text-xs text-slate-400 font-mono">Live Looker CORS API & Governance Verification</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearCache}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Clear client-side SWR query cache"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>{cacheCleared ? 'Cache Cleared' : `Clear Cache (${cacheStats.size})`}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6">
          <button
            onClick={() => setActiveTab('queries')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'queries'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Queries ({queries.length})
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'governance'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Governance & Security
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SDK Client Code
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'queries' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl text-xs text-blue-300">
                <span className="font-semibold">CORS Target:</span>{' '}
                <span className="font-mono text-white">{config.baseUrl}/api/4.0/queries/run/json</span>
              </div>

              {queries.map((q, idx) => {
                const jsonString = JSON.stringify(q.payload, null, 2);
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                    <div className="px-4 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{q.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {q.payload.model}.{q.payload.view}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {q.fromCache ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>SWR Cache (0ms)</span>
                          </span>
                        ) : q.executionTimeMs !== null && q.executionTimeMs !== undefined ? (
                          <span className="text-[11px] font-mono text-emerald-400">
                            {q.executionTimeMs}ms
                          </span>
                        ) : null}
                        <button
                          onClick={() => handleCopy(jsonString, idx)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="Copy JSON Payload"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 text-[11px] font-mono text-slate-300 bg-slate-950/80 overflow-x-auto">
                      <code>{jsonString}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Why This Architecture is 100% Governed</span>
                </div>
                <p className="text-slate-300">
                  Unlike traditional LLM-generated dashboards that embed static JSON snapshots, this application executes queries dynamically in real-time against Looker using the logged-in user's Looker OAuth token.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="font-semibold text-white mb-1">1. Row-Level Security (RLS) & Access Filters</h4>
                  <p className="text-slate-400">
                    Looker automatically evaluates user attributes and applies SQL row-level filters at query execution time. Users only see data their permissions authorize.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="font-semibold text-white mb-1">2. Single Source of Truth Semantic Layer</h4>
                  <p className="text-slate-400">
                    All calculations, aggregations, and business logic originate from the LookML models (<code className="text-blue-400">edg_orders</code>). Changes in LookML immediately reflect in this frontend without code changes.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="font-semibold text-white mb-1">3. Direct Browser CORS + OAuth PKCE</h4>
                  <p className="text-slate-400">
                    No backend API proxy is required. Authentication uses standard OAuth 2.0 PKCE with client ID <code className="text-amber-400">{config.clientId}</code>, and API requests talk directly to Looker via CORS.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Here is the TypeScript SDK hook pattern used to dynamically bind UI components to Looker:
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>useLookerQuery.ts pattern</span>
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <pre className="p-4 text-[11px] font-mono text-slate-300 bg-slate-950 overflow-x-auto leading-normal">
{`import { useLookerQuery } from './looker/hooks/useLookerQuery';

export const SalesWidget = ({ year, category }) => {
  const { data, loading, error } = useLookerQuery({
    model: 'edg_orders',
    view: 'fct_orders',
    fields: ['fct_orders.sales_channel', 'fct_orders.total_sales'],
    filters: {
      ...(year ? { 'fct_orders.order_date_year': year } : {}),
      ...(category ? { 'fct_orders.consolidated_category': category } : {})
    },
    sorts: ['fct_orders.total_sales desc'],
    limit: 10
  });

  if (loading) return <Spinner />;
  return <DataChart data={data} xKey="fct_orders.sales_channel" yKey="fct_orders.total_sales" />;
};`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <a
            href={config.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300"
          >
            <span>Open Looker Instance</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
