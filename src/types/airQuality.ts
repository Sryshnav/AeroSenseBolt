export interface AirQualityData {
  lat: number;
  lon: number;
  pm25: number;
  no2: number;
  o3: number;
  aqi: number;
  timestamp: string;
  location: string;
}

export interface Forecast {
  timestamp: string;
  pm25: number;
  no2: number;
  o3: number;
  aqi: number;
  confidence: number;
}

export interface GeminiResponse {
  reply_text: string;
  tone: 'calm' | 'warning' | 'urgent' | 'positive';
  highlight_area?: {
    lat: number;
    lon: number;
  };
  confidence: number;
  sources: string[];
}

export interface Alert {
  id: string;
  condition: string;
  threshold: number;
  duration: number;
  enabled: boolean;
}

export interface DataSource {
  name: string;
  timestamp: string;
  confidence: number;
  description: string;
}
