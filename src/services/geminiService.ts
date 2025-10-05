import { GeminiResponse } from '../types/airQuality';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiContext {
  location: string;
  pm25: number;
  no2: number;
  o3: number;
  aqi: number;
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}

export async function sendToGemini(
  query: string,
  context: GeminiContext
): Promise<GeminiResponse> {
  try {
    const prompt = buildPrompt(query, context);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API error, using fallback response');
      return generateFallbackResponse(query, context);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return generateFallbackResponse(query, context);
    }

    const tone = determineTone(generatedText, context);
    const confidence = calculateConfidence(context);

    return {
      reply_text: generatedText,
      tone,
      confidence,
      sources: ['OpenAQ', 'OpenWeatherMap', 'WHO Guidelines'],
      highlight_area: undefined,
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackResponse(query, context);
  }
}

function buildPrompt(query: string, context: GeminiContext): string {
  const whoLimit = 15;
  const weatherInfo = context.weather
    ? `Temperature: ${context.weather.temperature}°C, Humidity: ${context.weather.humidity}%, Wind Speed: ${context.weather.windSpeed} m/s`
    : '';

  return `You are AeroSense, a friendly and knowledgeable air quality guardian assistant. Provide helpful, accurate information about air quality and health recommendations.

Current Air Quality Data for ${context.location}:
- PM2.5: ${context.pm25.toFixed(1)} µg/m³ (WHO safe limit: ${whoLimit} µg/m³)
- NO₂: ${context.no2.toFixed(1)} µg/m³
- O₃: ${context.o3.toFixed(1)} µg/m³
- AQI: ${context.aqi}
${weatherInfo ? `\nWeather Conditions:\n${weatherInfo}` : ''}

User Question: "${query}"

Provide a concise, actionable response (2-3 sentences max) that:
1. Directly answers the user's question
2. Gives clear health recommendations if relevant
3. Mentions specific pollutant levels when important
4. Uses a conversational, caring tone

Response:`;
}

function determineTone(
  text: string,
  context: GeminiContext
): 'calm' | 'warning' | 'urgent' | 'positive' {
  const textLower = text.toLowerCase();

  if (context.aqi > 150 || context.pm25 > 55) {
    return 'urgent';
  } else if (context.aqi > 100 || context.pm25 > 35) {
    return 'warning';
  } else if (context.pm25 < 15 && context.aqi < 50) {
    return 'positive';
  }

  return 'calm';
}

function calculateConfidence(context: GeminiContext): number {
  let confidence = 0.85;

  if (context.pm25 < 0 || context.pm25 > 500) confidence -= 0.2;
  if (context.aqi < 0 || context.aqi > 500) confidence -= 0.2;

  return Math.max(0.5, Math.min(1.0, confidence));
}

function generateFallbackResponse(query: string, context: GeminiContext): GeminiResponse {
  const whoLimit = 15;
  const isPM25High = context.pm25 > whoLimit;
  const isAQIHigh = context.aqi > 100;
  const queryLower = query.toLowerCase();

  let reply_text = '';
  let tone: 'calm' | 'warning' | 'urgent' | 'positive' = 'calm';

  if (queryLower.includes('play') || queryLower.includes('outdoor') || queryLower.includes('exercise')) {
    if (isPM25High || isAQIHigh) {
      reply_text = `I'd recommend limiting outdoor activities in ${context.location} right now. PM2.5 is at ${context.pm25.toFixed(1)} µg/m³, which exceeds the WHO guideline of 15. Consider indoor activities or wait until evening when air quality typically improves.`;
      tone = 'warning';
    } else {
      reply_text = `Good news! Air quality in ${context.location} is acceptable for outdoor activities. PM2.5 is at ${context.pm25.toFixed(1)} µg/m³. Enjoy your time outside, but keep monitoring the conditions.`;
      tone = 'positive';
    }
  } else if (queryLower.includes('air quality') || queryLower.includes('how') || queryLower.includes('today')) {
    if (isAQIHigh) {
      reply_text = `Air quality in ${context.location} is concerning today. The AQI is ${context.aqi}, with PM2.5 at ${context.pm25.toFixed(1)} µg/m³. Sensitive groups should definitely limit outdoor exposure.`;
      tone = 'warning';
    } else if (isPM25High) {
      reply_text = `Air quality in ${context.location} is moderate. PM2.5 is slightly elevated at ${context.pm25.toFixed(1)} µg/m³, above WHO's guideline. Most people can proceed normally, but sensitive individuals should be cautious.`;
      tone = 'calm';
    } else {
      reply_text = `Air quality in ${context.location} looks good! PM2.5 is ${context.pm25.toFixed(1)} µg/m³, which is within safe limits. It's a great day to be outside.`;
      tone = 'positive';
    }
  } else {
    reply_text = `I'm analyzing air quality data for ${context.location}. Current PM2.5 is ${context.pm25.toFixed(1)} µg/m³ and AQI is ${context.aqi}. Could you be more specific about what you'd like to know?`;
    tone = 'calm';
  }

  return {
    reply_text,
    tone,
    confidence: 0.85,
    sources: ['OpenAQ', 'OpenWeatherMap', 'WHO Guidelines'],
    highlight_area: undefined,
  };
}
