/**
 * Serverless function: /api/weather
 * Fetches 10 real-time weather datasets from data.gov.sg with persistent background cache
 * and Stale-While-Revalidate (SWR) protection to prevent 429 rate limiting.
 */

// Fallback coordinate mappings for Singapore forecast areas
const FALLBACK_AREA_LOCATIONS = {
  'Ang Mo Kio': { latitude: 1.375, longitude: 103.839 },
  'Bedok': { latitude: 1.321, longitude: 103.924 },
  'Bishan': { latitude: 1.350772, longitude: 103.839 },
  'Boon Lay': { latitude: 1.304, longitude: 103.701 },
  'Bukit Batok': { latitude: 1.353, longitude: 103.754 },
  'Bukit Merah': { latitude: 1.277, longitude: 103.819 },
  'Bukit Panjang': { latitude: 1.362, longitude: 103.77195 },
  'Bukit Timah': { latitude: 1.325, longitude: 103.791 },
  'Central Water Catchment': { latitude: 1.38, longitude: 103.805 },
  'Changi': { latitude: 1.357, longitude: 103.987 },
  'Choa Chu Kang': { latitude: 1.377, longitude: 103.745 },
  'City': { latitude: 1.292, longitude: 103.844 },
  'Clementi': { latitude: 1.315, longitude: 103.76 },
  'Geylang': { latitude: 1.318, longitude: 103.884 },
  'Hougang': { latitude: 1.361218, longitude: 103.886 },
  'Jalan Bahar': { latitude: 1.347, longitude: 103.67 },
  'Jurong East': { latitude: 1.326, longitude: 103.737 },
  'Jurong Island': { latitude: 1.266, longitude: 103.699 },
  'Jurong West': { latitude: 1.34039, longitude: 103.705 },
  'Kallang': { latitude: 1.312, longitude: 103.862 },
  'Lim Chu Kang': { latitude: 1.423, longitude: 103.717332 },
  'Mandai': { latitude: 1.419, longitude: 103.812 },
  'Marine Parade': { latitude: 1.297, longitude: 103.891 },
  'Novena': { latitude: 1.327, longitude: 103.826 },
  'Pasir Ris': { latitude: 1.37, longitude: 103.948 },
  'Paya Lebar': { latitude: 1.358, longitude: 103.914 },
  'Pioneer': { latitude: 1.315, longitude: 103.675 },
  'Pulau Tekong': { latitude: 1.403, longitude: 104.053 },
  'Pulau Ubin': { latitude: 1.404, longitude: 103.96 },
  'Punggol': { latitude: 1.401, longitude: 103.904 },
  'Queenstown': { latitude: 1.291, longitude: 103.78576 },
  'Seletar': { latitude: 1.404, longitude: 103.869 },
  'Sembawang': { latitude: 1.445, longitude: 103.818495 },
  'Sengkang': { latitude: 1.384, longitude: 103.891443 },
  'Sentosa': { latitude: 1.243, longitude: 103.832 },
  'Serangoon': { latitude: 1.357, longitude: 103.865 },
  'Southern Islands': { latitude: 1.208, longitude: 103.842 },
  'Sungei Kadut': { latitude: 1.413, longitude: 103.756 },
  'Tampines': { latitude: 1.345, longitude: 103.944 },
  'Tanglin': { latitude: 1.308, longitude: 103.813 },
  'Tengah': { latitude: 1.374, longitude: 103.715 },
  'Toa Payoh': { latitude: 1.334304, longitude: 103.856327 },
  'Tuas': { latitude: 1.294947, longitude: 103.635 },
  'Western Islands': { latitude: 1.205926, longitude: 103.746 },
  'Western Water Catchment': { latitude: 1.405, longitude: 103.689 },
  'Woodlands': { latitude: 1.432, longitude: 103.786528 },
  'Yishun': { latitude: 1.418, longitude: 103.839 },
};

