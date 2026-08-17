import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Terminal, Cpu } from 'lucide-react';

interface AppGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppGeneratorModal: React.FC<AppGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const samplePrompt = `I want to create a new Looker AI Data App for the "banking" model.
Please:
1. Use Looker MCP to explore the models, explores, and dimensions/measures.
2. Formulate declarative Looker query definitions in a queries.ts file.
3. Build an interactive React component using the useLookerQuery hook with dynamic filters, KPIs, charts, and table.
4. Integrate the new app into the LookerAuthProvider harness.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(samplePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Data App Generation Workflow</h2>
              <p className="text-xs text-slate-400">How LLMs build new governed applications in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-xs text-slate-300">
          {/* Step Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>1. MCP Discovery</span>
              </div>
              <p className="text-[11px] text-slate-400">
                LLM queries Looker MCP to discover explores, dimensions, and measures.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center space-x-1.5 text-purple-400 font-semibold mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>2. Code Synthesis</span>
              </div>
              <p className="text-[11px] text-slate-400">
                LLM writes declarative queries + React UI using <code className="text-purple-300">useLookerQuery</code>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Governed Runtime</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Browser executes queries live via CORS OAuth with full LookML governance.
              </p>
            </div>
          </div>

          {/* Copyable Prompt Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Sample Prompt for AI Assistant:</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-purple-200 overflow-x-auto">
              {samplePrompt}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
