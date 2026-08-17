import React, { useState, useEffect } from 'react';
import { LookerAuthProvider, useLookerAuth } from './looker/auth/LookerAuthProvider';
import { OAuthCallback } from './looker/auth/OAuthCallback';
import { Header } from './components/layout/Header';
import { LoginPrompt } from './components/common/LoginPrompt';
import { BasicEcommApp } from './apps/basic-ecomm/BasicEcommApp';
import { SemanticInspector } from './components/common/SemanticInspector';
import { AppGeneratorModal } from './apps/app-generator/AppGeneratorModal';
import type { LookerQueryPayload } from './types/looker';
import { Loader2 } from 'lucide-react';

interface RegisteredQuery {
  name: string;
  payload: LookerQueryPayload;
  executionTimeMs?: number | null;
  status: 'success' | 'loading' | 'error';
}

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useLookerAuth();
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [registeredQueries, setRegisteredQueries] = useState<RegisteredQuery[]>([]);

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
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          <BasicEcommApp onRegisterQueries={setRegisteredQueries} />
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
