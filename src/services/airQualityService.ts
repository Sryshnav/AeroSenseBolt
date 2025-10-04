import { AirQualityData, Forecast, DataSource } from '../types/airQuality';

const MOCK_LOCATIONS = [
  { name: 'Kochi City Center', lat: 9.9312, lon: 76.2673, pm25: 82, no2: 20, o3: 45 },
  { name: 'Marine Drive', lat: 9.9667, lon: 76.2833, pm25: 65, no2: 18, o3: 52 },
  { name: 'Edappally', lat: 10.0167, lon: 76.3083, pm25: 95, no2: 28, o3: 38 },
  { name: 'Fort Kochi', lat: 9.9658, lon: 76.2433, pm25: 58, no2: 15, o3: 48 },
  { name: 'Kakkanad', lat: 10.0064, lon: 76.3525, pm25: 78, no2: 22, o3: 42 },
];

function calculateAQI(pm25: number, no2: number, o3: number): number {
  const pm25AQI = (pm25 / 15) * 50;
  const no2AQI = (no2 / 40) * 50;
  const o3AQI = (o3 / 100) * 50;
  return Math.round(Math.max(pm25AQI, no2AQI, o3AQI));
}

export async function fetchAirQualityData(): Promise<AirQualityData[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  return MOCK_LOCATIONS.map(loc => ({
    ...loc,
    aqi: calculateAQI(loc.pm25, loc.no2, loc.o3),
    timestamp: new Date().toISOString(),
    location: loc.name,
  }));
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const baseData = MOCK_LOCATIONS.find(
    loc => Math.abs(loc.lat - lat) < 0.1 && Math.abs(loc.lon - lon) < 0.1
  ) || MOCK_LOCATIONS[0];

  const forecasts: Forecast[] = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const futureTime = new Date(now.getTime() + i * 3600000);
    const variation = Math.sin(i * 0.5) * 15;

    forecasts.push({
      timestamp: futureTime.toISOString(),
      pm25: Math.max(10, baseData.pm25 + variation),
      no2: Math.max(5, baseData.no2 + variation * 0.3),
      o3: Math.max(20, baseData.o3 + variation * 0.5),
      aqi: calculateAQI(
        Math.max(10, baseData.pm25 + variation),
        Math.max(5, baseData.no2 + variation * 0.3),
        Math.max(20, baseData.o3 + variation * 0.5)
      ),
      confidence: 0.85 - i * 0.08,
    });
  }

  return forecasts;
}

export function getDataSources(): DataSource[] {
  return [
    {
      name: 'TEMPO NRT',
      timestamp: new Date().toISOString(),
      confidence: 0.92,
      description: 'NASA satellite tropospheric observations',
    },
    {
      name: 'OpenAQ',
      timestamp: new Date().toISOString(),
      confidence: 0.88,
      description: 'Ground-level sensor network',
    },
    {
      name: 'MERRA-2',
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      description: 'Atmospheric reanalysis model',
    },
  ];
}

export function getAQILevel(aqi: number): { level: string; color: string; advice: string } {
  if (aqi <= 50) {
    return { level: 'Good', color: '#10b981', advice: 'Air quality is satisfactory' };
  } else if (aqi <= 100) {
    return { level: 'Moderate', color: '#f59e0b', advice: 'Sensitive groups should limit outdoor activity' };
  } else if (aqi <= 150) {
    return { level: 'Unhealthy for Sensitive Groups', color: '#f97316', advice: 'Reduce prolonged outdoor exertion' };
  } else if (aqi <= 200) {
    return { level: 'Unhealthy', color: '#ef4444', advice: 'Everyone should reduce outdoor activity' };
  } else {
    return { level: 'Very Unhealthy', color: '#991b1b', advice: 'Avoid all outdoor activity' };
  }
}
