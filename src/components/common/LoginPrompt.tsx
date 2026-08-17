import React from 'react';
import { useLookerAuth } from '../../looker/auth/LookerAuthProvider';
import { getLookerConfig } from '../../looker/config';
import { ShieldCheck, Database, Zap, Lock, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPrompt: React.FC = () => {
  const { login, isLoading, error } = useLookerAuth();
  const config = getLookerConfig();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Hero Box */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
        {/* Glow background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Governed AI Data Application Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          AI-Generated Custom UI backed by Looker CORS API
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Authenticate directly with your Looker instance using OAuth 2.0 PKCE. Queries run dynamically against Looker’s semantic layer with complete row-level governance and zero static mock data.
        </p>

        {/* OAuth Details Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-white">Semantic Layer</h3>
            <p className="text-[11px] text-slate-400 mt-1">Queries execute live against <code className="text-blue-400 font-mono">basic_ecomm</code> LookML model.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-white">OAuth2 + PKCE</h3>
            <p className="text-[11px] text-slate-400 mt-1">Direct client-side auth via <code className="text-emerald-400 font-mono">{config.clientId}</code>.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-white">TypeScript SDK</h3>
            <p className="text-[11px] text-slate-400 mt-1">Powered by official <code className="text-purple-400 font-mono">@looker/sdk</code> and <code className="text-purple-400 font-mono">OAuthSession</code>.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={login}
            disabled={isLoading}
            className="inline-flex items-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to Looker...</span>
              </>
            ) : (
              <>
                <span>Connect with Looker OAuth</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-xs text-rose-400 bg-rose-950/40 px-4 py-2 rounded-xl border border-rose-900">
              {error}
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500 font-mono">
            Redirect Target: {config.baseUrl}/auth
          </p>
        </div>
      </div>
    </div>
  );
};
