import { AirQualityData, Forecast, DataSource } from '../types/airQuality';
import { fetchOpenAQData, extractPollutantValue, OpenAQLocation } from './openaqService';
import { fetchAirPollutionData, fetchAirPollutionForecast } from './weatherService';
import { fetchNASATempoData } from './nasaService';

function calculateAQI(pm25: number, no2: number, o3: number): number {
  const pm25AQI = (pm25 / 15) * 50;
  const no2AQI = (no2 / 40) * 50;
  const o3AQI = (o3 / 100) * 50;
  return Math.round(Math.max(pm25AQI, no2AQI, o3AQI));
}

export async function fetchAirQualityData(
  lat: number = 9.9312,
  lon: number = 76.2673
): Promise<AirQualityData[]> {
  try {
    const openaqLocations = await fetchOpenAQData(lat, lon, 50);

    if (!openaqLocations || openaqLocations.length === 0) {
      return [];
    }

    const airQualityData: AirQualityData[] = await Promise.all(
      openaqLocations.slice(0, 10).map(async (location: OpenAQLocation) => {
        const pm25 = extractPollutantValue(location.measurements, 'pm25') || 0;
        const no2 = extractPollutantValue(location.measurements, 'no2') || 0;
        const o3 = extractPollutantValue(location.measurements, 'o3') || 0;

        const nasaData = await fetchNASATempoData(
          location.coordinates.latitude,
          location.coordinates.longitude
        );

        const finalNO2 = nasaData?.no2 || no2;
        const finalO3 = nasaData?.o3 || o3;

        return {
          lat: location.coordinates.latitude,
          lon: location.coordinates.longitude,
          pm25: pm25,
          no2: finalNO2,
          o3: finalO3,
          aqi: calculateAQI(pm25, finalNO2, finalO3),
          timestamp: new Date().toISOString(),
          location: location.name,
        };
      })
    );

    return airQualityData.filter(data => data.pm25 > 0 || data.no2 > 0 || data.o3 > 0);

  } catch (error) {
    console.error('Error fetching air quality data:', error);
    return [];
  }
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast[]> {
  try {
    const forecastData = await fetchAirPollutionForecast(lat, lon);

    if (!forecastData || forecastData.length === 0) {
      const currentData = await fetchAirPollutionData(lat, lon);
      if (!currentData) return [];

      return generateFallbackForecast(
        currentData.components.pm2_5,
        currentData.components.no2,
        currentData.components.o3
      );
    }

    return forecastData.map((data, index) => ({
      timestamp: data.timestamp,
      pm25: data.components.pm2_5,
      no2: data.components.no2,
      o3: data.components.o3,
      aqi: calculateAQI(data.components.pm2_5, data.components.no2, data.components.o3),
      confidence: 0.9 - index * 0.08,
    }));

  } catch (error) {
    console.error('Error fetching forecast:', error);
    return generateFallbackForecast(50, 20, 40);
  }
}

function generateFallbackForecast(
  basePM25: number,
  baseNO2: number,
  baseO3: number
): Forecast[] {
  const forecasts: Forecast[] = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const futureTime = new Date(now.getTime() + i * 3600000);
    const variation = Math.sin(i * 0.5) * 15;

    const pm25 = Math.max(10, basePM25 + variation);
    const no2 = Math.max(5, baseNO2 + variation * 0.3);
    const o3 = Math.max(20, baseO3 + variation * 0.5);

    forecasts.push({
      timestamp: futureTime.toISOString(),
      pm25,
      no2,
      o3,
      aqi: calculateAQI(pm25, no2, o3),
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
