import { GeminiResponse } from '../types/airQuality';

export async function sendToGemini(
  query: string,
  context: {
    location: string;
    pm25: number;
    no2: number;
    o3: number;
    aqi: number;
  }
): Promise<GeminiResponse> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const whoLimit = 15;
  const isPM25High = context.pm25 > whoLimit;
  const isAQIHigh = context.aqi > 100;

  const queryLower = query.toLowerCase();

  let reply_text = '';
  let tone: 'calm' | 'warning' | 'urgent' | 'positive' = 'calm';
  let confidence = 0.85;

  if (queryLower.includes('play') || queryLower.includes('outdoor') || queryLower.includes('exercise')) {
    if (isPM25High || isAQIHigh) {
      reply_text = `I'd recommend limiting outdoor activities in ${context.location} right now. PM2.5 is at ${context.pm25} µg/m³, which exceeds the WHO guideline of 15. Consider indoor activities or wait until evening when air quality typically improves.`;
      tone = 'warning';
    } else {
      reply_text = `Good news! Air quality in ${context.location} is acceptable for outdoor activities. PM2.5 is at ${context.pm25} µg/m³. Enjoy your time outside, but keep monitoring the conditions.`;
      tone = 'positive';
    }
  } else if (queryLower.includes('air quality') || queryLower.includes('how') || queryLower.includes('today')) {
    if (isAQIHigh) {
      reply_text = `Air quality in ${context.location} is concerning today. The AQI is ${context.aqi}, with PM2.5 at ${context.pm25} µg/m³. Sensitive groups should definitely limit outdoor exposure.`;
      tone = 'warning';
    } else if (isPM25High) {
      reply_text = `Air quality in ${context.location} is moderate. PM2.5 is slightly elevated at ${context.pm25} µg/m³, above WHO's guideline. Most people can proceed normally, but sensitive individuals should be cautious.`;
      tone = 'calm';
    } else {
      reply_text = `Air quality in ${context.location} looks good! PM2.5 is ${context.pm25} µg/m³, which is within safe limits. It's a great day to be outside.`;
      tone = 'positive';
    }
  } else if (queryLower.includes('when') || queryLower.includes('improve') || queryLower.includes('better')) {
    reply_text = `Based on atmospheric patterns, air quality typically improves in the evening hours as temperature cools and winds pick up. I'd suggest checking back around 6-7 PM for better conditions in ${context.location}.`;
    tone = 'calm';
    confidence = 0.78;
  } else if (queryLower.includes('why') || queryLower.includes('cause') || queryLower.includes('reason')) {
    reply_text = `The elevated PM2.5 levels in ${context.location} are likely due to a combination of vehicle emissions, industrial activity, and current weather conditions that trap pollutants. Low wind speeds and high humidity can worsen air quality.`;
    tone = 'calm';
    confidence = 0.82;
  } else {
    reply_text = `I'm analyzing air quality data for ${context.location}. Current PM2.5 is ${context.pm25} µg/m³ and AQI is ${context.aqi}. Could you be more specific about what you'd like to know?`;
    tone = 'calm';
  }

  return {
    reply_text,
    tone,
    confidence,
    sources: ['TEMPO NRT', 'OpenAQ', 'MERRA-2'],
    highlight_area: {
      lat: 9.9312,
      lon: 76.2673,
    },
  };
}
