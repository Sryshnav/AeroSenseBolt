const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  description: string;
  icon: string;
  timestamp: string;
}

export interface AirPollutionData {
  aqi: number;
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
  timestamp: string;
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const url = `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Weather API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      temperature: data.main?.temp || 25,
      humidity: data.main?.humidity || 60,
      windSpeed: data.wind?.speed || 5,
      windDirection: data.wind?.deg || 0,
      pressure: data.main?.pressure || 1013,
      description: data.weather?.[0]?.description || 'Clear sky',
      icon: data.weather?.[0]?.icon || '01d',
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

export async function fetchAirPollutionData(
  lat: number,
  lon: number
): Promise<AirPollutionData | null> {
  try {
    const url = `${WEATHER_API_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Air Pollution API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.list || data.list.length === 0) {
      return null;
    }

    const pollution = data.list[0];

    return {
      aqi: pollution.main?.aqi || 1,
      components: {
        co: pollution.components?.co || 0,
        no: pollution.components?.no || 0,
        no2: pollution.components?.no2 || 0,
        o3: pollution.components?.o3 || 0,
        so2: pollution.components?.so2 || 0,
        pm2_5: pollution.components?.pm2_5 || 0,
        pm10: pollution.components?.pm10 || 0,
        nh3: pollution.components?.nh3 || 0,
      },
      timestamp: new Date(pollution.dt * 1000).toISOString(),
    };

  } catch (error) {
    console.error('Air pollution fetch error:', error);
    return null;
  }
}

export async function fetchAirPollutionForecast(
  lat: number,
  lon: number
): Promise<AirPollutionData[]> {
  try {
    const url = `${WEATHER_API_BASE}/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Air Pollution Forecast API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.list || data.list.length === 0) {
      return [];
    }

    return data.list.slice(0, 6).map((item: any) => ({
      aqi: item.main?.aqi || 1,
      components: {
        co: item.components?.co || 0,
        no: item.components?.no || 0,
        no2: item.components?.no2 || 0,
        o3: item.components?.o3 || 0,
        so2: item.components?.so2 || 0,
        pm2_5: item.components?.pm2_5 || 0,
        pm10: item.components?.pm10 || 0,
        nh3: item.components?.nh3 || 0,
      },
      timestamp: new Date(item.dt * 1000).toISOString(),
    }));

  } catch (error) {
    console.error('Air pollution forecast fetch error:', error);
    return [];
  }
}