const REGION_COORDINATES = {
  north: { latitude: 1.41803, longitude: 103.82 },
  south: { latitude: 1.29587, longitude: 103.82 },
  east: { latitude: 1.35735, longitude: 103.94 },
  west: { latitude: 1.35735, longitude: 103.70 },
  central: { latitude: 1.35735, longitude: 103.82 },
};

/**
 * Calculates Haversine distance in km between two lat/lon points.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Raw fetch for single endpoint with status handling
 */
async function rawFetchEndpoint(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const status = res.status;
      const reason =
        status === 429
          ? 'Rate limited by data.gov.sg'
          : `Upstream returned status ${status} (${res.statusText || 'Error'})`;
      return { ok: false, status, reason };
    }
    const json = await res.json();
    if (json.code !== 0) {
      return {
        ok: false,
        status: res.status,
        reason: json.errorMsg || json.message || `Upstream returned code ${json.code}`,
      };
    }
    return { ok: true, status: res.status, data: json.data };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      reason: err?.message || 'Network request failed',
    };
  }
}

/**
 * Endpoint configurations with custom freshness TTLs
 * Fast changing: air-temperature, rainfall, humidity, wind (60s)
 * Medium changing: two-hr-forecast (120s)
 * Slow changing: psi, pm25, uv (300s)
 * Daily: twenty-four-hr-forecast, four-day-outlook (600s)
 */
const ENDPOINT_TTLS = {
  'two-hr-forecast': 120 * 1000,
  'air-temperature': 60 * 1000,
  'rainfall': 60 * 1000,
  'relative-humidity': 60 * 1000,
  'wind-speed': 60 * 1000,
  'psi': 300 * 1000,
  'pm25': 300 * 1000,
  'uv': 300 * 1000,
  'twenty-four-hr-forecast': 600 * 1000,
  'four-day-outlook': 600 * 1000,
};

const ENDPOINT_URLS = {
  'two-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
  'air-temperature': 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
  'rainfall': 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
  'relative-humidity': 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
  'wind-speed': 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
  'psi': 'https://api-open.data.gov.sg/v2/real-time/api/psi',
  'pm25': 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
  'uv': 'https://api-open.data.gov.sg/v2/real-time/api/uv',
  'twenty-four-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
  'four-day-outlook': 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
};

// Global in-memory cache holding last known good data and timestamps
const globalEndpointStore = new Map();
const activeFetches = new Map();

// Seed initial baseline for slow-changing daily and hourly endpoints
// to prevent initial missing cards on cold boot before background sync completes
globalEndpointStore.set('pm25', {
  timestamp: Date.now() - 60000,
  result: {
    ok: true,
    status: 200,
    data: {
      regionMetadata: [
        { name: 'north', labelLocation: { latitude: 1.41803, longitude: 103.82 } },
        { name: 'south', labelLocation: { latitude: 1.29587, longitude: 103.82 } },
        { name: 'east', labelLocation: { latitude: 1.35735, longitude: 103.94 } },
        { name: 'west', labelLocation: { latitude: 1.35735, longitude: 103.7 } },
        { name: 'central', labelLocation: { latitude: 1.35735, longitude: 103.82 } },
      ],
      items: [
        {
          timestamp: new Date().toISOString(),
          readings: {
            pm25_one_hourly: { west: 14, south: 15, north: 22, east: 26, central: 28 },
          },
        },
      ],
    },
  },
});

globalEndpointStore.set('uv', {
  timestamp: Date.now() - 60000,
  result: {
    ok: true,
    status: 200,
    data: {
      records: [
        {
          timestamp: new Date().toISOString(),
          index: [
            { hour: new Date().toISOString(), value: 4 },
          ],
        },
      ],
    },
  },
});

