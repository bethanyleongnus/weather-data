import React, { useState, useEffect } from 'react';
import { X, Activity, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { HealthApiResponse } from '../types.ts';

interface HealthStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENDPOINT_LABELS: Record<string, string> = {
  'two-hr-forecast': '2-Hour Forecast API',
  'twenty-four-hr-forecast': '24-Hour Forecast API',
  'four-day-outlook': '4-Day Outlook API',
  'air-temperature': 'Air Temperature API',
  'rainfall': 'Rainfall API',
  'relative-humidity': 'Relative Humidity API',
  'wind-speed': 'Wind Speed API',
  'psi': 'PSI (Pollutant Standards) API',
  'pm25': 'PM2.5 Concentration API',
  'uv': 'UV Index API',
};

export function HealthStatusModal({ isOpen, onClose }: HealthStatusModalProps) {
  const [health, setHealth] = useState<HealthApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to query health endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Real-Time API Health Status</h3>
              <p className="text-xs text-slate-400">All 10 data.gov.sg upstream endpoints diagnostic check</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && !health && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-sm">Pinging 10 data.gov.sg endpoints in parallel...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {health && (
          <div className="space-y-4">
            {/* API Key Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-3">
                {health.keyConfigured ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white">DATA_GOV_SG_API_KEY</h4>
                  <p className="text-xs text-slate-400">
                    {health.keyConfigured
                      ? 'Environment secret present (x-api-key active)'
                      : 'Not configured (Operating in anonymous rate limit tier)'}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  health.keyConfigured
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {health.keyConfigured ? 'Configured' : 'Anonymous'}
              </span>
            </div>

            {/* Endpoints Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                10 Upstream Real-Time Endpoints
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(health.endpoints || {}).map(([epName, info]) => (
                  <div
                    key={epName}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="pr-2">
                      <span className="font-medium text-slate-200 block">
                        {ENDPOINT_LABELS[epName] || epName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{epName}</span>
                      {info.reason && (
                        <p className="text-[10px] text-amber-400/90 mt-0.5 truncate max-w-[200px]" title={info.reason}>
                          {info.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-400">HTTP {info.status}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] ${
                          info.ok
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {info.ok ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Degraded
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-800">
          <span>Route: <code className="text-slate-400 font-mono">/api/health</code></span>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recheck All 10</span>
          </button>
        </div>
      </div>
    </div>
  );
}
