/**
 * Serverless function: /api/health
 * Reports whether DATA_GOV_SG_API_KEY is configured and checks upstream HTTP status
 * of all ten data.gov.sg endpoints without printing any sensitive credentials.
 */

async function pingEndpoint(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const status = res.status;
      const reason = status === 429 ? 'Rate limited by data.gov.sg' : `Upstream returned HTTP ${status}`;
      return {
        answered: true,
        status,
        ok: false,
        reason,
      };
    }

    try {
      const json = await res.json();
      if (json.code !== 0) {
        return {
          answered: true,
          status: res.status,
          ok: false,
          reason: json.errorMsg || json.message || `Upstream code ${json.code}`,
        };
      }
      return {
        answered: true,
        status: res.status,
        ok: true,
      };
    } catch {
      return {
        answered: true,
        status: res.status,
        ok: true,
      };
    }
  } catch (err) {
    return {
      answered: false,
      status: 500,
      ok: false,
      reason: err?.message || 'Network connection failed',
    };
  }
}

export default async function handler(req, res) {
  const rawKey = process.env.DATA_GOV_SG_API_KEY;
  const apiKey = typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey.trim() : null;
  const keyConfigured = apiKey !== null;

  const headers = {};
  if (keyConfigured) {
    headers['x-api-key'] = apiKey;
  }

  const endpointUrls = {
    'two-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
    'twenty-four-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
    'four-day-outlook': 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
    'air-temperature': 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
    'rainfall': 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
    'psi': 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    'pm25': 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
    'uv': 'https://api-open.data.gov.sg/v2/real-time/api/uv',
    'relative-humidity': 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
    'wind-speed': 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
  };

  const results = await Promise.allSettled(
    Object.entries(endpointUrls).map(async ([key, url], idx) => {
      await new Promise((resolve) => setTimeout(resolve, idx * 60));
      const ping = await pingEndpoint(url, headers);
      return { key, ping };
    })
  );

  const endpointsStatus = {};
  let anyAnswered = false;
  let allOk = true;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { key, ping } = r.value;
      endpointsStatus[key] = ping;
      if (ping.answered) anyAnswered = true;
      if (!ping.ok) allOk = false;
    }
  }

  const overallStatus = anyAnswered ? (allOk ? 200 : 207) : 502;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(overallStatus).json({
    keyConfigured,
    dataGovSgAnswered: anyAnswered,
    allEndpointsHealthy: allOk,
    endpoints: endpointsStatus,
  });
}
