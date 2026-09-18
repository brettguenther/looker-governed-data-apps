import React, { useState, useEffect, useCallback } from 'react';
import { LookerAuthProvider, useLookerAuth } from './looker/auth/LookerAuthProvider';
import { OAuthCallback } from './looker/auth/OAuthCallback';
import { Header } from './components/layout/Header';
import { LoginPrompt } from './components/common/LoginPrompt';
import { SemanticInspector } from './components/common/SemanticInspector';
import { AppGeneratorModal } from './apps/app-generator/AppGeneratorModal';
import { getRegisteredApp, getDefaultApp } from './apps/registry';
import type { RegisteredQuery } from './types/looker';
import { Loader2, AlertCircle } from 'lucide-react';

const getAppIdFromUrl = (): string => {
  const params = new URLSearchParams(window.location.search);
  const appParam = params.get('app');
  if (appParam && getRegisteredApp(appParam)) {
    return appParam;
  }
  return getDefaultApp().id;
};

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useLookerAuth();
  const [activeAppId, setActiveAppId] = useState<string>(getAppIdFromUrl);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [registeredQueries, setRegisteredQueries] = useState<RegisteredQuery[]>([]);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveAppId(getAppIdFromUrl());
      setRegisteredQueries([]);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectApp = useCallback((appId: string) => {
    setActiveAppId(appId);
    setRegisteredQueries([]);
    const url = new URL(window.location.href);
    url.searchParams.set('app', appId);
    window.history.pushState({}, '', url.toString());
  }, []);

  const activeAppDef = getRegisteredApp(activeAppId) || getDefaultApp();
  const ActiveComponent = activeAppDef?.component;

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Verifying Looker Semantic Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header
        activeAppId={activeAppId}
        onSelectApp={handleSelectApp}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          ActiveComponent ? (
            <ActiveComponent onRegisterQueries={setRegisteredQueries} />
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-base font-semibold text-white">App Not Found</h3>
              <p className="text-xs text-slate-400">
                The requested app <code className="text-purple-300 font-mono">{activeAppId}</code> is not registered in the host shell.
              </p>
            </div>
          )
        ) : (
          <LoginPrompt />
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        Looker Governed AI Data Applications • Powered by Looker TypeScript SDK & OAuth 2.0 PKCE
      </footer>

      {/* Semantic Query Inspector Drawer */}
      <SemanticInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        queries={registeredQueries}
      />

      {/* AI App Generation Recipe Modal */}
      <AppGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />
    </div>
  );
};

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isCallback = currentPath === '/callback';

  return (
    <LookerAuthProvider>
      {isCallback ? (
        <OAuthCallback onComplete={() => setCurrentPath('/')} />
      ) : (
        <MainAppContent />
      )}
    </LookerAuthProvider>
  );
}

export default App;
