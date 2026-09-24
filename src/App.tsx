import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CloudSun,
  Activity,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { WeatherApiResponse } from './types.ts';
import { WeatherPanel } from './components/WeatherPanel.tsx';
import { HealthStatusModal } from './components/HealthStatusModal.tsx';

export default function App() {
  const [selectedArea, setSelectedArea] = useState<string>('City');
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(60);
  const [isHealthOpen, setIsHealthOpen] = useState<boolean>(false);

  // Day / Night Theme State with LocalStorage persistence
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    try {
      const saved = localStorage.getItem('weather_theme');
      if (saved === 'day' || saved === 'night') return saved;
      // Default to day mode between 7 AM and 7 PM Singapore time (UTC+8)
      const now = new Date();
      const utcHours = now.getUTCHours();
      const sgHours = (utcHours + 8) % 24;
      return sgHours >= 7 && sgHours < 19 ? 'day' : 'night';
    } catch {
      return 'day';
    }
  });

  const isDay = theme === 'day';

  const toggleTheme = () => {
    const next = isDay ? 'night' : 'day';
    setTheme(next);
    try {
      localStorage.setItem('weather_theme', next);
    } catch {
      // ignore
    }
  };

  // Access date formatted for Singapore locale: e.g. "24 September 2026"
  const [accessDate, setAccessDate] = useState<string>('24 September 2026');

  useEffect(() => {
    try {
      const formatted = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (formatted) setAccessDate(formatted);
    } catch {
      // fallback
    }
  }, []);

  const fetchWeather = useCallback(async (areaToFetch: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/weather?Area=${encodeURIComponent(areaToFetch)}`);
      if (!res.ok) {
        if (res.status === 400) {
          const errData = await res.json();
          setError(errData.error || 'Unknown area specified');
          if (errData.validAreas?.length) {
            setWeatherData((prev) => (prev ? { ...prev, validAreas: errData.validAreas } : null));
          }
          return;
        }

        if (res.status === 502) {
          setError('All upstream weather services are currently unavailable. Please retry in a moment.');
          return;
        }

        setError(`Weather service returned HTTP ${res.status}`);
        return;
      }

      const data: WeatherApiResponse = await res.json();
      setWeatherData(data);
      if (data.area) {
        setSelectedArea(data.area);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to weather service');
    } finally {
      setLoading(false);
      setSecondsUntilRefresh(60);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWeather(selectedArea);
  }, []);

  // 60-second refresh countdown timer
  const selectedAreaRef = useRef(selectedArea);
  selectedAreaRef.current = selectedArea;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchWeather(selectedAreaRef.current);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchWeather]);

  const handleSelectArea = (newArea: string) => {
    setSelectedArea(newArea);
    fetchWeather(newArea);
  };

  const handleManualRefresh = () => {
    fetchWeather(selectedArea);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-700 ${
        isDay
          ? 'bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* App Header */}
      <header
        className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
          isDay
            ? 'border-slate-200/90 bg-white/85 shadow-sm'
            : 'border-slate-800/80 bg-slate-900/60'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <h1
                className={`font-bold text-base sm:text-lg tracking-tight flex items-center gap-2 ${
                  isDay ? 'text-slate-900' : 'text-white'
                }`}
              >
                Singapore Live Weather
                <span
                  className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full ${
                    isDay
                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                      : 'bg-cyan-950 border border-cyan-800 text-cyan-400'
                  }`}
                >
                  Real-time
                </span>
              </h1>
              <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>
                NEA Meteorological Station Network via data.gov.sg
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Day / Night Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDay ? 'Night' : 'Day'} Mode`}
              aria-label={`Toggle to ${isDay ? 'Night' : 'Day'} Mode`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-amber-300'
              }`}
            >
              {isDay ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline font-medium text-slate-700">Day Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline font-medium text-slate-200">Night Mode</span>
                </>
              )}
            </button>

            {/* Health Endpoint Modal Trigger */}
            <button
              onClick={() => setIsHealthOpen(true)}
              title="Inspect Service & API Key Health"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-400'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="hidden sm:inline">System Health</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/70 text-rose-200 text-sm flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleManualRefresh}
              className="text-xs font-semibold px-2.5 py-1 bg-rose-900/60 hover:bg-rose-900 rounded border border-rose-700 text-white shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Live Singapore Weather Panel */}
        <WeatherPanel
          data={weatherData}
          loading={loading}
          selectedArea={selectedArea}
          onSelectArea={handleSelectArea}
          onRefresh={handleManualRefresh}
          secondsUntilNextRefresh={secondsUntilRefresh}
          theme={theme}
        />
      </main>

      {/* Health modal */}
      <HealthStatusModal isOpen={isHealthOpen} onClose={() => setIsHealthOpen(false)} />

      {/* Statutory Footer with Exact Required Licence Text */}
      <footer
        className={`border-t py-8 px-4 sm:px-6 mt-auto transition-colors ${
          isDay
            ? 'border-slate-200 bg-white/80 text-slate-600'
            : 'border-slate-800/80 bg-slate-950/90 text-slate-400'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-4">
          <p className="text-xs leading-relaxed text-center sm:text-left">
            Contains information from the Real-time Weather Readings and Weather Forecast datasets accessed on{' '}
            {accessDate} from data.gov.sg, which is made available under the terms of the Singapore Open Data
            Licence version 1.0{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              https://data.gov.sg/open-data-licence
              <ExternalLink className="w-3 h-3 inline" />
            </a>
            . Weather data is provided by the National Environment Agency. This is an SMU course project and is
            not affiliated with or endorsed by the National Enviroment Agency or data.gov.sg.
          </p>
          <div
            className={`flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2 border-t pt-4 ${
              isDay ? 'border-slate-200 text-slate-500' : 'border-slate-900 text-slate-500'
            }`}
          >
            <div>Live Singapore Weather Monitor • Auto-refresh 60s</div>
            <div className="flex items-center gap-4">
              <span>Station Distance: Haversine Geodesic</span>
              <span>10 Real-Time Endpoints (SWR Protected)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
