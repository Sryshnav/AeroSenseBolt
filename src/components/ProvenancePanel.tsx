import { Database, Clock, TrendingUp, Info } from 'lucide-react';
import { DataSource } from '../types/airQuality';

interface ProvenancePanelProps {
  sources: DataSource[];
  lastUpdate: Date;
  confidence: number;
}

export default function ProvenancePanel({ sources, lastUpdate, confidence }: ProvenancePanelProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-400';
    if (conf >= 0.8) return 'text-blue-400';
    if (conf >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold">
        <Database className="w-5 h-5 text-blue-400" />
        Data Provenance
      </div>

      <div className="space-y-3">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Update
            </span>
            <span className="text-white font-medium">{formatTime(lastUpdate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overall Confidence
            </span>
            <span className={`font-medium ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Data Sources
          </h3>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-white font-medium text-sm">{source.name}</span>
                  <span className={`text-xs font-semibold ${getConfidenceColor(source.confidence)}`}>
                    {(source.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">{source.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
          <h4 className="text-sm text-blue-300 font-medium mb-2">Why This Forecast?</h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            Predictions combine satellite observations (TEMPO), ground sensors (OpenAQ), and atmospheric
            models (MERRA-2) to provide accurate air quality forecasts. Confidence decreases for longer
            time horizons due to weather variability.
          </p>
        </div>
      </div>
    </div>
  );
}
