// Weather Alert Service
// Generates predictive alerts based on weather thresholds

import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';

// Alert thresholds based on Sri Lanka DMC guidelines
const THRESHOLDS = {
    rainfall: {
        warning: 75,      // mm in 24hrs - Yellow warning
        severe: 150,      // mm in 24hrs - Orange warning  
        extreme: 200      // mm in 24hrs - Red warning
    },
    wind: {
        warning: 50,      // km/h - Strong wind warning
        severe: 75,       // km/h - Gale warning
        extreme: 100      // km/h - Storm warning
    }
};

const ALERT_TYPES = {
    FLOOD_RISK: 'flood_risk',
    CYCLONE_RISK: 'cyclone_risk',
    LANDSLIDE_RISK: 'landslide_risk',
    HEAVY_RAIN: 'heavy_rain',
    STRONG_WIND: 'strong_wind'
};

/**
 * Analyze weather data and generate alerts
 * @param {Object} weatherData - Data from Open-Meteo API
 * @returns {Array} Array of alert objects
 */
export function analyzeWeatherForAlerts(weatherData) {
    const alerts = [];

    if (!weatherData || !weatherData.daily) return alerts;

    const daily = weatherData.daily;
    const currentDate = new Date().toISOString().split('T')[0];

    // Check next 3 days for weather risks
    for (let i = 0; i < Math.min(3, daily.time?.length || 0); i++) {
        const date = daily.time[i];
        const precipitation = daily.precipitation_sum?.[i] || 0;
        const windSpeed = daily.wind_speed_10m_max?.[i] || 0;

        // Rainfall alerts
        if (precipitation >= THRESHOLDS.rainfall.extreme) {
            alerts.push({
                type: ALERT_TYPES.FLOOD_RISK,
                severity: 'extreme',
                title: 'Extreme Flood Risk',
                message: `Expected rainfall of ${precipitation.toFixed(0)}mm on ${formatDate(date)}. Evacuate low-lying areas immediately.`,
                date,
                value: precipitation,
                icon: '🌊'
            });
        } else if (precipitation >= THRESHOLDS.rainfall.severe) {
            alerts.push({
                type: ALERT_TYPES.HEAVY_RAIN,
                severity: 'severe',
                title: 'Heavy Rainfall Warning',
                message: `Expected rainfall of ${precipitation.toFixed(0)}mm on ${formatDate(date)}. Flash floods likely.`,
                date,
                value: precipitation,
                icon: '⛈️'
            });
        } else if (precipitation >= THRESHOLDS.rainfall.warning) {
            alerts.push({
                type: ALERT_TYPES.HEAVY_RAIN,
                severity: 'warning',
                title: 'Rainfall Advisory',
                message: `Moderate rainfall of ${precipitation.toFixed(0)}mm expected on ${formatDate(date)}.`,
                date,
                value: precipitation,
                icon: '🌧️'
            });
        }

        // Wind alerts
        if (windSpeed >= THRESHOLDS.wind.extreme) {
            alerts.push({
                type: ALERT_TYPES.CYCLONE_RISK,
                severity: 'extreme',
                title: 'Cyclone/Storm Warning',
                message: `Wind speeds up to ${windSpeed.toFixed(0)}km/h expected on ${formatDate(date)}. Stay indoors.`,
                date,
                value: windSpeed,
                icon: '🌀'
            });
        } else if (windSpeed >= THRESHOLDS.wind.severe) {
            alerts.push({
                type: ALERT_TYPES.STRONG_WIND,
                severity: 'severe',
                title: 'Gale Force Wind Warning',
                message: `Strong winds up to ${windSpeed.toFixed(0)}km/h on ${formatDate(date)}.`,
                date,
                value: windSpeed,
                icon: '💨'
            });
        }

        // Combined risk: Heavy rain + steep terrain = Landslide risk
        if (precipitation >= THRESHOLDS.rainfall.severe) {
            alerts.push({
                type: ALERT_TYPES.LANDSLIDE_RISK,
                severity: 'severe',
                title: 'Landslide Risk',
                message: `High landslide risk in hilly areas on ${formatDate(date)} due to heavy rainfall.`,
                date,
                value: precipitation,
                icon: '⛰️'
            });
        }
    }

    // Sort by severity (extreme first)
    const severityOrder = { extreme: 0, severe: 1, warning: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
}

/**
 * Save alert to Firestore
 */
export async function saveAlert(alert) {
    try {
        await addDoc(collection(db, "alerts"), {
            ...alert,
            createdAt: serverTimestamp(),
            isActive: true
        });
    } catch (error) {
        console.error("Error saving alert:", error);
    }
}

/**
 * Get active alerts from Firestore
 */
export async function getActiveAlerts() {
    try {
        const q = query(
            collection(db, "alerts"),
            where("isActive", "==", true),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching alerts:", error);
        return [];
    }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export { THRESHOLDS, ALERT_TYPES };
