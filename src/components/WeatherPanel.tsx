import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  CloudLightning,
  Droplets,
  Thermometer,
  Wind,
  Shield,
  SunDim,
  MapPin,
  RefreshCw,
  Clock,
  Radio,
  Calendar,
  Compass,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { WeatherApiResponse } from '../types.ts';

interface WeatherPanelProps {
  data: WeatherApiResponse | null;
  loading: boolean;
  selectedArea: string;
  onSelectArea: (area: string) => void;
  onRefresh: () => void;
  secondsUntilNextRefresh: number;
}

export function WeatherPanel({
  data,
  loading,
  selectedArea,
  onSelectArea,
  onRefresh,
  secondsUntilNextRefresh,
}: WeatherPanelProps) {
  // Tick every 15s to re-render "Updated X min ago"
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const formatUpdatedAgo = (isoTimestamp?: string | null): string | null => {
    if (!isoTimestamp) return null;
    const time = new Date(isoTimestamp).getTime();
    if (Number.isNaN(time)) return null;
    const diffMinutes = Math.floor((Date.now() - time) / (60 * 1000));
    const rounded = Math.max(0, diffMinutes);
    return `Updated ${rounded} min ago`;
  };

  const formatForecastString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.text || val.summary || val.code || '';
    }
    return String(val);
  };

  const getForecastIcon = (forecastInput?: any, size = 'w-12 h-12') => {
    const forecastText = formatForecastString(forecastInput);
    if (!forecastText) return <Cloud className={`${size} text-slate-400`} />;
    const lower = forecastText.toLowerCase();
    if (lower.includes('thunder') || lower.includes('lightning')) {
      return <CloudLightning className={`${size} text-amber-400`} />;
    }
    if (lower.includes('heavy rain')) {
      return <CloudRain className={`${size} text-blue-500`} />;
    }
    if (lower.includes('rain') || lower.includes('shower')) {
      return <CloudRain className={`${size} text-blue-400`} />;
    }
    if (lower.includes('partly cloudy')) {
      return <CloudSun className={`${size} text-amber-300`} />;
    }
    if (lower.includes('cloudy') || lower.includes('hazy') || lower.includes('haze')) {
      return <Cloud className={`${size} text-slate-300`} />;
    }
    if (lower.includes('fair') || lower.includes('sunny')) {
      return <Sun className={`${size} text-amber-400`} />;
    }
    return <CloudSun className={`${size} text-amber-300`} />;
  };

  const getPsiCategory = (val: number | null) => {
    if (val === null || val === undefined) return { label: 'Unknown', color: 'text-slate-400 border-slate-700 bg-slate-800' };
    if (val <= 50) return { label: 'Good', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60' };
    if (val <= 100) return { label: 'Moderate', color: 'text-blue-300 border-blue-500/40 bg-blue-950/60' };
    if (val <= 200) return { label: 'Unhealthy', color: 'text-amber-300 border-amber-500/40 bg-amber-950/60' };
    if (val <= 300) return { label: 'Very Unhealthy', color: 'text-orange-400 border-orange-500/40 bg-orange-950/60' };
    return { label: 'Hazardous', color: 'text-rose-400 border-rose-500/40 bg-rose-950/60' };
  };

  const getPm25Category = (val: number | null) => {
    if (val === null || val === undefined) return { label: 'Unknown', color: 'text-slate-400 border-slate-700 bg-slate-800' };
    if (val <= 55) return { label: 'Normal', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60' };
    if (val <= 150) return { label: 'Elevated', color: 'text-amber-300 border-amber-500/40 bg-amber-950/60' };
    if (val <= 250) return { label: 'High', color: 'text-orange-400 border-orange-500/40 bg-orange-950/60' };
    return { label: 'Very High', color: 'text-rose-400 border-rose-500/40 bg-rose-950/60' };
  };

  const getUvCategory = (val: number | null) => {
    if (val === null || val === undefined) return { label: 'Unknown', color: 'text-slate-400 border-slate-700 bg-slate-800' };
    if (val <= 2) return { label: 'Low', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60' };
    if (val <= 5) return { label: 'Moderate', color: 'text-amber-300 border-amber-500/40 bg-amber-950/60' };
    if (val <= 7) return { label: 'High', color: 'text-orange-400 border-orange-500/40 bg-orange-950/60' };
    if (val <= 10) return { label: 'Very High', color: 'text-rose-400 border-rose-500/40 bg-rose-950/60' };
    return { label: 'Extreme', color: 'text-purple-300 border-purple-500/40 bg-purple-950/60' };
  };

  // Safe checks: explicitly check for null/undefined/NaN, allowing 0
  const isTempValid =
    data?.temperature !== null &&
    data?.temperature !== undefined &&
    typeof data.temperature.value === 'number' &&
    !Number.isNaN(data.temperature.value);

  const isRainValid =
    data?.rainfall !== null &&
    data?.rainfall !== undefined &&
    typeof data.rainfall.value === 'number' &&
    !Number.isNaN(data.rainfall.value);

  const isHumidityValid =
    data?.humidity !== null &&
    data?.humidity !== undefined &&
    typeof data.humidity.value === 'number' &&
    !Number.isNaN(data.humidity.value);

  const isWindValid =
    data?.windSpeed !== null &&
    data?.windSpeed !== undefined &&
    typeof data.windSpeed.value === 'number' &&
    !Number.isNaN(data.windSpeed.value);

  const isPsiValid =
    data?.psi !== null &&
    data?.psi !== undefined &&
    typeof data.psi.value === 'number' &&
    !Number.isNaN(data.psi.value);

  const isPm25Valid =
    data?.pm25 !== null &&
    data?.pm25 !== undefined &&
    typeof data.pm25.value === 'number' &&
    !Number.isNaN(data.pm25.value);

  const isUvValid =
    data?.uv !== null &&
    data?.uv !== undefined &&
    typeof data.uv.value === 'number' &&
    !Number.isNaN(data.uv.value);

  const isForecastValid = Boolean(data?.forecast?.text);
  const isTwentyFourValid = Boolean(data?.twentyFourHr?.general?.forecast);
  const isFourDayValid = Boolean(data?.fourDayOutlook?.forecasts?.length);

  return (
    <div className="space-y-8">
      {/* Top Area Controls Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-[260px]">
            <label htmlFor="area-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Forecast Area (Singapore)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                <MapPin className="w-5 h-5" />
              </div>
              <select
                id="area-select"
                value={selectedArea}
                onChange={(e) => onSelectArea(e.target.value)}
                disabled={loading || !data?.validAreas?.length}
                className="w-full pl-11 pr-10 py-3 bg-slate-950/90 text-slate-100 font-medium rounded-xl border border-slate-700/80 hover:border-cyan-500/60 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-base transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                {data?.validAreas && data.validAreas.length > 0 ? (
                  data.validAreas.map((areaName) => (
                    <option key={areaName} value={areaName} className="bg-slate-900 text-slate-100 py-1">
                      {areaName}
                    </option>
                  ))
                ) : (
                  <option value={selectedArea} className="bg-slate-900 text-slate-100">
                    {selectedArea}
                  </option>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-refresh in <strong className="text-slate-200">{secondsUntilNextRefresh}s</strong></span>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh all real-time feeds"
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl font-medium text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                data?.keyConfigured
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Radio className="w-3 h-3" />
              {data?.keyConfigured ? 'API Key Active (Dedicated Quota)' : 'Public Anonymous Tier (Rate limited by data.gov.sg)'}
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            10 Real-Time Datasets: 2h/24h/4d Forecasts • Temp • Rain • Humidity • Wind • PSI • PM2.5 • UV
          </div>
        </div>
      </div>

      {/* Section 1: Hero 2-Hour Forecast Card (two-hr-forecast) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-cyan-300">
                2-Hour Forecast (Local Area)
              </span>
              <span className="text-xs text-slate-400 font-medium">Area: {data?.area || selectedArea}</span>
            </div>

            {isForecastValid && data?.forecast ? (
              <>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {formatForecastString(data.forecast.text)}
                </h2>
                {data.forecast.validPeriod?.text && (
                  <p className="text-sm font-medium text-cyan-200/90 flex items-center gap-1.5">
                    <span>Valid window:</span>
                    <span className="text-white font-semibold">{data.forecast.validPeriod.text}</span>
                  </p>
                )}
              </>
            ) : (
              <div className="py-2 text-slate-400 italic text-base">
                Forecast reading not available right now
              </div>
            )}
          </div>

          <div className="flex flex-col md:items-end justify-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner flex items-center gap-4">
              {getForecastIcon(data?.forecast?.text)}
              {isForecastValid && data?.forecast?.timestamp && (
                <div className="text-right">
                  <span className="inline-block text-xs font-medium text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-700/60">
                    {formatUpdatedAgo(data.forecast.timestamp)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Four Meteorological Station Readings (air-temperature, rainfall, relative-humidity, wind-speed) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Real-Time Weather Station Readings (Nearest Active Stations)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Air Temperature */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Air Temperature</h3>
                </div>
                {isTempValid && data?.temperature?.timestamp && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    {formatUpdatedAgo(data.temperature.timestamp)}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isTempValid && data?.temperature ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {data.temperature.value.toFixed(1)}
                    </span>
                    <span className="text-xl font-bold text-amber-400">°C</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Temperature reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/70 text-[11px]">
              {isTempValid && data?.temperature?.stationName ? (
                <div className="text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate" title={data.temperature.stationName}>
                    {data.temperature.stationName}
                  </span>
                  <span className="shrink-0 text-cyan-400 font-medium">
                    {data.temperature.distanceKm.toFixed(1)} km
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">Station reading unavailable</span>
              )}
            </div>
          </div>

          {/* Rainfall */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Rainfall</h3>
                </div>
                {isRainValid && data?.rainfall?.timestamp && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    {formatUpdatedAgo(data.rainfall.timestamp)}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isRainValid && data?.rainfall ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {data.rainfall.value.toFixed(1)}
                    </span>
                    <span className="text-lg font-bold text-blue-400">mm</span>
                    {data.rainfall.value === 0 && (
                      <span className="ml-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        No Rain
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Rainfall reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/70 text-[11px]">
              {isRainValid && data?.rainfall?.stationName ? (
                <div className="text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate" title={data.rainfall.stationName}>
                    {data.rainfall.stationName}
                  </span>
                  <span className="shrink-0 text-cyan-400 font-medium">
                    {data.rainfall.distanceKm.toFixed(1)} km
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">Station reading unavailable</span>
              )}
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Relative Humidity</h3>
                </div>
                {isHumidityValid && data?.humidity?.timestamp && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    {formatUpdatedAgo(data.humidity.timestamp)}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isHumidityValid && data?.humidity ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {Math.round(data.humidity.value)}
                    </span>
                    <span className="text-xl font-bold text-teal-400">%</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Relative humidity reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/70 text-[11px]">
              {isHumidityValid && data?.humidity?.stationName ? (
                <div className="text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate" title={data.humidity.stationName}>
                    {data.humidity.stationName}
                  </span>
                  <span className="shrink-0 text-cyan-400 font-medium">
                    {data.humidity.distanceKm.toFixed(1)} km
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">Station reading unavailable</span>
              )}
            </div>
          </div>

          {/* Wind Speed (wind-speed) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Wind className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Wind Speed</h3>
                </div>
                {isWindValid && data?.windSpeed?.timestamp && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    {formatUpdatedAgo(data.windSpeed.timestamp)}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isWindValid && data?.windSpeed ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {data.windSpeed.value.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-cyan-400">knots</span>
                    <span className="text-xs text-slate-400">
                      ({(data.windSpeed.value * 1.852).toFixed(1)} km/h)
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Wind speed reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/70 text-[11px]">
              {isWindValid && data?.windSpeed?.stationName ? (
                <div className="text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate" title={data.windSpeed.stationName}>
                    {data.windSpeed.stationName}
                  </span>
                  <span className="shrink-0 text-cyan-400 font-medium">
                    {data.windSpeed.distanceKm.toFixed(1)} km
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">Station reading unavailable</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Air Quality & Environment (psi, pm25, uv) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Real-Time Environmental & Air Quality Indicators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 24-Hour PSI (psi) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">24-Hour PSI</h3>
                </div>
                {isPsiValid && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPsiCategory(data!.psi!.value).color}`}>
                    {getPsiCategory(data!.psi!.value).label}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isPsiValid && data?.psi ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {data.psi.value}
                      </span>
                      <span className="text-xs text-slate-400 uppercase font-medium">
                        Region: <strong className="text-slate-200 capitalize">{data.psi.region}</strong> ({data.psi.distanceKm} km away)
                      </span>
                    </div>

                    {data.psi.regional && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-5 gap-1 text-center">
                        {Object.entries(data.psi.regional).map(([rName, rVal]) => (
                          <div key={rName} className="p-1 rounded bg-slate-950/60 border border-slate-800">
                            <span className="block text-[9px] uppercase text-slate-400">{rName[0]}</span>
                            <span className="text-xs font-bold text-slate-200">{rVal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    PSI reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500">
              {isPsiValid && data?.psi?.timestamp ? formatUpdatedAgo(data.psi.timestamp) : 'Pollutant Standards Index'}
            </div>
          </div>

          {/* 1-Hour PM2.5 (pm25) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">1-Hour PM2.5</h3>
                </div>
                {isPm25Valid && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPm25Category(data!.pm25!.value).color}`}>
                    {getPm25Category(data!.pm25!.value).label}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isPm25Valid && data?.pm25 ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {data.pm25.value}
                      </span>
                      <span className="text-sm text-emerald-400 font-semibold">µg/m³</span>
                      <span className="text-xs text-slate-400 uppercase font-medium">
                        Region: <strong className="text-slate-200 capitalize">{data.pm25.region}</strong>
                      </span>
                    </div>

                    {data.pm25.regional && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-5 gap-1 text-center">
                        {Object.entries(data.pm25.regional).map(([rName, rVal]) => (
                          <div key={rName} className="p-1 rounded bg-slate-950/60 border border-slate-800">
                            <span className="block text-[9px] uppercase text-slate-400">{rName[0]}</span>
                            <span className="text-xs font-bold text-slate-200">{rVal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    PM2.5 reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500">
              {isPm25Valid && data?.pm25?.timestamp ? formatUpdatedAgo(data.pm25.timestamp) : 'Fine Particulate Matter'}
            </div>
          </div>

          {/* UV Index (uv) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <SunDim className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">UV Index (Solar)</h3>
                </div>
                {isUvValid && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getUvCategory(data!.uv!.value).color}`}>
                    {getUvCategory(data!.uv!.value).label}
                  </span>
                )}
              </div>

              <div className="my-3">
                {isUvValid && data?.uv ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {data.uv.value}
                    </span>
                    <span className="text-xs text-slate-400">
                      (Hourly Index reading)
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    UV reading not available right now
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500">
              {isUvValid && data?.uv?.timestamp ? formatUpdatedAgo(data.uv.timestamp) : 'National Ultraviolet Index'}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: 24-Hour Island-wide Forecast (twenty-four-hr-forecast) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            24-Hour Island-Wide Forecast & Outlook
          </h2>
        </div>

        {isTwentyFourValid && data?.twentyFourHr ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {getForecastIcon(data.twentyFourHr.general.forecast, 'w-10 h-10')}
                <div>
                  <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                    Island-Wide Overview
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {formatForecastString(data.twentyFourHr.general.forecast)}
                  </h3>
                  {data.twentyFourHr.general.validPeriod && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Window: {data.twentyFourHr.general.validPeriod}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Temperature</span>
                  <span className="text-sm font-bold text-amber-300">
                    {data.twentyFourHr.general.temperature.low ?? '-'}°C - {data.twentyFourHr.general.temperature.high ?? '-'}°C
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Humidity</span>
                  <span className="text-sm font-bold text-teal-300">
                    {data.twentyFourHr.general.relativeHumidity.low ?? '-'}% - {data.twentyFourHr.general.relativeHumidity.high ?? '-'}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Wind</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {data.twentyFourHr.general.wind.direction ?? ''} {data.twentyFourHr.general.wind.speed?.low ?? ''}-{data.twentyFourHr.general.wind.speed?.high ?? ''} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* Time Periods */}
            {data.twentyFourHr.periods && data.twentyFourHr.periods.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {data.twentyFourHr.periods.map((period, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-semibold text-cyan-300 block">
                      {period.timePeriod?.text || `Period ${idx + 1}`}
                    </span>
                    <div className="text-xs text-slate-300 space-y-0.5">
                      {Object.entries(period.regions || {}).map(([rName, rForecast]) => (
                        <div key={rName} className="flex justify-between text-[11px]">
                          <span className="capitalize text-slate-400">{rName}:</span>
                          <span className="font-medium text-slate-200">{formatForecastString(rForecast)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-slate-400 italic text-sm">
            24-Hour Forecast reading not available right now
          </div>
        )}
      </div>

      {/* Section 5: 4-Day Outlook (four-day-outlook) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            4-Day Weather Outlook
          </h2>
        </div>

        {isFourDayValid && data?.fourDayOutlook?.forecasts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.fourDayOutlook.forecasts.map((fItem, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-base text-white">{fItem.day}</h3>
                    {getForecastIcon(fItem.text, 'w-7 h-7')}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-semibold text-cyan-300">{formatForecastString(fItem.text)}</p>
                    {fItem.summary && (
                      <p className="text-xs text-slate-400 line-clamp-2">{fItem.summary}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temp Range:</span>
                    <span className="font-bold text-amber-300">
                      {fItem.temperature?.low ?? '-'}°C - {fItem.temperature?.high ?? '-'}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Humidity:</span>
                    <span className="font-medium text-teal-300">
                      {fItem.relativeHumidity?.low ?? '-'}% - {fItem.relativeHumidity?.high ?? '-'}%
                    </span>
                  </div>
                  {fItem.wind && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wind:</span>
                      <span className="font-medium text-slate-300">
                        {fItem.wind.direction ?? ''} {fItem.wind.speed?.low ?? ''}-{fItem.wind.speed?.high ?? ''} km/h
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-slate-400 italic text-sm">
            4-Day Outlook reading not available right now
          </div>
        )}
      </div>

      {/* Informational Notice */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 flex items-start gap-3 text-xs text-slate-400">
        <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <p>
            <strong>Live Multi-Feed Integration:</strong> This panel aggregates all 10 real-time meteorological feeds provided by data.gov.sg (2-hour, 24-hour, and 4-day forecasts, air temperature, rainfall, relative humidity, wind speed, PSI, PM2.5, and UV index). Readings are continuously resolved to the nearest active NEA stations and geographical regions.
          </p>
        </div>
      </div>
    </div>
  );
}
