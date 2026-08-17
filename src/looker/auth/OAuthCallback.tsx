import React, { useEffect, useState, useRef } from 'react';
import { useLookerAuth } from './LookerAuthProvider';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface OAuthCallbackProps {
  onComplete: () => void;
}

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ onComplete }) => {
  const { handleAuthCallback } = useLookerAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [stepMessage, setStepMessage] = useState<string>('Reading authorization code...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef<boolean>(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code was found in the redirect URL.');
        return;
      }

      try {
        setStepMessage('Exchanging PKCE authorization code with Looker /api/token...');
        await handleAuthCallback(code);
        setStepMessage('Verified Looker user session!');
        setStatus('success');

        // Transition into the main app via client-side routing
        setTimeout(() => {
          window.history.replaceState({}, '', '/');
          onComplete();
        }, 500);
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Failed to redeem authorization code with Looker.';
        setErrorMessage(message);
      }
    };

    processOAuth();
  }, [handleAuthCallback, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white">Completing Looker Authentication</h2>
            <p className="text-sm text-slate-400 font-mono text-xs bg-slate-950/60 py-2 px-3 rounded-xl border border-slate-800">
              {stepMessage}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-white">Authenticated Successfully!</h2>
            <p className="text-sm text-slate-400">
              Entering the Governed Sales Analytics Application...
            </p>
            <button
              onClick={() => {
                window.history.replaceState({}, '', '/');
                onComplete();
              }}
              className="inline-flex items-center space-x-2 mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-white">Authentication Error</h2>
            <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50 w-full text-left font-mono break-all leading-relaxed">
              {errorMessage}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors border border-slate-700"
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
