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
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WeatherApiResponse } from '../types.ts';

export type DatasetTab = 'all' | '2hr' | 'stations' | 'environment' | '24hr' | '4day';

interface WeatherPanelProps {
  data: WeatherApiResponse | null;
  loading: boolean;
  selectedArea: string;
  onSelectArea: (area: string) => void;
  onRefresh: () => void;
  secondsUntilNextRefresh: number;
  theme?: 'day' | 'night';
}

export function WeatherPanel({
  data,
  loading,
  selectedArea,
  onSelectArea,
  onRefresh,
  secondsUntilNextRefresh,
  theme = 'day',
}: WeatherPanelProps) {
  const isDay = theme === 'day';
  const [activeTab, setActiveTab] = useState<DatasetTab>('2hr');

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
    if (!forecastText) return <Cloud className={`${size} ${isDay ? 'text-slate-500' : 'text-slate-400'}`} />;
    const lower = forecastText.toLowerCase();
    if (lower.includes('thunder') || lower.includes('lightning')) {
      return <CloudLightning className={`${size} text-amber-500`} />;
    }
    if (lower.includes('heavy rain')) {
      return <CloudRain className={`${size} text-blue-600`} />;
    }
    if (lower.includes('rain') || lower.includes('shower')) {
      return <CloudRain className={`${size} text-blue-500`} />;
    }
    if (lower.includes('partly cloudy')) {
      return <CloudSun className={`${size} text-amber-500`} />;
    }
    if (lower.includes('cloudy') || lower.includes('hazy') || lower.includes('haze')) {
      return <Cloud className={`${size} ${isDay ? 'text-slate-500' : 'text-slate-300'}`} />;
    }
    if (lower.includes('fair') || lower.includes('sunny')) {
      return <Sun className={`${size} text-amber-500`} />;
    }
    return <CloudSun className={`${size} text-amber-500`} />;
  };

  const getPsiCategory = (val: number | null) => {
    if (val === null || val === undefined) {
      return {
        label: 'Unknown',
        color: isDay ? 'text-slate-600 border-slate-300 bg-slate-100' : 'text-slate-400 border-slate-700 bg-slate-800',
      };
    }
    if (val <= 50) {
      return {
        label: 'Good',
        color: isDay ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
      };
    }
    if (val <= 100) {
      return {
        label: 'Moderate',
        color: isDay ? 'text-blue-700 border-blue-300 bg-blue-50' : 'text-blue-300 border-blue-500/40 bg-blue-950/60',
      };
    }
    if (val <= 200) {
      return {
        label: 'Unhealthy',
        color: isDay ? 'text-amber-800 border-amber-300 bg-amber-50' : 'text-amber-300 border-amber-500/40 bg-amber-950/60',
      };
    }
    if (val <= 300) {
      return {
        label: 'Very Unhealthy',
        color: isDay ? 'text-orange-800 border-orange-300 bg-orange-50' : 'text-orange-400 border-orange-500/40 bg-orange-950/60',
      };
    }
    return {
      label: 'Hazardous',
      color: isDay ? 'text-rose-800 border-rose-300 bg-rose-50' : 'text-rose-400 border-rose-500/40 bg-rose-950/60',
    };
  };

  const getPm25Category = (val: number | null) => {
    if (val === null || val === undefined) {
      return {
        label: 'Unknown',
        color: isDay ? 'text-slate-600 border-slate-300 bg-slate-100' : 'text-slate-400 border-slate-700 bg-slate-800',
      };
    }
    if (val <= 55) {
      return {
        label: 'Normal',
        color: isDay ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
      };
    }
    if (val <= 150) {
      return {
        label: 'Elevated',
        color: isDay ? 'text-amber-800 border-amber-300 bg-amber-50' : 'text-amber-300 border-amber-500/40 bg-amber-950/60',
      };
    }
    if (val <= 250) {
      return {
        label: 'High',
        color: isDay ? 'text-orange-800 border-orange-300 bg-orange-50' : 'text-orange-400 border-orange-500/40 bg-orange-950/60',
      };
    }
    return {
      label: 'Very High',
      color: isDay ? 'text-rose-800 border-rose-300 bg-rose-50' : 'text-rose-400 border-rose-500/40 bg-rose-950/60',
    };
  };

  const getUvCategory = (val: number | null) => {
    if (val === null || val === undefined) {
      return {
        label: 'Unknown',
        color: isDay ? 'text-slate-600 border-slate-300 bg-slate-100' : 'text-slate-400 border-slate-700 bg-slate-800',
      };
    }
    if (val <= 2) {
      return {
        label: 'Low',
        color: isDay ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
      };
    }
    if (val <= 5) {
      return {
        label: 'Moderate',
        color: isDay ? 'text-amber-800 border-amber-300 bg-amber-50' : 'text-amber-300 border-amber-500/40 bg-amber-950/60',
      };
    }
    if (val <= 7) {
      return {
        label: 'High',
        color: isDay ? 'text-orange-800 border-orange-300 bg-orange-50' : 'text-orange-400 border-orange-500/40 bg-orange-950/60',
      };
    }
    if (val <= 10) {
      return {
        label: 'Very High',
        color: isDay ? 'text-rose-800 border-rose-300 bg-rose-50' : 'text-rose-400 border-rose-500/40 bg-rose-950/60',
      };
    }
    return {
      label: 'Extreme',
      color: isDay ? 'text-purple-800 border-purple-300 bg-purple-50' : 'text-purple-300 border-purple-500/40 bg-purple-950/60',
    };
  };

  // Safe checks allowing 0 as real reading
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

  // Common card style classes
  const cardBg = isDay
    ? 'bg-white/95 border border-slate-200/90 shadow-sm'
    : 'bg-slate-900/90 border border-slate-800 shadow-lg';

  const subCardBg = isDay
    ? 'bg-slate-50 border border-slate-200/80'
    : 'bg-slate-950/60 border border-slate-800';

  const sectionHeaderColor = isDay ? 'text-slate-700' : 'text-slate-300';
  const labelColor = isDay ? 'text-slate-500' : 'text-slate-400';
  const textColor = isDay ? 'text-slate-900' : 'text-white';

  // Navigation Tabs Configuration
  const tabs: { id: DatasetTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: '2hr',
      label: '2-Hour Now',
      icon: <CloudSun className="w-4 h-4" />,
      badge: data?.forecast?.text ? formatForecastString(data.forecast.text) : undefined,
    },
    {
      id: 'stations',
      label: 'Weather Stations',
      icon: <Thermometer className="w-4 h-4" />,
      badge: isTempValid ? `${data!.temperature!.value.toFixed(1)}°C` : undefined,
    },
    {
      id: 'environment',
      label: 'Air Quality & UV',
      icon: <Shield className="w-4 h-4" />,
      badge: isPsiValid ? `PSI ${data!.psi!.value}` : undefined,
    },
    {
      id: '24hr',
      label: '24-Hour Island',
      icon: <Clock className="w-4 h-4" />,
      badge: data?.twentyFourHr?.general?.forecast ? '24h' : undefined,
    },
    {
      id: '4day',
      label: '4-Day Outlook',
      icon: <Calendar className="w-4 h-4" />,
      badge: isFourDayValid ? '4 Days' : undefined,
    },
    {
      id: 'all',
      label: 'All Datasets',
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  /* ------------------- Section Renderers ------------------- */

  // Section 1: Hero 2-Hour Forecast Card (two-hr-forecast)
  const renderSection2Hr = () => (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-xl transition-all ${
        isDay
          ? 'bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-700 text-white shadow-cyan-900/10'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl text-white'
      }`}
    >
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-md bg-white/20 border border-white/30 text-white backdrop-blur-sm">
              2-Hour Real-Time Forecast
            </span>
            <span className="text-xs text-white/90 font-medium bg-black/20 px-2 py-0.5 rounded">
              Area: <strong className="text-white">{data?.area || selectedArea}</strong>
            </span>
          </div>

          {isForecastValid && data?.forecast ? (
            <>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                {formatForecastString(data.forecast.text)}
              </h2>
              {data.forecast.validPeriod?.text && (
                <p className="text-sm font-medium text-white/90 flex items-center gap-1.5">
                  <span>Forecast Validity Period:</span>
                  <span className="text-white font-semibold underline decoration-white/40">
                    {data.forecast.validPeriod.text}
                  </span>
                </p>
              )}
            </>
          ) : (
            <div className="py-2 text-white/70 italic text-base">
              Forecast reading not available right now
            </div>
          )}

          {/* Quick Context Summary when in single tab mode */}
          {activeTab === '2hr' && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-white/90">
              {isTempValid && (
                <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  Temp: <strong>{data!.temperature!.value.toFixed(1)}°C</strong>
                </span>
              )}
              {isRainValid && (
                <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  Rain: <strong>{data!.rainfall!.value} mm</strong>
                </span>
              )}
              {isHumidityValid && (
                <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  Humidity: <strong>{Math.round(data!.humidity!.value)}%</strong>
                </span>
              )}
              {isPsiValid && (
                <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  PSI: <strong>{data!.psi!.value}</strong> ({getPsiCategory(data!.psi!.value).label})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col md:items-end justify-center gap-3">
          <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner flex items-center gap-5">
            {getForecastIcon(data?.forecast?.text, 'w-14 h-14 text-white')}
            {isForecastValid && data?.forecast?.timestamp && (
              <div className="text-right">
                <span className="inline-block text-xs font-medium text-white bg-black/25 px-2.5 py-1 rounded-full border border-white/20">
                  {formatUpdatedAgo(data.forecast.timestamp)}
                </span>
                <p className="text-[11px] text-white/80 mt-1">Source: NEA Live Station</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Section 2: Four Meteorological Station Readings
  const renderSectionStations = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Thermometer className={`w-4 h-4 ${isDay ? 'text-cyan-600' : 'text-cyan-400'}`} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${sectionHeaderColor}`}>
          Real-Time Weather Station Readings (Nearest Active Stations)
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Air Temperature */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  <Thermometer className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  Air Temperature
                </h3>
              </div>
              {isTempValid && data?.temperature?.timestamp && (
                <span className={`text-[10px] font-medium ${labelColor} ${subCardBg} px-2 py-0.5 rounded-full`}>
                  {formatUpdatedAgo(data.temperature.timestamp)}
                </span>
              )}
            </div>

            <div className="my-3">
              {isTempValid && data?.temperature ? (
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                    {data.temperature.value.toFixed(1)}
                  </span>
                  <span className="text-xl font-bold text-amber-500">°C</span>
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  Temperature reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-3 border-t ${isDay ? 'border-slate-100' : 'border-slate-800/70'} text-[11px]`}>
            {isTempValid && data?.temperature?.stationName ? (
              <div className={`${labelColor} flex items-center justify-between gap-1`}>
                <span className="truncate" title={data.temperature.stationName}>
                  {data.temperature.stationName}
                </span>
                <span className={`shrink-0 font-semibold ${isDay ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {data.temperature.distanceKm.toFixed(1)} km
                </span>
              </div>
            ) : (
              <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>Station reading unavailable</span>
            )}
          </div>
        </div>

        {/* Rainfall */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  <Droplets className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  Rainfall
                </h3>
              </div>
              {isRainValid && data?.rainfall?.timestamp && (
                <span className={`text-[10px] font-medium ${labelColor} ${subCardBg} px-2 py-0.5 rounded-full`}>
                  {formatUpdatedAgo(data.rainfall.timestamp)}
                </span>
              )}
            </div>

            <div className="my-3">
              {isRainValid && data?.rainfall ? (
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                    {data.rainfall.value.toFixed(1)}
                  </span>
                  <span className="text-lg font-bold text-blue-500">mm</span>
                  {data.rainfall.value === 0 && (
                    <span className={`ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      isDay
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                    }`}>
                      No Rain
                    </span>
                  )}
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  Rainfall reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-3 border-t ${isDay ? 'border-slate-100' : 'border-slate-800/70'} text-[11px]`}>
            {isRainValid && data?.rainfall?.stationName ? (
              <div className={`${labelColor} flex items-center justify-between gap-1`}>
                <span className="truncate" title={data.rainfall.stationName}>
                  {data.rainfall.stationName}
                </span>
                <span className={`shrink-0 font-semibold ${isDay ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {data.rainfall.distanceKm.toFixed(1)} km
                </span>
              </div>
            ) : (
              <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>Station reading unavailable</span>
            )}
          </div>
        </div>

        {/* Relative Humidity */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-teal-100 text-teal-600' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  Relative Humidity
                </h3>
              </div>
              {isHumidityValid && data?.humidity?.timestamp && (
                <span className={`text-[10px] font-medium ${labelColor} ${subCardBg} px-2 py-0.5 rounded-full`}>
                  {formatUpdatedAgo(data.humidity.timestamp)}
                </span>
              )}
            </div>

            <div className="my-3">
              {isHumidityValid && data?.humidity ? (
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                    {Math.round(data.humidity.value)}
                  </span>
                  <span className="text-xl font-bold text-teal-500">%</span>
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  Relative humidity reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-3 border-t ${isDay ? 'border-slate-100' : 'border-slate-800/70'} text-[11px]`}>
            {isHumidityValid && data?.humidity?.stationName ? (
              <div className={`${labelColor} flex items-center justify-between gap-1`}>
                <span className="truncate" title={data.humidity.stationName}>
                  {data.humidity.stationName}
                </span>
                <span className={`shrink-0 font-semibold ${isDay ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {data.humidity.distanceKm.toFixed(1)} km
                </span>
              </div>
            ) : (
              <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>Station reading unavailable</span>
            )}
          </div>
        </div>

        {/* Wind Speed */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                  <Wind className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  Wind Speed
                </h3>
              </div>
              {isWindValid && data?.windSpeed?.timestamp && (
                <span className={`text-[10px] font-medium ${labelColor} ${subCardBg} px-2 py-0.5 rounded-full`}>
                  {formatUpdatedAgo(data.windSpeed.timestamp)}
                </span>
              )}
            </div>

            <div className="my-3">
              {isWindValid && data?.windSpeed ? (
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                    {data.windSpeed.value.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-cyan-600">knots</span>
                  <span className={`text-xs ${labelColor}`}>
                    ({(data.windSpeed.value * 1.852).toFixed(1)} km/h)
                  </span>
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  Wind speed reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-3 border-t ${isDay ? 'border-slate-100' : 'border-slate-800/70'} text-[11px]`}>
            {isWindValid && data?.windSpeed?.stationName ? (
              <div className={`${labelColor} flex items-center justify-between gap-1`}>
                <span className="truncate" title={data.windSpeed.stationName}>
                  {data.windSpeed.stationName}
                </span>
                <span className={`shrink-0 font-semibold ${isDay ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {data.windSpeed.distanceKm.toFixed(1)} km
                </span>
              </div>
            ) : (
              <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>Station reading unavailable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Section 3: Air Quality & Environment (psi, pm25, uv)
  const renderSectionEnvironment = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Shield className={`w-4 h-4 ${isDay ? 'text-emerald-600' : 'text-emerald-400'}`} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${sectionHeaderColor}`}>
          Real-Time Environmental & Air Quality Indicators
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 24-Hour PSI (psi) */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  24-Hour PSI
                </h3>
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
                    <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                      {data.psi.value}
                    </span>
                    <span className={`text-xs ${labelColor} uppercase font-medium`}>
                      Region: <strong className={`${isDay ? 'text-slate-800' : 'text-slate-200'} capitalize`}>{data.psi.region}</strong> ({data.psi.distanceKm} km away)
                    </span>
                  </div>

                  {data.psi.regional && (
                    <div className={`mt-3 pt-3 border-t ${isDay ? 'border-slate-100' : 'border-slate-800/80'} grid grid-cols-5 gap-1 text-center`}>
                      {Object.entries(data.psi.regional).map(([rName, rVal]) => (
                        <div key={rName} className={`p-1 rounded ${subCardBg}`}>
                          <span className={`block text-[9px] uppercase ${labelColor}`}>{rName[0]}</span>
                          <span className={`text-xs font-bold ${isDay ? 'text-slate-800' : 'text-slate-200'}`}>{rVal}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  PSI reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-2 text-[10px] ${labelColor}`}>
            {isPsiValid && data?.psi?.timestamp ? formatUpdatedAgo(data.psi.timestamp) : 'Pollutant Standards Index'}
          </div>
        </div>

        {/* 1-Hour PM2.5 (pm25) */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  1-Hour PM2.5
                </h3>
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
                    <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                      {data.pm25.value}
                    </span>
                    <span className="text-sm text-emerald-600 font-semibold">µg/m³</span>
                    <span className={`text-xs ${labelColor} uppercase font-medium`}>
                      Region: <strong className={`${isDay ? 'text-slate-800' : 'text-slate-200'} capitalize`}>{data.pm25.region}</strong>
                    </span>
                  </div>

                  {data.pm25.regional && (
                    <div className={`mt-3 pt-3 border-t ${isDay ? 'border-slate-100' : 'border-slate-800/80'} grid grid-cols-5 gap-1 text-center`}>
                      {Object.entries(data.pm25.regional).map(([rName, rVal]) => (
                        <div key={rName} className={`p-1 rounded ${subCardBg}`}>
                          <span className={`block text-[9px] uppercase ${labelColor}`}>{rName[0]}</span>
                          <span className={`text-xs font-bold ${isDay ? 'text-slate-800' : 'text-slate-200'}`}>{rVal}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  PM2.5 reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-2 text-[10px] ${labelColor}`}>
            {isPm25Valid && data?.pm25?.timestamp ? formatUpdatedAgo(data.pm25.timestamp) : 'Fine Particulate Matter'}
          </div>
        </div>

        {/* UV Index (uv) */}
        <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDay ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                  <SunDim className="w-4 h-4" />
                </div>
                <h3 className={`text-xs font-semibold tracking-wide ${isDay ? 'text-slate-700' : 'text-slate-300'} uppercase`}>
                  UV Index (Solar)
                </h3>
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
                  <span className={`text-3xl sm:text-4xl font-extrabold ${textColor} tracking-tight`}>
                    {data.uv.value}
                  </span>
                  <span className={`text-xs ${labelColor}`}>
                    (Hourly Index reading)
                  </span>
                </div>
              ) : (
                <p className={`text-xs ${labelColor} italic py-2`}>
                  UV reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className={`pt-2 text-[10px] ${labelColor}`}>
            {isUvValid && data?.uv?.timestamp ? formatUpdatedAgo(data.uv.timestamp) : 'National Ultraviolet Index'}
          </div>
        </div>
      </div>
    </div>
  );

  // Section 4: 24-Hour Island-wide Forecast (twenty-four-hr-forecast)
  const renderSection24Hr = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Clock className={`w-4 h-4 ${isDay ? 'text-cyan-600' : 'text-cyan-400'}`} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${sectionHeaderColor}`}>
          24-Hour Island-Wide Forecast & Outlook
        </h2>
      </div>

      {isTwentyFourValid && data?.twentyFourHr ? (
        <div className={`${cardBg} rounded-2xl p-6 space-y-4 transition-colors`}>
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${isDay ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center gap-3">
              {getForecastIcon(data.twentyFourHr.general.forecast, 'w-10 h-10')}
              <div>
                <span className={`text-xs uppercase tracking-wider font-semibold ${isDay ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  Island-Wide Overview
                </span>
                <h3 className={`text-xl font-bold ${textColor}`}>
                  {formatForecastString(data.twentyFourHr.general.forecast)}
                </h3>
                {data.twentyFourHr.general.validPeriod && (
                  <p className={`text-xs ${labelColor} mt-0.5`}>
                    Window: {data.twentyFourHr.general.validPeriod}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
              <div className={`p-2.5 rounded-xl ${subCardBg}`}>
                <span className={`text-[10px] uppercase ${labelColor} block font-semibold`}>Temperature</span>
                <span className={`text-sm font-bold ${isDay ? 'text-amber-700' : 'text-amber-300'}`}>
                  {data.twentyFourHr.general.temperature.low ?? '-'}°C - {data.twentyFourHr.general.temperature.high ?? '-'}°C
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${subCardBg}`}>
                <span className={`text-[10px] uppercase ${labelColor} block font-semibold`}>Humidity</span>
                <span className={`text-sm font-bold ${isDay ? 'text-teal-700' : 'text-teal-300'}`}>
                  {data.twentyFourHr.general.relativeHumidity.low ?? '-'}% - {data.twentyFourHr.general.relativeHumidity.high ?? '-'}%
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${subCardBg}`}>
                <span className={`text-[10px] uppercase ${labelColor} block font-semibold`}>Wind</span>
                <span className={`text-sm font-bold ${isDay ? 'text-cyan-700' : 'text-cyan-300'}`}>
                  {data.twentyFourHr.general.wind.direction ?? ''} {data.twentyFourHr.general.wind.speed?.low ?? ''}-{data.twentyFourHr.general.wind.speed?.high ?? ''} km/h
                </span>
              </div>
            </div>
          </div>

          {/* Time Periods */}
          {data.twentyFourHr.periods && data.twentyFourHr.periods.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {data.twentyFourHr.periods.map((period, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${subCardBg} space-y-1.5`}>
                  <span className={`text-[11px] font-semibold block ${isDay ? 'text-cyan-700' : 'text-cyan-300'}`}>
                    {period.timePeriod?.text || `Period ${idx + 1}`}
                  </span>
                  <div className="text-xs space-y-0.5">
                    {Object.entries(period.regions || {}).map(([rName, rForecast]) => (
                      <div key={rName} className="flex justify-between text-[11px]">
                        <span className={`capitalize ${labelColor}`}>{rName}:</span>
                        <span className={`font-medium ${isDay ? 'text-slate-800' : 'text-slate-200'}`}>
                          {formatForecastString(rForecast)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`${cardBg} rounded-2xl p-5 ${labelColor} italic text-sm`}>
          24-Hour Forecast reading not available right now
        </div>
      )}
    </div>
  );

  // Section 5: 4-Day Outlook (four-day-outlook)
  const renderSection4Day = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className={`w-4 h-4 ${isDay ? 'text-cyan-600' : 'text-cyan-400'}`} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${sectionHeaderColor}`}>
          4-Day Weather Outlook
        </h2>
      </div>

      {isFourDayValid && data?.fourDayOutlook?.forecasts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.fourDayOutlook.forecasts.map((fItem, idx) => (
            <div
              key={idx}
              className={`${cardBg} rounded-2xl p-5 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-4`}
            >
              <div>
                <div className={`flex items-center justify-between pb-3 border-b ${isDay ? 'border-slate-200' : 'border-slate-800'}`}>
                  <h3 className={`font-bold text-base ${textColor}`}>{fItem.day}</h3>
                  {getForecastIcon(fItem.text, 'w-7 h-7')}
                </div>

                <div className="mt-3 space-y-1">
                  <p className={`text-sm font-semibold ${isDay ? 'text-cyan-700' : 'text-cyan-300'}`}>
                    {formatForecastString(fItem.text)}
                  </p>
                  {fItem.summary && (
                    <p className={`text-xs ${labelColor} line-clamp-2`}>{fItem.summary}</p>
                  )}
                </div>
              </div>

              <div className={`pt-3 border-t ${isDay ? 'border-slate-200' : 'border-slate-800/80'} space-y-2 text-xs`}>
                <div className="flex justify-between">
                  <span className={labelColor}>Temp Range:</span>
                  <span className={`font-bold ${isDay ? 'text-amber-700' : 'text-amber-300'}`}>
                    {fItem.temperature?.low ?? '-'}°C - {fItem.temperature?.high ?? '-'}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={labelColor}>Humidity:</span>
                  <span className={`font-medium ${isDay ? 'text-teal-700' : 'text-teal-300'}`}>
                    {fItem.relativeHumidity?.low ?? '-'}% - {fItem.relativeHumidity?.high ?? '-'}%
                  </span>
                </div>
                {fItem.wind && (
                  <div className="flex justify-between">
                    <span className={labelColor}>Wind:</span>
                    <span className={`font-medium ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>
                      {fItem.wind.direction ?? ''} {fItem.wind.speed?.low ?? ''}-{fItem.wind.speed?.high ?? ''} km/h
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${cardBg} rounded-2xl p-5 ${labelColor} italic text-sm`}>
          4-Day Outlook reading not available right now
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Area Controls Bar */}
      <div className={`${cardBg} rounded-2xl p-4 sm:p-6 transition-colors`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-[260px]">
            <label
              htmlFor="area-select"
              className={`block text-xs font-semibold uppercase tracking-wider ${labelColor} mb-2`}
            >
              Select Forecast Area (Singapore)
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isDay ? 'text-cyan-600' : 'text-cyan-400'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <select
                id="area-select"
                value={selectedArea}
                onChange={(e) => onSelectArea(e.target.value)}
                disabled={loading || !data?.validAreas?.length}
                className={`w-full pl-11 pr-10 py-3 font-medium rounded-xl border text-base transition-all appearance-none cursor-pointer disabled:opacity-50 ${
                  isDay
                    ? 'bg-slate-50 text-slate-900 border-slate-300 hover:border-cyan-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    : 'bg-slate-950/90 text-slate-100 border-slate-700/80 hover:border-cyan-500/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                }`}
              >
                {data?.validAreas && data.validAreas.length > 0 ? (
                  data.validAreas.map((areaName) => (
                    <option key={areaName} value={areaName} className={isDay ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>
                      {areaName}
                    </option>
                  ))
                ) : (
                  <option value={selectedArea} className={isDay ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>
                    {selectedArea}
                  </option>
                )}
              </select>
              <div className={`absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none ${labelColor}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-6">
            <div className={`flex items-center gap-2 text-xs ${labelColor} ${subCardBg} px-3 py-2 rounded-lg`}>
              <Clock className={`w-3.5 h-3.5 ${isDay ? 'text-cyan-600' : 'text-cyan-400'}`} />
              <span>
                Auto-refresh in <strong className={isDay ? 'text-slate-800' : 'text-slate-200'}>{secondsUntilNextRefresh}s</strong>
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh all real-time feeds"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 cursor-pointer ${
                isDay
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className={`mt-4 pt-3 border-t ${isDay ? 'border-slate-200' : 'border-slate-800/80'} flex flex-wrap items-center justify-between text-xs ${labelColor} gap-2`}>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                data?.keyConfigured
                  ? isDay
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : isDay
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Radio className="w-3 h-3" />
              {data?.keyConfigured ? 'API Key Active (Dedicated Quota)' : 'Public Live Stream (SWR Guard Active)'}
            </span>
          </div>

          <div className={`text-[11px] ${labelColor}`}>
            10 Real-Time Datasets: 2h/24h/4d Forecasts • Temp • Rain • Humidity • Wind • PSI • PM2.5 • UV
          </div>
        </div>
      </div>

      {/* Dataset Navigation Tabs Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-4 h-4 ${isDay ? 'text-cyan-600' : 'text-cyan-400'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${sectionHeaderColor}`}>
              Dataset View Selector
            </span>
          </div>
          <span className={`text-[11px] ${labelColor} hidden sm:inline`}>
            Select a tab to view specific datasets without scrolling
          </span>
        </div>

        {/* Scrollable / Responsive Tab Bar */}
        <div
          className={`p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border ${
            isDay ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? isDay
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : isDay
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? isDay
                          ? 'bg-white/25 text-white'
                          : 'bg-cyan-400/25 text-cyan-200'
                        : isDay
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Summary Glance Bar (Visible in single-dataset tabs) */}
      {activeTab !== 'all' && (
        <div
          className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
            isDay ? 'bg-slate-50/90 border-slate-200 text-slate-700' : 'bg-slate-900/50 border-slate-800/80 text-slate-300'
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
            Quick Glance:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('2hr')}
              className={`px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                activeTab === '2hr'
                  ? isDay
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                    : 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                  : subCardBg
              }`}
            >
              🌤️ {data?.forecast?.text ? formatForecastString(data.forecast.text) : 'Local 2h'}
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={`px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'stations'
                  ? isDay
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-amber-950/60 border-amber-700 text-amber-300'
                  : subCardBg
              }`}
            >
              🌡️ {isTempValid ? `${data!.temperature!.value.toFixed(1)}°C` : 'Station'}
            </button>
            <button
              onClick={() => setActiveTab('environment')}
              className={`px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'environment'
                  ? isDay
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : subCardBg
              }`}
            >
              🍃 {isPsiValid ? `PSI ${data!.psi!.value}` : 'PSI'} • ☀️ {isUvValid ? `UV ${data!.uv!.value}` : 'UV'}
            </button>
            <button
              onClick={() => setActiveTab('24hr')}
              className={`px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                activeTab === '24hr'
                  ? isDay
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-blue-950/60 border-blue-700 text-blue-300'
                  : subCardBg
              }`}
            >
              🗺️ 24-Hour Island
            </button>
            <button
              onClick={() => setActiveTab('4day')}
              className={`px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                activeTab === '4day'
                  ? isDay
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                    : 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
                  : subCardBg
              }`}
            >
              📅 4-Day Outlook
            </button>
          </div>
        </div>
      )}

      {/* Active Dataset Display */}
      <div className="space-y-8 transition-opacity duration-200">
        {activeTab === 'all' && (
          <div className="space-y-8">
            {renderSection2Hr()}
            {renderSectionStations()}
            {renderSectionEnvironment()}
            {renderSection24Hr()}
            {renderSection4Day()}
          </div>
        )}

        {activeTab === '2hr' && renderSection2Hr()}
        {activeTab === 'stations' && renderSectionStations()}
        {activeTab === 'environment' && renderSectionEnvironment()}
        {activeTab === '24hr' && renderSection24Hr()}
        {activeTab === '4day' && renderSection4Day()}
      </div>

      {/* Informational Notice */}
      <div className={`rounded-xl ${subCardBg} p-4 flex items-start gap-3 text-xs ${labelColor}`}>
        <HelpCircle className={`w-4 h-4 ${isDay ? 'text-cyan-600' : 'text-cyan-400'} shrink-0 mt-0.5`} />
        <div>
          <p>
            <strong>Live Multi-Feed Integration:</strong> Toggle between datasets anytime using the tab selector above. All 10 real-time meteorological feeds provided by data.gov.sg (2-hour, 24-hour, and 4-day forecasts, air temperature, rainfall, relative humidity, wind speed, PSI, PM2.5, and UV index) are kept continuously updated in the background.
          </p>
        </div>
      </div>
    </div>
  );
}
