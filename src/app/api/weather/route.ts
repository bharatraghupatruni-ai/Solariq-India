import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchNasaWeatherData } from "@/lib/api/nasa-v2";
import { applySecurityHeaders, validateBounds } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfter ?? 0) } },
    );
  }
  recordRequest(clientId);

  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: "Valid lat and lon query parameters are required" },
      { status: 400 },
    );
  }

  // Validate coordinate bounds
  const latValidation = validateBounds(lat, -90, 90, "Latitude");
  if (!latValidation.valid) {
    return NextResponse.json({ error: latValidation.error }, { status: 422 });
  }
  const lonValidation = validateBounds(lon, -180, 180, "Longitude");
  if (!lonValidation.valid) {
    return NextResponse.json({ error: lonValidation.error }, { status: 422 });
  }

  const supabase = await createClient();

  // Check cache (round to 2 decimal places for cache hit)
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  // Use weather_cache (TTL: 24h based on fetched_at)
  const ttlCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
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

  // Fetch from NASA POWER (with retry + timeout via nasa-v2)
  try {
    const weatherData = await fetchNasaWeatherData(lat, lon);

    // Store in weather_cache (current conditions + forecast placeholder)
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

    if (error) {
      console.error("Failed to cache weather data:", error);
    }

    const response = NextResponse.json({ data: stored ?? weatherData, cached: false });
    return applySecurityHeaders(response);
  } catch (err) {
    console.error("NASA POWER API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch weather data. Please try again." },
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
