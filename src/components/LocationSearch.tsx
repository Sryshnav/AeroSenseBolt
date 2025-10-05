import { useState } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';

interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number, name: string) => void;
  currentLocation: string;
}

export default function LocationSearch({ onLocationSelect, currentLocation }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${import.meta.env.VITE_WEATHER_API_KEY}`
      );

      if (!response.ok) {
        setResults([]);
        return;
      }

      const data = await response.json();

      const locations: LocationResult[] = data.map((item: any) => ({
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        country: item.country,
        state: item.state,
      }));

      setResults(locations);
      setShowResults(true);

    } catch (error) {
      console.error('Location search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length >= 3) {
      searchLocation(value);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelectLocation = (location: LocationResult) => {
    const displayName = location.state
      ? `${location.name}, ${location.state}, ${location.country}`
      : `${location.name}, ${location.country}`;

    onLocationSelect(location.lat, location.lon, displayName);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search for a city or location..."
          className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
        />
        {isSearching && <Loader className="w-5 h-5 text-blue-400 animate-spin" />}
      </div>

      {!showResults && !query && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>Current: {currentLocation}</span>
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {results.map((location, index) => (
            <button
              key={index}
              onClick={() => handleSelectLocation(location)}
              className="w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">{location.name}</p>
                  <p className="text-sm text-gray-400">
                    {location.state && `${location.state}, `}{location.country}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isSearching && query.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-lg shadow-xl p-4 text-center text-gray-400">
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
