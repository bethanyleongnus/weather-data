/**
 * Types for Singapore Real-Time Weather Application
 * Supports all 10 real-time data.gov.sg endpoints
 */

export interface MetricReading {
  value: number;
  timestamp: string;
  stationName: string;
  distanceKm: number;
}

export interface ValidPeriod {
  start: string;
  end: string;
  text: string;
}

export interface ForecastData {
  text: string;
  validPeriod: ValidPeriod | null;
  timestamp: string;
}

export interface RegionalAirQualityReading {
  value: number | null;
  region: string;
  distanceKm: number;
  timestamp: string;
  regional: Record<string, number>;
}

export interface UvReading {
  value: number;
  hour: string;
  timestamp: string;
}

export interface TwentyFourHrGeneral {
  forecast: string;
  temperature: {
    low?: number;
    high?: number;
  };
  relativeHumidity: {
    low?: number;
    high?: number;
  };
  wind: {
    direction?: string;
    speed?: {
      low?: number;
      high?: number;
    };
  };
  validPeriod?: string;
}

export interface TwentyFourHrData {
  date: string;
  timestamp: string;
  general: TwentyFourHrGeneral;
  currentPeriodForecast?: string | null;
  periods?: Array<{
    timePeriod: {
      start: string;
      end: string;
      text: string;
    };
    regions: Record<string, string>;
  }>;
}

export interface FourDayForecastItem {
  day: string;
  timestamp: string;
  text: string;
  summary?: string;
  temperature: {
    low?: number;
    high?: number;
  };
  relativeHumidity: {
    low?: number;
    high?: number;
  };
  wind?: {
    speed?: {
      low?: number;
      high?: number;
    };
    direction?: string;
  };
}

export interface FourDayOutlookData {
  date: string;
  timestamp: string;
  forecasts: FourDayForecastItem[];
}

export interface WeatherApiResponse {
  keyConfigured: boolean;
  area: string;
  validAreas: string[];
  forecast: ForecastData | null;
  temperature: MetricReading | null;
  rainfall: MetricReading | null;
  humidity: MetricReading | null;
  windSpeed: MetricReading | null;
  psi: RegionalAirQualityReading | null;
  pm25: RegionalAirQualityReading | null;
  uv: UvReading | null;
  twentyFourHr: TwentyFourHrData | null;
  fourDayOutlook: FourDayOutlookData | null;
  errors?: Record<string, string>;
}

export interface EndpointHealth {
  answered: boolean;
  status: number;
  ok: boolean;
  reason?: string;
}

export interface HealthApiResponse {
  keyConfigured: boolean;
  dataGovSgAnswered: boolean;
  allEndpointsHealthy: boolean;
  endpoints: Record<string, EndpointHealth>;
}