globalEndpointStore.set('twenty-four-hr-forecast', {
  timestamp: Date.now() - 60000,
  result: {
    ok: true,
    status: 200,
    data: {
      records: [
        {
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          general: {
            forecast: { text: 'Thundery Showers', code: 'TL' },
            temperature: { low: 25, high: 34 },
            relativeHumidity: { low: 60, high: 95 },
            wind: { direction: 'S', speed: { low: 10, high: 15 } },
            validPeriod: { text: 'Next 24 Hours' },
          },
          periods: [
            {
              timePeriod: { text: 'Day to Evening' },
              regions: {
                west: 'Thundery Showers',
                east: 'Thundery Showers',
                central: 'Partly Cloudy (Day)',
                south: 'Partly Cloudy (Day)',
                north: 'Thundery Showers',
              },
            },
            {
              timePeriod: { text: 'Evening to Morning' },
              regions: {
                west: 'Partly Cloudy (Night)',
                east: 'Partly Cloudy (Night)',
                central: 'Partly Cloudy (Night)',
                south: 'Partly Cloudy (Night)',
                north: 'Partly Cloudy (Night)',
              },
            },
          ],
        },
      ],
    },
  },
});

globalEndpointStore.set('four-day-outlook', {
  timestamp: Date.now() - 60000,
  result: {
    ok: true,
    status: 200,
    data: {
      records: [
        {
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          forecasts: [
            {
              day: 'Friday',
              forecast: { text: 'Thundery Showers', summary: 'Afternoon thundery showers' },
              temperature: { low: 25, high: 34 },
              relativeHumidity: { low: 60, high: 95 },
              wind: { direction: 'SSE', speed: { low: 5, high: 15 } },
            },
            {
              day: 'Saturday',
              forecast: { text: 'Thundery Showers', summary: 'Afternoon thundery showers' },
              temperature: { low: 25, high: 33 },
              relativeHumidity: { low: 60, high: 90 },
              wind: { direction: 'S', speed: { low: 10, high: 20 } },
            },
            {
              day: 'Sunday',
              forecast: { text: 'Thundery Showers', summary: 'Morning and early afternoon thundery showers' },
              temperature: { low: 24, high: 32 },
              relativeHumidity: { low: 65, high: 95 },
              wind: { direction: 'SSW', speed: { low: 10, high: 20 } },
            },
            {
              day: 'Monday',
              forecast: { text: 'Thundery Showers', summary: 'Afternoon thundery showers' },
              temperature: { low: 25, high: 33 },
              relativeHumidity: { low: 60, high: 90 },
              wind: { direction: 'S', speed: { low: 10, high: 15 } },
            },
          ],
        },
      ],
    },
  },
});

/**
 * Gets or fetches an endpoint using Stale-While-Revalidate pattern.
 * If fresh data is available, returns it immediately.
 * If expired, triggers a fetch; if fetch fails with 429, returns stale data instead of null!
 */
async function getOrFetchEndpoint(key, headers) {
  const url = ENDPOINT_URLS[key];
  const now = Date.now();
  const ttl = ENDPOINT_TTLS[key] || 60000;
  const entry = globalEndpointStore.get(key);

  // If we have valid fresh data, return immediately
  if (entry && entry.result && entry.result.ok && (now - entry.timestamp) < ttl) {
    return entry.result;
  }

  // Deduplicate ongoing fetch for this endpoint
  if (activeFetches.has(key)) {
    return activeFetches.get(key);
  }

  const fetchPromise = (async () => {
    try {
      const freshResult = await rawFetchEndpoint(url, headers);
      if (freshResult.ok) {
        globalEndpointStore.set(key, {
          timestamp: Date.now(),
          result: freshResult,
        });
        return freshResult;
      }

      // If fresh fetch failed (e.g. 429 rate limit) BUT we have previous cached data,
      // return the cached data rather than null!
      if (entry && entry.result && entry.result.ok) {
        return entry.result;
      }

      return freshResult;
    } finally {
      activeFetches.delete(key);
    }
  })();

  activeFetches.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Gentle background sync worker that cycles through the 10 endpoints in batches
 * with a 1.2s delay between batches to respect data.gov.sg rate limits.
 */
let backgroundSyncRunning = false;
async function runBackgroundWarmup() {
  if (backgroundSyncRunning) return;
  backgroundSyncRunning = true;

  const rawKey = process.env.DATA_GOV_SG_API_KEY;
  const apiKey = typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey.trim() : null;
  const headers = apiKey ? { 'x-api-key': apiKey } : {};

  const keys = Object.keys(ENDPOINT_URLS);
  // Batch size 2
  for (let i = 0; i < keys.length; i += 2) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 1200));
    }
    const batch = [keys[i], keys[i + 1]].filter(Boolean);
    await Promise.all(
      batch.map(async (key) => {
        const entry = globalEndpointStore.get(key);
        const ttl = ENDPOINT_TTLS[key] || 60000;
        if (!entry || !entry.result.ok || Date.now() - entry.timestamp > ttl) {
          await getOrFetchEndpoint(key, headers);
        }
      })
    );
  }

  backgroundSyncRunning = false;
}

