import { useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Alert } from '../types/airQuality';

interface AlertsPanelProps {
  alerts: Alert[];
  onAddAlert: (alert: Omit<Alert, 'id'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}

export default function AlertsPanel({ alerts, onAddAlert, onToggleAlert, onDeleteAlert }: AlertsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    condition: 'PM2.5',
    threshold: 50,
    duration: 2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAlert({
      ...newAlert,
      enabled: true,
    });
    setNewAlert({ condition: 'PM2.5', threshold: 50, duration: 2 });
    setShowForm(false);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Bell className="w-5 h-5 text-blue-400" />
          Alert Rules
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-700 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Pollutant</label>
            <select
              value={newAlert.condition}
              onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
              className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PM2.5">PM2.5</option>
              <option value="NO₂">NO₂</option>
              <option value="O₃">O₃</option>
              <option value="AQI">AQI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Threshold ({newAlert.condition === 'AQI' ? 'Index' : 'µg/m³'})
            </label>
            <input
              type="number"
              value={newAlert.threshold}
              onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
              className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Duration (hours)</label>
            <input
              type="number"
              value={newAlert.duration}
              onChange={(e) => setNewAlert({ ...newAlert, duration: Number(e.target.value) })}
              className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="24"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 text-sm font-medium transition-colors"
            >
              Create Alert
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white rounded py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts configured</p>
            <p className="text-xs mt-1">Create an alert to get notified</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-slate-700 rounded-lg p-3 transition-opacity ${
                alert.enabled ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{alert.condition}</span>
                    <span className="text-gray-400 text-xs">
                      &gt; {alert.threshold} {alert.condition === 'AQI' ? '' : 'µg/m³'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Alert when exceeded for {alert.duration} hour{alert.duration > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAlert(alert.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {alert.enabled ? (
                      <ToggleRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteAlert(alert.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {alerts.some(a => a.enabled) && (
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            You'll receive notifications when conditions match your alert rules.
          </p>
        </div>
      )}
    </div>
  );
}
