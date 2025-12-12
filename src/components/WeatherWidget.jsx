import React, { useEffect, useState } from 'react';
import { CloudRain, Wind, Thermometer, MapPin, ChevronDown } from 'lucide-react';

// Major Sri Lankan regions with coordinates
const REGIONS = {
    colombo: { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
    kandy: { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
    galle: { name: 'Galle', lat: 6.0535, lng: 80.2210 },
    jaffna: { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
    trincomalee: { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
    batticaloa: { name: 'Batticaloa', lat: 7.7310, lng: 81.6747 },
    anuradhapura: { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
    ratnapura: { name: 'Ratnapura', lat: 6.6828, lng: 80.3992 },
    badulla: { name: 'Badulla', lat: 6.9934, lng: 81.0550 },
    matara: { name: 'Matara', lat: 5.9549, lng: 80.5550 },
    kurunegala: { name: 'Kurunegala', lat: 7.4863, lng: 80.3647 },
    nuwara_eliya: { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
    hambantota: { name: 'Hambantota', lat: 6.1241, lng: 81.1185 },
    kalutara: { name: 'Kalutara', lat: 6.5854, lng: 79.9607 },
    negombo: { name: 'Negombo', lat: 7.2094, lng: 79.8385 },
};

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState('colombo');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const region = REGIONS[selectedRegion];

    useEffect(() => {
        async function fetchWeather() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lng}&current=temperature_2m,rain,wind_speed_10m&daily=precipitation_sum,wind_speed_10m_max&timezone=auto`
                );
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                const data = await response.json();
                setWeather(data);
            } catch (err) {
                console.error("Failed to fetch weather", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchWeather();
    }, [selectedRegion, region.lat, region.lng]);

    const handleRegionChange = (regionKey) => {
        setSelectedRegion(regionKey);
        setIsDropdownOpen(false);
    };

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !weather || !weather.current) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-2">Weather Risk Monitor</h2>
                <p className="text-sm text-gray-500">Weather data unavailable for {region.name}</p>
                <button
                    onClick={() => setLoading(true)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    const current = weather.current;
    const daily = weather.daily;

    // Simple Risk Calculation
    const maxRain = daily?.precipitation_sum?.[0] || 0;
    const maxWind = daily?.wind_speed_10m_max?.[0] || 0;

    let riskLevel = 'Low';
    let riskColor = 'bg-green-100 text-green-800 border-green-200';

    if (maxRain > 50 || maxWind > 50) {
        riskLevel = 'High';
        riskColor = 'bg-red-100 text-red-800 border-red-200';
    } else if (maxRain > 20 || maxWind > 30) {
        riskLevel = 'Medium';
        riskColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Header with Region Selector */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">Weather Risk Monitor</h2>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${riskColor}`}>
                    {riskLevel} Risk
                </span>
            </div>

            {/* Region Dropdown */}
            <div className="relative mb-4">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">{region.name}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {Object.entries(REGIONS).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => handleRegionChange(key)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${selectedRegion === key ? 'bg-red-50 text-red-700' : 'text-gray-700'
                                    }`}
                            >
                                <MapPin className={`w-3 h-3 ${selectedRegion === key ? 'text-red-500' : 'text-gray-400'}`} />
                                {value.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Weather Data */}
            <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-orange-500 mb-1" />
                    <span className="text-lg font-bold text-gray-700">{current.temperature_2m}°C</span>
                    <span className="text-xs text-gray-500">Temp</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <CloudRain className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-lg font-bold text-gray-700">{current.rain || 0}mm</span>
                    <span className="text-xs text-gray-500">Rain</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <Wind className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-lg font-bold text-gray-700">{current.wind_speed_10m}km/h</span>
                    <span className="text-xs text-gray-500">Wind</span>
                </div>
            </div>

            {/* Forecast Summary */}
            <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                <div className="flex justify-between">
                    <span>Today's Expected Rain:</span>
                    <span className="font-semibold">{maxRain.toFixed(1)}mm</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span>Max Wind Speed:</span>
                    <span className="font-semibold">{maxWind.toFixed(1)}km/h</span>
                </div>
            </div>
        </div>
    );
}