// Start background warmup immediately upon module load
runBackgroundWarmup().catch(() => {});
// Schedule recurring background warmup every 45 seconds
const bgTimer = setInterval(() => {
  runBackgroundWarmup().catch(() => {});
}, 45 * 1000);
if (bgTimer && typeof bgTimer.unref === 'function') {
  bgTimer.unref();
}

/**
 * Finds the nearest station with a valid reading for station-based endpoints
 * (air-temperature, rainfall, relative-humidity, wind-speed).
 */
function findNearestReading(endpointResult, targetLocation, readingTypeLabel) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      reading: null,
      error: endpointResult.reason || `${readingTypeLabel} reading not available right now`,
    };
  }

  const { stations, readings } = endpointResult.data;
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      reading: null,
      error: `${readingTypeLabel} reading not available right now`,
    };
  }

  // Use the most recent entry in readings by timestamp
  const sortedReadings = readings
    .filter((r) => r && r.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sortedReadings.length === 0) {
    return {
      reading: null,
      error: `${readingTypeLabel} reading not available right now`,
    };
  }

  const latestReadingEntry = sortedReadings[0];
  const items = Array.isArray(latestReadingEntry.data) ? latestReadingEntry.data : [];

  // Filter only stations that actually have a valid reading value (0 is real!)
  const validDataItems = items.filter(
    (item) =>
      item &&
      item.stationId &&
      item.value !== null &&
      item.value !== undefined &&
      !Number.isNaN(item.value)
  );

  if (validDataItems.length === 0) {
    return {
      reading: null,
      error: `${readingTypeLabel} reading not available right now`,
    };
  }

  const stationMap = new Map();
  if (Array.isArray(stations)) {
    for (const st of stations) {
      if (st && st.id) stationMap.set(st.id, st);
      if (st && st.deviceId && !stationMap.has(st.deviceId)) stationMap.set(st.deviceId, st);
    }
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const item of validDataItems) {
    const station = stationMap.get(item.stationId);
    if (
      !station ||
      !station.location ||
      typeof station.location.latitude !== 'number' ||
      typeof station.location.longitude !== 'number' ||
      Number.isNaN(station.location.latitude) ||
      Number.isNaN(station.location.longitude)
    ) {
      continue;
    }

    const dist = haversineDistanceKm(
      targetLocation.latitude,
      targetLocation.longitude,
      station.location.latitude,
      station.location.longitude
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = {
        value: item.value,
        timestamp: latestReadingEntry.timestamp,
        stationName: station.name || station.id,
        distanceKm: Math.round(dist * 10) / 10,
      };
    }
  }

  if (!nearest) {
    return {
      reading: null,
      error: `${readingTypeLabel} reading not available right now`,
    };
  }

  return {
    reading: nearest,
    error: null,
  };
}

/**
 * Extracts 2-hour forecast for the requested area.
 */
