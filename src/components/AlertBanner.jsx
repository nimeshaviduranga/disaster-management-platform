import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { analyzeWeatherForAlerts } from '../services/weatherAlerts';
import { analyzeWithAI } from '../services/geminiAI';

export default function AlertBanner() {
    const [alerts, setAlerts] = useState([]);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    // Set to false to avoid rate limiting - change to true when ready
    const [useAI, setUseAI] = useState(false);

    // Colombo, Sri Lanka coordinates
    const LAT = 6.9271;
    const LNG = 79.8612;

    useEffect(() => {
        async function fetchWeatherAndAnalyze() {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&daily=precipitation_sum,wind_speed_10m_max&timezone=auto`
                );
                const weatherData = await response.json();

                // Try AI analysis first
                if (useAI) {
                    const aiResult = await analyzeWithAI(weatherData, []);
                    if (aiResult && aiResult.alerts && aiResult.alerts.length > 0) {
                        setAiAnalysis(aiResult);
                        setAlerts(aiResult.alerts);
                        setLoading(false);
                        return;
                    }
                }

                // Fallback to threshold-based analysis
                const thresholdAlerts = analyzeWeatherForAlerts(weatherData);
                setAlerts(thresholdAlerts);
                setAiAnalysis(null);
            } catch (error) {
                console.error("Failed to fetch weather for alerts:", error);
                setAlerts([]);
            } finally {
                setLoading(false);
            }
        }

        fetchWeatherAndAnalyze();
        // Refresh every 30 minutes
        const interval = setInterval(fetchWeatherAndAnalyze, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [useAI]);

    if (loading) return null;
    if (alerts.length === 0 || dismissed) return null;

    const severityColors = {
        extreme: 'bg-red-600 border-red-700',
        critical: 'bg-red-600 border-red-700',
        severe: 'bg-orange-500 border-orange-600',
        warning: 'bg-yellow-500 border-yellow-600',
        high: 'bg-orange-500 border-orange-600',
        medium: 'bg-yellow-500 border-yellow-600',
        low: 'bg-blue-500 border-blue-600'
    };

    const primaryAlert = alerts[0];
    const additionalAlerts = alerts.slice(1);
    const bannerColor = severityColors[primaryAlert.severity] || severityColors[aiAnalysis?.overallRisk] || 'bg-yellow-500';

    return (
        <div className={`${bannerColor} text-white border-b-2`}>
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{primaryAlert.icon}</span>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm uppercase tracking-wide">
                                    {primaryAlert.severity || aiAnalysis?.overallRisk} Alert
                                </span>
                                {aiAnalysis?.isAI && (
                                    <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-3 h-3" /> AI-Powered
                                    </span>
                                )}
                                <span className="text-white/80">•</span>
                                <span className="font-semibold">{primaryAlert.title}</span>
                            </div>
                            <p className="text-sm text-white/90 mt-0.5">{primaryAlert.message}</p>

                            {/* AI Summary */}
                            {aiAnalysis?.summary && (
                                <p className="text-sm text-white/80 mt-2 italic border-l-2 border-white/30 pl-2">
                                    {aiAnalysis.summary}
                                </p>
                            )}

                            {/* Recommendations */}
                            {aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0 && (
                                <div className="mt-2">
                                    <span className="text-xs font-semibold uppercase">Recommendations:</span>
                                    <ul className="text-sm text-white/90 mt-1 space-y-1">
                                        {aiAnalysis.recommendations.slice(0, 3).map((rec, i) => (
                                            <li key={i} className="flex items-start gap-1">
                                                <span>•</span> {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {additionalAlerts.length > 0 && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="flex items-center gap-1 text-sm text-white/80 hover:text-white mt-2"
                                >
                                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {additionalAlerts.length} more alert{additionalAlerts.length > 1 ? 's' : ''}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 hover:bg-white/20 rounded"
                            title="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {expanded && additionalAlerts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                        {additionalAlerts.map((alert, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                                <span>{alert.icon}</span>
                                <div>
                                    <span className="font-medium">{alert.title}:</span>{' '}
                                    <span className="text-white/90">{alert.message}</span>
                                    {alert.affectedAreas && (
                                        <span className="text-white/70 text-xs ml-1">
                                            ({alert.affectedAreas.join(', ')})
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Risk Score Bar */}
                {aiAnalysis?.riskScore !== undefined && (
                    <div className="mt-3 pt-2 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            <span className="text-xs">Risk Level:</span>
                            <div className="flex-1 bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white rounded-full h-2 transition-all"
                                    style={{ width: `${aiAnalysis.riskScore}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold">{aiAnalysis.riskScore}/100</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
