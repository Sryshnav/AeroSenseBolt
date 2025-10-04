import { useState, useEffect, useRef } from 'react';
import { Wind } from 'lucide-react';
import AirQualityMap from './components/AirQualityMap';
import Avatar from './components/Avatar';
import ChatInterface, { Message } from './components/ChatInterface';
import ProvenancePanel from './components/ProvenancePanel';
import ForecastChart from './components/ForecastChart';
import AlertsPanel from './components/AlertsPanel';
import { AirQualityData, Forecast, Alert } from './types/airQuality';
import { fetchAirQualityData, fetchForecast, getDataSources } from './services/airQualityService';
import { sendToGemini } from './services/geminiService';
import { SpeechService } from './services/speechService';

function App() {
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AirQualityData | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarTone, setAvatarTone] = useState<'calm' | 'warning' | 'urgent' | 'positive'>('calm');
  const [highlightArea, setHighlightArea] = useState<{ lat: number; lon: number } | undefined>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const speechServiceRef = useRef<SpeechService | null>(null);

  useEffect(() => {
    speechServiceRef.current = new SpeechService();
    loadAirQualityData();

    const interval = setInterval(() => {
      loadAirQualityData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (airQualityData.length > 0 && !selectedLocation) {
      setSelectedLocation(airQualityData[0]);
      loadForecast(airQualityData[0].lat, airQualityData[0].lon);
    }
  }, [airQualityData]);

  const loadAirQualityData = async () => {
    const data = await fetchAirQualityData();
    setAirQualityData(data);
    setLastUpdate(new Date());
  };

  const loadForecast = async (lat: number, lon: number) => {
    const forecast = await fetchForecast(lat, lon);
    setForecasts(forecast);
  };

  const handleLocationSelect = (location: AirQualityData) => {
    setSelectedLocation(location);
    loadForecast(location.lat, location.lon);
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      if (!selectedLocation) return;

      const response = await sendToGemini(content, {
        location: selectedLocation.location,
        pm25: selectedLocation.pm25,
        no2: selectedLocation.no2,
        o3: selectedLocation.o3,
        aqi: selectedLocation.aqi,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply_text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAvatarTone(response.tone);

      if (response.highlight_area) {
        setHighlightArea(response.highlight_area);
        setTimeout(() => setHighlightArea(undefined), 3000);
      }

      const speechService = speechServiceRef.current;
      if (speechService) {
        speechService.speak(
          response.reply_text,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAlert = (alert: Omit<Alert, 'id'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const sources = getDataSources();

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AeroSense</h1>
              <p className="text-sm text-gray-400">Your Air Quality Guardian</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Live Monitoring</p>
            <p className="text-xs text-gray-500">Updates every 30 seconds</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <div className="h-[600px]">
              <AirQualityMap
                data={airQualityData}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                highlightArea={highlightArea}
              />
            </div>

            {forecasts.length > 0 && (
              <ForecastChart forecasts={forecasts} />
            )}
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 text-center">Local Guardian</h3>
              <Avatar isSpeaking={isSpeaking} tone={avatarTone} />
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-400">
                  {isSpeaking ? 'Speaking...' : 'Ready to help'}
                </p>
              </div>
            </div>

            <div className="h-[400px]">
              <ChatInterface
                onSendMessage={handleSendMessage}
                messages={messages}
                isProcessing={isProcessing}
              />
            </div>

            <ProvenancePanel
              sources={sources}
              lastUpdate={lastUpdate}
              confidence={0.85}
            />

            <AlertsPanel
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onToggleAlert={handleToggleAlert}
              onDeleteAlert={handleDeleteAlert}
            />
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 border-t border-slate-700 mt-12 px-6 py-4">
        <div className="max-w-[1800px] mx-auto text-center text-sm text-gray-400">
          <p>Data sources: TEMPO NRT, OpenAQ, MERRA-2 | Built for community air quality awareness</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