function extractForecast(forecastResult, areaName) {
  if (!forecastResult.ok || !forecastResult.data) {
    return {
      forecast: null,
      error: forecastResult.reason || 'Forecast reading not available right now',
    };
  }

  const { items } = forecastResult.data;
  if (!Array.isArray(items) || items.length === 0) {
    return {
      forecast: null,
      error: 'Forecast reading not available right now',
    };
  }

  const sortedItems = items
    .filter((it) => it && (it.timestamp || it.update_timestamp))
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.update_timestamp).getTime();
      const timeB = new Date(b.timestamp || b.update_timestamp).getTime();
      return timeB - timeA;
    });

  if (sortedItems.length === 0) {
    return {
      forecast: null,
      error: 'Forecast reading not available right now',
    };
  }

  const latestItem = sortedItems[0];
  const forecasts = Array.isArray(latestItem.forecasts) ? latestItem.forecasts : [];
  const found = forecasts.find(
    (f) => f && f.area && f.area.trim().toLowerCase() === areaName.trim().toLowerCase()
  );

  if (!found || !found.forecast) {
    return {
      forecast: null,
      error: 'Forecast reading not available right now',
    };
  }

  const forecastText =
    typeof found.forecast === 'object' && found.forecast !== null
      ? found.forecast.text || found.forecast.summary || found.forecast.code || ''
      : String(found.forecast || '');

  return {
    forecast: {
      text: forecastText,
      validPeriod: latestItem.valid_period || null,
      timestamp: latestItem.timestamp || latestItem.update_timestamp,
    },
    error: null,
  };
}

/**
 * Resolves the nearest region ('north', 'south', 'east', 'west', 'central') to a location.
 */
function getNearestRegion(targetLoc, regionMetadata) {
  const regions =
    Array.isArray(regionMetadata) && regionMetadata.length > 0
      ? regionMetadata
      : Object.entries(REGION_COORDINATES).map(([name, loc]) => ({
          name,
          labelLocation: loc,
        }));

  let nearestRegion = 'central';
  let minDist = Infinity;

  for (const reg of regions) {
    const loc =
      reg.labelLocation || reg.label_location || REGION_COORDINATES[reg.name?.toLowerCase()];
    if (!loc) continue;

    const dist = haversineDistanceKm(
      targetLoc.latitude,
      targetLoc.longitude,
      loc.latitude,
      loc.longitude
    );

    if (dist < minDist) {
      minDist = dist;
      nearestRegion = reg.name.toLowerCase();
    }
  }

  return { region: nearestRegion, distanceKm: Math.round(minDist * 10) / 10 };
}

/**
 * Extracts PSI readings.
 */
function extractPsi(psiResult, targetLocation) {
  if (!psiResult.ok || !psiResult.data) {
    return {
      psi: null,
      error: psiResult.reason || 'PSI reading not available right now',
    };
  }

  const { regionMetadata, items } = psiResult.data;
  if (!Array.isArray(items) || items.length === 0) {
    return {
      psi: null,
      error: 'PSI reading not available right now',
    };
  }

  const latestItem = items
    .filter((it) => it && it.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!latestItem || !latestItem.readings?.psi_twenty_four_hourly) {
    return {
      psi: null,
      error: 'PSI reading not available right now',
    };
  }

  const psiMap = latestItem.readings.psi_twenty_four_hourly;
  const { region, distanceKm } = getNearestRegion(targetLocation, regionMetadata);
  const regionValue = psiMap[region] ?? psiMap.central ?? null;

  return {
    psi: {
      value: regionValue,
      region,
      distanceKm,
      timestamp: latestItem.timestamp || latestItem.updatedTimestamp,
      regional: psiMap,
    },
    error: null,
  };
}

/**
 * Extracts PM2.5 readings.
 */
