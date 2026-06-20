/**
 * OpenWeather API Client
 * - Current weather + 5-day forecast
 * - Temperature, humidity, cloud cover, weather conditions
 * - Cache results in weather_cache
 * - Timeout + retry logic
 * - Fallback to NASA cache
 * - API key NEVER exposed on frontend (backend only)
 */

export interface OpenWeatherCurrent {
  temperature: number;
  feelsLike: number;
  humidity: number;
  cloudCover: number;
  weatherMain: string;
  weatherDescription: string;
  windSpeed: number;
  visibility: number;
}

export interface OpenWeatherForecastItem {
  dateTime: string;
  temperature: number;
  humidity: number;
  cloudCover: number;
  weatherMain: string;
  pop: number; // probability of precipitation
}

export interface OpenWeatherData {
  current: OpenWeatherCurrent;
  forecast: OpenWeatherForecastItem[];
  fetchedAt: string;
  source: "openweather" | "nasa_fallback";
}

const OPENWEATHER_BASE_URL =
  process.env.OPENWEATHER_BASE_URL ?? "https://api.openweathermap.org/data/2.5";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY ?? "";
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(
      (r) => { clearTimeout(id); resolve(r); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await withTimeout(fetch(url), TIMEOUT_MS);
      if (response.ok) return response;
      if (response.status >= 500 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error(`OpenWeather API error: ${response.status}`);
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<OpenWeatherCurrent> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }

  const url = `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const response = await fetchWithRetry(url);
  const data = await response.json();

  return {
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    cloudCover: data.clouds.all,
    weatherMain: data.weather[0]?.main ?? "Unknown",
    weatherDescription: data.weather[0]?.description ?? "",
    windSpeed: data.wind.speed,
    visibility: data.visibility,
  };
}

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
): Promise<OpenWeatherForecastItem[]> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }

  const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const response = await fetchWithRetry(url);
  const data = await response.json();

  return (data.list ?? []).map((item: Record<string, unknown>) => ({
    dateTime: item.dt_txt as string,
    temperature: (item.main as Record<string, number>).temp,
    humidity: (item.main as Record<string, number>).humidity,
    cloudCover: (item.clouds as Record<string, number>).all,
    weatherMain: ((item.weather as Array<Record<string, string>>)[0]?.main) ?? "Unknown",
    pop: (item.pop as number) ?? 0,
  }));
}

export async function fetchOpenWeatherData(
  latitude: number,
  longitude: number,
): Promise<OpenWeatherData> {
  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(latitude, longitude),
      fetchWeatherForecast(latitude, longitude),
    ]);

    return {
      current,
      forecast,
      fetchedAt: new Date().toISOString(),
      source: "openweather",
    };
  } catch (error) {
    console.error("OpenWeather fetch failed:", error);
    throw error;
  }
}
