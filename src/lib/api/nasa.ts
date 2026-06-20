export interface NasaWeatherData {
  annualGhi: number;
  peakSunHoursDaily: number;
  avgTemperatureC: number;
  avgHumidityPct: number;
  avgCloudCoverPct: number;
  monthlyGhi: number[];
  monthlyTemperature: number[];
  monthlyCloudCover: number[];
}

const NASA_BASE_URL =
  process.env.NASA_POWER_BASE_URL ??
  "https://power.larc.nasa.gov/api/temporal/monthly/point";

export async function fetchNasaWeatherData(
  latitude: number,
  longitude: number
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

  const response = await fetch(`${NASA_BASE_URL}?${params}`, {
    next: { revalidate: 60 * 60 * 24 * 30 }, // cache 30 days
  });

  if (!response.ok) {
    throw new Error(`NASA POWER API error: ${response.status}`);
  }

  const data = await response.json();
  return parseNasaResponse(data);
}

function parseNasaResponse(data: NasaPowerApiResponse): NasaWeatherData {
  const props = data.properties.parameter;

  const ghiByYear = props["ALLSKY_SFC_SW_DWN"];
  const tempByYear = props["T2M"];
  const humidityByYear = props["RH2M"];
  const cloudByYear = props["CLOUD_AMT"];

  // Average monthly values across years
  const monthlyGhi = averageMonthlyValues(ghiByYear);
  const monthlyTemp = averageMonthlyValues(tempByYear);
  const monthlyCloud = averageMonthlyValues(cloudByYear);
  const monthlyHumidity = averageMonthlyValues(humidityByYear);

  // Annual GHI = sum of monthly GHI * days in month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const annualGhi = monthlyGhi.reduce(
    (sum, ghi, i) => sum + ghi * daysInMonth[i],
    0
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
  };
}

function averageMonthlyValues(
  yearlyData: Record<string, number>
): number[] {
  const monthlyTotals = new Array(12).fill(0);
  const counts = new Array(12).fill(0);

  Object.entries(yearlyData).forEach(([key, value]) => {
    // Key format: "YYYYMM"
    const month = parseInt(key.slice(4, 6), 10) - 1;
    if (month >= 0 && month < 12 && value > -900) {
      monthlyTotals[month] += value;
      counts[month]++;
    }
  });

  return monthlyTotals.map((total, i) =>
    counts[i] > 0 ? total / counts[i] : 0
  );
}

interface NasaPowerApiResponse {
  properties: {
    parameter: Record<string, Record<string, number>>;
  };
}
