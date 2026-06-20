/**
 * Enhanced NASA POWER API Client
 * - Retry logic: 3 retries with exponential backoff
 * - Timeout handling: 30s maximum per request
 * - Graceful failure with fallback
 * - NASA POWER data: GHI, Temperature, Humidity, Cloud Cover
 */

export interface NasaWeatherData {
  annualGhi: number;
  peakSunHoursDaily: number;
  avgTemperatureC: number;
  avgHumidityPct: number;
  avgCloudCoverPct: number;
  monthlyGhi: number[];
  monthlyTemperature: number[];
  monthlyCloudCover: number[];
  monthlyHumidity: number[];
}

interface NasaPowerApiResponse {
  properties: {
    parameter: Record<string, Record<string, number>>;
  };
}

const NASA_BASE_URL =
  process.env.NASA_POWER_BASE_URL ??
  "https://power.larc.nasa.gov/api/temporal/daily/point";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;

// Static fallback data for India (approximate averages)
const STATIC_INDIA_PROFILE: NasaWeatherData = {
  annualGhi: 2100,
  peakSunHoursDaily: 5.3,
  avgTemperatureC: 24,
  avgHumidityPct: 60,
  avgCloudCoverPct: 40,
  monthlyGhi: [140, 155, 180, 205, 220, 180, 150, 145, 165, 185, 160, 140],
  monthlyTemperature: [18, 21, 27, 31, 34, 32, 29, 28, 28, 25, 21, 18],
  monthlyCloudCover: [15, 12, 18, 22, 25, 35, 45, 48, 42, 28, 18, 14],
  monthlyHumidity: [65, 60, 55, 50, 48, 55, 70, 75, 72, 65, 68, 70],
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

async function fetchWithRetry(
  url: string,
  retries: number = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await withTimeout(fetch(url), TIMEOUT_MS);
      if (response.ok) {
        return response;
      }
      if (response.status >= 500 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(`NASA POWER API error: ${response.status}`);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function fetchNasaWeatherData(
  latitude: number,
  longitude: number,
): Promise<NasaWeatherData> {
  const params = new URLSearchParams({
    parameters: "ALLSKY_SFC_SW_DWN,T2M,RH2M,CLOUD_AMT",
    community: "RE",
    longitude: longitude.toString(),
    latitude: latitude.toString(),
    start: "2014",
    end: "2023",
    format: "JSON",
    "time-standard": "UTC",
  });

  try {
    const response = await fetchWithRetry(`${NASA_BASE_URL}?${params}`);
    const data: NasaPowerApiResponse = await response.json();
    return parseNasaResponse(data, latitude, longitude);
  } catch (error) {
    console.error("NASA API failed after retries, using fallback:", error);
    // Return static profile as fallback
    return STATIC_INDIA_PROFILE;
  }
}

function parseNasaResponse(
  data: NasaPowerApiResponse,
  _latitude: number,
  _longitude: number,
): NasaWeatherData {
  const props = data.properties.parameter;

  const ghiByYear = props["ALLSKY_SFC_SW_DWN"];
  const tempByYear = props["T2M"];
  const humidityByYear = props["RH2M"];
  const cloudByYear = props["CLOUD_AMT"];

  const monthlyGhi = averageMonthlyValues(ghiByYear);
  const monthlyTemp = averageMonthlyValues(tempByYear);
  const monthlyCloud = averageMonthlyValues(cloudByYear);
  const monthlyHumidity = averageMonthlyValues(humidityByYear);

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const annualGhi = monthlyGhi.reduce(
    (sum, ghi, i) => sum + ghi * daysInMonth[i],
    0,
  );

  const peakSunHoursDaily =
    monthlyGhi.reduce((sum, ghi) => sum + ghi, 0) / 12;

  return {
    annualGhi,
    peakSunHoursDaily,
    avgTemperatureC: monthlyTemp.reduce((a, b) => a + b, 0) / 12,
    avgHumidityPct: monthlyHumidity.reduce((a, b) => a + b, 0) / 12,
    avgCloudCoverPct: monthlyCloud.reduce((a, b) => a + b, 0) / 12,
    monthlyGhi,
    monthlyTemperature: monthlyTemp,
    monthlyCloudCover: monthlyCloud,
    monthlyHumidity,
  };
}

function averageMonthlyValues(
  yearlyData: Record<string, number>,
): number[] {
  const monthlyTotals = new Array(12).fill(0);
  const counts = new Array(12).fill(0);

  Object.entries(yearlyData).forEach(([key, value]) => {
    const month = parseInt(key.slice(4, 6), 10) - 1;
    if (month >= 0 && month < 12 && value > -900) {
      monthlyTotals[month] += value;
      counts[month]++;
    }
  });

  return monthlyTotals.map((total, i) =>
    counts[i] > 0 ? total / counts[i] : 0,
  );
}
