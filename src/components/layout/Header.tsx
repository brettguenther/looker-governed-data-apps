import React, { useState, useRef, useEffect } from 'react';
import { useLookerAuth } from '../../looker/auth/LookerAuthProvider';
import { getLookerConfig } from '../../looker/config';
import { getAllRegisteredApps, getRegisteredApp } from '../../apps/registry';
import {
  Database,
  LogIn,
  LogOut,
  Code,
  User,
  Sparkles,
  ChevronDown,
  Check,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenInspector: () => void;
  onOpenGenerator: () => void;
  activeAppId: string;
  onSelectApp: (appId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInspector,
  onOpenGenerator,
  activeAppId,
  onSelectApp,
}) => {
  const { isAuthenticated, user, login, logout, isLoading } = useLookerAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = getLookerConfig();
  const hostName = new URL(config.baseUrl).hostname;
  const activeApp = getRegisteredApp(activeAppId) || getAllRegisteredApps()[0];
  const registeredApps = getAllRegisteredApps();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & App Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white tracking-tight">
                  Looker AI Data Apps
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Governed CORS API
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Instance: <span className="text-slate-300">{hostName}</span>
              </p>
            </div>
          </div>

          {/* App Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white group-hover:text-blue-200 transition-colors truncate max-w-[130px] md:max-w-[180px]">
                  {activeApp?.name || 'Select App'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px] md:max-w-[180px]">
                  {activeApp?.model} :: {activeApp?.view}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Registered Data Apps ({registeredApps.length})
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {registeredApps.map((app) => {
                    const isSelected = app.id === activeAppId;
                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          onSelectApp(app.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-start space-x-2.5 transition-colors ${
                          isSelected
                            ? 'bg-blue-600/15 text-white'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                            isSelected ? 'text-blue-400' : 'text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold truncate">{app.name}</span>
                            {app.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                {app.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {app.description}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                            model: <span className="text-slate-400">{app.model}</span> • view:{' '}
                            <span className="text-slate-400">{app.view}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & Auth */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenGenerator}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 hover:from-purple-900/60 hover:to-blue-900/60 border border-purple-500/30 text-purple-200 text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI App Recipe</span>
          </button>

          <button
            onClick={onOpenInspector}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>Query Inspector</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-medium text-white truncate max-w-[140px]">
                    {user?.display_name || user?.email || 'Looker User'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {user?.email || 'OAuth 2.0 PKCE'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Connecting...' : 'Connect Looker'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
