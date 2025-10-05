import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Database features will be disabled.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface UserLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  user_id: string;
  location_id: string | null;
  pollutant: string;
  threshold: number;
  duration_hours: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AirQualityRecord {
  id: string;
  location_id: string | null;
  latitude: number;
  longitude: number;
  pm25: number | null;
  no2: number | null;
  o3: number | null;
  aqi: number | null;
  source: string;
  recorded_at: string;
  created_at: string;
}

export interface ChatRecord {
  id: string;
  user_id: string;
  location_id: string | null;
  message: string;
  response: string;
  confidence: number;
  tone: string;
  created_at: string;
}
