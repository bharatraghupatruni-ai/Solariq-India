import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchNasaWeatherData } from "@/lib/api/nasa-v2";
import { fetchOpenWeatherData } from "@/lib/api/openweather";
import { applySecurityHeaders, validateBounds } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfter ?? 0) } },
    );
  }
  recordRequest(clientId);

  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const source = searchParams.get("source") ?? "auto"; // auto | nasa | openweather

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Valid lat and lon required" }, { status: 400 });
  }

  const latV = validateBounds(lat, -90, 90, "Latitude");
  if (!latV.valid) return NextResponse.json({ error: latV.error }, { status: 422 });
  const lonV = validateBounds(lon, -180, 180, "Longitude");
  if (!lonV.valid) return NextResponse.json({ error: lonV.error }, { status: 422 });

  const supabase = await createClient();

  // Check cache
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  // Use weather_cache (TTL: 1 hour for current weather)
  const ttlCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("weather_cache")
    .select("*")
    .gte("fetched_at", ttlCutoff)
    .gte("latitude", roundedLat - 0.01)
    .lte("latitude", roundedLat + 0.01)
    .gte("longitude", roundedLon - 0.01)
    .lte("longitude", roundedLon + 0.01)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    const response = NextResponse.json({ data: cached, cached: true });
    return applySecurityHeaders(response);
  }

  // Fetch from selected source with fallback chain
  if (source === "openweather" || source === "auto") {
    try {
      const owData = await fetchOpenWeatherData(lat, lon);
      const response = NextResponse.json({
        data: {
          nasa: null,
          openweather: owData,
          cached: false,
        },
      });
      return applySecurityHeaders(response);
    } catch {
      console.warn("OpenWeather failed, falling back to NASA");
    }
  }

  // Fallback: NASA POWER
  try {
    const weatherData = await fetchNasaWeatherData(lat, lon);

    const { data: stored, error } = await supabase
      .from("weather_cache")
      .insert({
        latitude: lat,
        longitude: lon,
        current_temp: weatherData.avgTemperatureC,
        current_humidity: weatherData.avgHumidityPct,
        current_clouds: weatherData.avgCloudCoverPct,
        current_conditions: "NASA_POWER",
        forecast_data: {
          annual_ghi: weatherData.annualGhi,
          peak_sun_hours_daily: weatherData.peakSunHoursDaily,
          monthly_ghi: weatherData.monthlyGhi,
          monthly_temperature: weatherData.monthlyTemperature,
          monthly_cloud_cover: weatherData.monthlyCloudCover,
          seasonal_patterns: {
            best_months: getBestMonths(weatherData.monthlyGhi),
            worst_months: getWorstMonths(weatherData.monthlyGhi),
            monsoon_months: ["Jun", "Jul", "Aug", "Sep"],
          },
        },
      })
      .select()
      .single();

    if (error) console.error("Failed to cache weather data:", error);

    const response = NextResponse.json({
      data: stored ?? weatherData,
      cached: false,
      source: "nasa",
    });
    return applySecurityHeaders(response);
  } catch (err) {
    console.error("All weather sources failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch weather data from all sources." },
      { status: 502 },
    );
  }
}

function getBestMonths(monthlyGhi: number[]): string[] {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return monthlyGhi
    .map((ghi, i) => ({ ghi, month: months[i] }))
    .sort((a, b) => b.ghi - a.ghi)
    .slice(0, 3)
    .map((m) => m.month);
}

function getWorstMonths(monthlyGhi: number[]): string[] {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return monthlyGhi
    .map((ghi, i) => ({ ghi, month: months[i] }))
    .sort((a, b) => a.ghi - b.ghi)
    .slice(0, 3)
    .map((m) => m.month);
}
