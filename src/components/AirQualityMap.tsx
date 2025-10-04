import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { AirQualityData } from '../types/airQuality';
import { getAQILevel } from '../services/airQualityService';

interface AirQualityMapProps {
  data: AirQualityData[];
  selectedLocation: AirQualityData | null;
  onLocationSelect: (location: AirQualityData) => void;
  highlightArea?: { lat: number; lon: number };
}

export default function AirQualityMap({
  data,
  selectedLocation,
  onLocationSelect,
  highlightArea
}: AirQualityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    const latMin = 9.85, latMax = 10.1;
    const lonMin = 76.15, lonMax = 76.4;

    const latToY = (lat: number) => {
      return ((latMax - lat) / (latMax - latMin)) * height;
    };

    const lonToX = (lon: number) => {
      return ((lon - lonMin) / (lonMax - lonMin)) * width;
    };

    if (highlightArea) {
      const x = lonToX(highlightArea.lon);
      const y = latToY(highlightArea.lat);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    data.forEach((location) => {
      const x = lonToX(location.lon);
      const y = latToY(location.lat);
      const { color } = getAQILevel(location.aqi);

      const radius = selectedLocation?.location === location.location ? 20 : 15;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, color + '80');
      gradient.addColorStop(0.5, color + '40');
      gradient.addColorStop(1, color + '00');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (selectedLocation?.location === location.location) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(location.aqi.toString(), x, y + 4);
    });

  }, [data, selectedLocation, highlightArea]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latMin = 9.85, latMax = 10.1;
    const lonMin = 76.15, lonMax = 76.4;

    const latToY = (lat: number) => {
      return ((latMax - lat) / (latMax - latMin)) * canvas.height;
    };

    const lonToX = (lon: number) => {
      return ((lon - lonMin) / (lonMax - lonMin)) * canvas.width;
    };

    for (const location of data) {
      const locX = lonToX(location.lon);
      const locY = latToY(location.lat);
      const distance = Math.sqrt((x - locX) ** 2 + (y - locY) ** 2);

      if (distance < 20) {
        onLocationSelect(location);
        return;
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
      />

      <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Kochi Region
        </h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Good (0-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-300">Moderate (51-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-300">Unhealthy (101-150)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Very Unhealthy (151+)</span>
          </div>
        </div>
      </div>

      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">{selectedLocation.location}</h3>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-gray-400 text-xs">PM2.5</p>
                  <p className="text-white font-semibold">{selectedLocation.pm25} µg/m³</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">NO₂</p>
                  <p className="text-white font-semibold">{selectedLocation.no2} µg/m³</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">O₃</p>
                  <p className="text-white font-semibold">{selectedLocation.o3} µg/m³</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: getAQILevel(selectedLocation.aqi).color }}>
                {selectedLocation.aqi}
              </p>
              <p className="text-xs text-gray-400">AQI</p>
            </div>
          </div>
          {selectedLocation.pm25 > 15 && (
            <div className="mt-3 flex items-start gap-2 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>PM2.5 exceeds WHO guideline (15 µg/m³)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