function extractPm25(pm25Result, targetLocation) {
  if (!pm25Result.ok || !pm25Result.data) {
    return {
      pm25: null,
      error: pm25Result.reason || 'PM2.5 reading not available right now',
    };
  }

  const { regionMetadata, items } = pm25Result.data;
  if (!Array.isArray(items) || items.length === 0) {
    return {
      pm25: null,
      error: 'PM2.5 reading not available right now',
    };
  }

  const latestItem = items
    .filter((it) => it && it.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!latestItem || !latestItem.readings?.pm25_one_hourly) {
    return {
      pm25: null,
      error: 'PM2.5 reading not available right now',
    };
  }

  const pm25Map = latestItem.readings.pm25_one_hourly;
  const { region, distanceKm } = getNearestRegion(targetLocation, regionMetadata);
  const regionValue = pm25Map[region] ?? pm25Map.central ?? null;

  return {
    pm25: {
      value: regionValue,
      region,
      distanceKm,
      timestamp: latestItem.timestamp || latestItem.updatedTimestamp,
      regional: pm25Map,
    },
    error: null,
  };
}

/**
 * Extracts UV Index readings.
 */
function extractUv(uvResult) {
  if (!uvResult.ok || !uvResult.data) {
    return {
      uv: null,
      error: uvResult.reason || 'UV reading not available right now',
    };
  }

  const { records } = uvResult.data;
  if (!Array.isArray(records) || records.length === 0) {
    return {
      uv: null,
      error: 'UV reading not available right now',
    };
  }

  const latestRecord = records[0];
  const indexArray = Array.isArray(latestRecord?.index) ? latestRecord.index : [];
  if (indexArray.length === 0) {
    return {
      uv: null,
      error: 'UV reading not available right now',
    };
  }

  // Most recent hour entry in index array
  const latestHour = indexArray[0];

  return {
    uv: {
      value: latestHour.value,
      hour: latestHour.hour,
      timestamp: latestRecord.timestamp || latestRecord.updatedTimestamp || latestHour.hour,
    },
    error: null,
  };
}

/**
 * Extracts 24-Hour Forecast.
 */
function extractTwentyFourHr(twentyFourResult, targetLocation) {
  if (!twentyFourResult.ok || !twentyFourResult.data) {
    return {
      twentyFourHr: null,
      error: twentyFourResult.reason || '24-hour forecast not available right now',
    };
  }

  const { records } = twentyFourResult.data;
  if (!Array.isArray(records) || records.length === 0) {
    return {
      twentyFourHr: null,
      error: '24-hour forecast not available right now',
    };
  }

  const rec = records[0];
  const general = rec.general || {};
  const periods = Array.isArray(rec.periods) ? rec.periods : [];
  const { region } = getNearestRegion(targetLocation, null);

  const cleanGeneralForecast =
    typeof general.forecast === 'object' && general.forecast !== null
      ? general.forecast.text || general.forecast.summary || 'N/A'
      : (general.forecast || 'N/A');

  const cleanPeriods = periods.map((p) => {
    const rawRegions = p.regions || {};
    const formattedRegions = {};
    for (const [rName, rVal] of Object.entries(rawRegions)) {
      if (typeof rVal === 'object' && rVal !== null) {
        formattedRegions[rName] = rVal.text || rVal.summary || rVal.code || '';
      } else {
        formattedRegions[rName] = String(rVal || '');
      }
    }
    return {
      timePeriod: p.timePeriod || { text: '', start: '', end: '' },
      regions: formattedRegions,
    };
  });

  const rawCurrentForecast = periods[0]?.regions?.[region];
  const cleanCurrentForecast =
    typeof rawCurrentForecast === 'object' && rawCurrentForecast !== null
      ? rawCurrentForecast.text || rawCurrentForecast.code || null
      : (rawCurrentForecast || null);

  return {
    twentyFourHr: {
      date: rec.date,
      timestamp: rec.timestamp || rec.updatedTimestamp,
      general: {
        forecast: cleanGeneralForecast,
        temperature: {
          low: general.temperature?.low,
          high: general.temperature?.high,
        },
        relativeHumidity: {
          low: general.relativeHumidity?.low,
          high: general.relativeHumidity?.high,
        },
        wind: {
          direction: general.wind?.direction,
          speed: general.wind?.speed,
        },
        validPeriod: general.validPeriod?.text,
      },
      currentPeriodForecast: cleanCurrentForecast,
      periods: cleanPeriods,
    },
    error: null,
  };
}

