import { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import { Forecast } from '../types/airQuality';

interface ForecastChartProps {
  forecasts: Forecast[];
}

export default function ForecastChart({ forecasts }: ForecastChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || forecasts.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...forecasts.map(f => Math.max(f.pm25, f.no2, f.o3)));
    const minValue = 0;
    const valueRange = maxValue - minValue;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      const value = maxValue - (valueRange / 5) * i;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), padding - 5, y + 3);
    }

    const drawLine = (data: number[], color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawLine(forecasts.map(f => f.pm25), '#3b82f6', 'PM2.5');
    drawLine(forecasts.map(f => f.no2), '#10b981', 'NO₂');
    drawLine(forecasts.map(f => f.o3), '#f59e0b', 'O₃');

    forecasts.forEach((forecast, index) => {
      const x = padding + (chartWidth / (forecasts.length - 1)) * index;
      const time = new Date(forecast.timestamp);
      const label = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, height - 10);
    });

  }, [forecasts]);

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-white font-semibold mb-4">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        6-Hour Forecast
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={250}
        className="w-full h-auto"
      />

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-300">PM2.5</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">NO₂</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-sm text-gray-300">O₃</span>
        </div>
      </div>
    </div>
  );
}
