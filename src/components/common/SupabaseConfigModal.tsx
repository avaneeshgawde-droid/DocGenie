import React, { useState, useEffect } from 'react';
import { Database, Shield, ExternalLink, Check, Copy, AlertCircle, X, Key, Globe } from 'lucide-react';
import { Button } from './Button';
import { config } from '../../config/env';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [envConfig, setEnvConfig] = useState(() => ({
    isConfigured: config.isSupabaseConfigured,
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
  }));

  useEffect(() => {
    if (isOpen) {
      setEnvConfig({
        isConfigured: config.isSupabaseConfigured,
        url: config.supabaseUrl,
        anonKey: config.supabaseAnonKey,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 id="supabase-modal-title" className="text-base font-semibold text-slate-900">
                Supabase Environment Status
              </h2>
              <p className="text-xs text-slate-500">Dual-layer cloud persistence & isolated mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Indicator */}
          <div
            className={`flex items-start space-x-3 p-3.5 rounded-lg border ${
              envConfig.isConfigured
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}
          >
            {envConfig.isConfigured ? (
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm">
                {envConfig.isConfigured
                  ? 'Supabase Cloud Connected'
                  : 'Isolated Demo Mode Active'}
              </div>
              <p className="leading-relaxed">
                {envConfig.isConfigured
                  ? 'Real-time case persistence, live intake streaming, and cloud auth are fully enabled.'
                  : 'The application is running in zero-dependency isolated demo mode using in-browser local storage with synthetic clinical records.'}
              </p>
            </div>
          </div>

          {/* Configuration Values */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Environment Variables
            </h4>

            {/* URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>VITE_SUPABASE_URL</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {envConfig.url ? 'SET' : 'NOT SET'}
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={envConfig.url || 'Not configured (using local storage fallback)'}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg truncate select-all"
                />
                {envConfig.url && (
                  <button
                    onClick={() => handleCopy(envConfig.url || '', 'url')}
                    className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    title="Copy URL"
                  >
                    {copiedKey === 'url' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Anon Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>VITE_SUPABASE_ANON_KEY</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {envConfig.anonKey ? 'SET' : 'NOT SET'}
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  readOnly
                  value={envConfig.anonKey || '••••••••••••••••••••••••••••••••'}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg truncate select-all"
                />
                {envConfig.anonKey && (
                  <button
                    onClick={() => handleCopy(envConfig.anonKey || '', 'key')}
                    className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    title="Copy Key"
                  >
                    {copiedKey === 'key' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 text-xs space-y-2 text-slate-600">
            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <span>Connect your Supabase project:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Create a project at supabase.com</li>
              <li>Add the keys to your <code className="text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded font-mono">.env</code> file</li>
              <li>Rebuild or restart the application dev server</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <a
            href="https://supabase.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-700 hover:text-teal-800 flex items-center space-x-1 font-medium hover:underline"
          >
            <span>Supabase Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