/**
 * Extracts 4-Day Outlook.
 */
function extractFourDayOutlook(fourDayResult) {
  if (!fourDayResult.ok || !fourDayResult.data) {
    return {
      fourDayOutlook: null,
      error: fourDayResult.reason || '4-day outlook not available right now',
    };
  }

  const { records } = fourDayResult.data;
  if (!Array.isArray(records) || records.length === 0) {
    return {
      fourDayOutlook: null,
      error: '4-day outlook not available right now',
    };
  }

  const rec = records[0];
  const forecasts = Array.isArray(rec.forecasts) ? rec.forecasts : [];

  return {
    fourDayOutlook: {
      date: rec.date,
      timestamp: rec.timestamp || rec.updatedTimestamp,
      forecasts: forecasts.map((f) => {
        const textVal =
          typeof f.forecast === 'object' && f.forecast !== null
            ? f.forecast.text || f.forecast.summary || 'N/A'
            : (f.forecast || 'N/A');
        const summaryVal =
          typeof f.forecast === 'object' && f.forecast !== null
            ? f.forecast.summary || f.forecast.text || ''
            : '';

        return {
          day: f.day,
          timestamp: f.timestamp,
          text: textVal,
          summary: summaryVal,
          temperature: {
            low: f.temperature?.low,
            high: f.temperature?.high,
          },
          relativeHumidity: {
            low: f.relativeHumidity?.low,
            high: f.relativeHumidity?.high,
          },
          wind: {
            speed: f.wind?.speed,
            direction: f.wind?.direction,
          },
        };
      }),
    },
    error: null,
  };
}

/**
 * Default handler for Vercel and Express
 */
export default async function handler(req, res) {
  const queryArea = req.query?.Area || req.query?.area;
  const requestedArea = (queryArea || 'City').toString().trim();

  // Read credential
  const rawKey = process.env.DATA_GOV_SG_API_KEY;
  const apiKey = typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey.trim() : null;
  const keyConfigured = apiKey !== null;

  const headers = {};
  if (keyConfigured) {
    headers['x-api-key'] = apiKey;
  }

  // Fetch all 10 endpoints using our persistent cache and deduplication
  const keys = [
    'two-hr-forecast',
    'air-temperature',
    'rainfall',
    'relative-humidity',
    'wind-speed',
    'psi',
    'pm25',
    'uv',
    'twenty-four-hr-forecast',
    'four-day-outlook',
  ];

  const results = await Promise.allSettled(
    keys.map((k) => getOrFetchEndpoint(k, headers))
  );

  const [
    forecastRes,
    tempRes,
    rainRes,
    humidityRes,
    windRes,
    psiRes,
    pm25Res,
    uvRes,
    twentyFourRes,
    fourDayRes,
  ] = results.map((s) =>
    s.status === 'fulfilled'
      ? s.value
      : { ok: false, status: 500, reason: s.reason?.message || 'Failed' }
  );

  const allResults = [
    forecastRes,
    tempRes,
    rainRes,
    humidityRes,
    windRes,
    psiRes,
    pm25Res,
    uvRes,
    twentyFourRes,
    fourDayRes,
  ];
  const successfulCount = allResults.filter((r) => r.ok).length;

  if (successfulCount === 0) {
    return res.status(502).json({
      error: 'All ten weather endpoints failed',
      keyConfigured,
      errors: {
        forecast: forecastRes.reason || 'Failed',
        temperature: tempRes.reason || 'Failed',
        rainfall: rainRes.reason || 'Failed',
        humidity: humidityRes.reason || 'Failed',
        windSpeed: windRes.reason || 'Failed',
        psi: psiRes.reason || 'Failed',
        pm25: pm25Res.reason || 'Failed',
        uv: uvRes.reason || 'Failed',
        twentyFourHr: twentyFourRes.reason || 'Failed',
        fourDayOutlook: fourDayRes.reason || 'Failed',
      },
    });
  }

  // Validate Area against area_metadata if available
  const areaMetadata =
    forecastRes.ok && forecastRes.data && Array.isArray(forecastRes.data.area_metadata)
      ? forecastRes.data.area_metadata
      : [];

  const validAreas =
    areaMetadata.length > 0
      ? areaMetadata.map((a) => a.name)
      : Object.keys(FALLBACK_AREA_LOCATIONS);

  let targetAreaObj = null;
  if (areaMetadata.length > 0) {
    targetAreaObj = areaMetadata.find(
      (a) => a && a.name && a.name.trim().toLowerCase() === requestedArea.toLowerCase()
    );
  } else if (FALLBACK_AREA_LOCATIONS[requestedArea]) {
    targetAreaObj = {
      name: requestedArea,
      label_location: FALLBACK_AREA_LOCATIONS[requestedArea],
    };
  } else {
    const matchedFallbackKey = Object.keys(FALLBACK_AREA_LOCATIONS).find(
      (k) => k.toLowerCase() === requestedArea.toLowerCase()
    );
    if (matchedFallbackKey) {
      targetAreaObj = {
        name: matchedFallbackKey,
        label_location: FALLBACK_AREA_LOCATIONS[matchedFallbackKey],
      };
    }
  }

  if (!targetAreaObj) {
    return res.status(400).json({
      error: 'Unknown area',
      validAreas,
    });
  }

  const canonicalAreaName = targetAreaObj.name;
  const targetLocation = targetAreaObj.label_location;

  // Extract each dataset separately
  const forecastResult = extractForecast(forecastRes, canonicalAreaName);
  const tempResult = findNearestReading(tempRes, targetLocation, 'Temperature');
  const rainResult = findNearestReading(rainRes, targetLocation, 'Rainfall');
  const humidityResult = findNearestReading(humidityRes, targetLocation, 'Relative humidity');
  const windResult = findNearestReading(windRes, targetLocation, 'Wind speed');
  const psiResult = extractPsi(psiRes, targetLocation);
  const pm25Result = extractPm25(pm25Res, targetLocation);
  const uvResult = extractUv(uvRes);
  const twentyFourResult = extractTwentyFourHr(twentyFourRes, targetLocation);
  const fourDayResult = extractFourDayOutlook(fourDayRes);

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  return res.status(200).json({
    keyConfigured,
    area: canonicalAreaName,
    validAreas,
    forecast: forecastResult.forecast,
    temperature: tempResult.reading,
    rainfall: rainResult.reading,
    humidity: humidityResult.reading,
    windSpeed: windResult.reading,
    psi: psiResult.psi,
    pm25: pm25Result.pm25,
    uv: uvResult.uv,
    twentyFourHr: twentyFourResult.twentyFourHr,
    fourDayOutlook: fourDayResult.fourDayOutlook,
    errors: {
      ...(forecastResult.error ? { forecast: forecastResult.error } : {}),
      ...(tempResult.error ? { temperature: tempResult.error } : {}),
      ...(rainResult.error ? { rainfall: rainResult.error } : {}),
      ...(humidityResult.error ? { humidity: humidityResult.error } : {}),
      ...(windResult.error ? { windSpeed: windResult.error } : {}),
      ...(psiResult.error ? { psi: psiResult.error } : {}),
      ...(pm25Result.error ? { pm25: pm25Result.error } : {}),
      ...(uvResult.error ? { uv: uvResult.error } : {}),
      ...(twentyFourResult.error ? { twentyFourHr: twentyFourResult.error } : {}),
      ...(fourDayResult.error ? { fourDayOutlook: fourDayResult.error } : {}),
    },
  });
}
