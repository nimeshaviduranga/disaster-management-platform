// Gemini AI Service for Disaster Risk Analysis
// Uses Google Gemini API to provide intelligent weather risk assessments

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Cache to prevent rate limiting
let cachedAnalysis = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

/**
 * Analyze weather data using Gemini AI
 * @param {Object} weatherData - Weather data from Open-Meteo
 * @param {Array} recentIncidents - Recent SOS incidents for context
 * @returns {Promise<Object>} AI-generated risk analysis
 */
export async function analyzeWithAI(weatherData, recentIncidents = []) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn('Gemini API key not configured');
        return null;
    }

    // Return cached result if still valid
    const now = Date.now();
    if (cachedAnalysis && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached AI analysis');
        return cachedAnalysis;
    }

    const prompt = buildPrompt(weatherData, recentIncidents);

    try {
        console.log('Fetching fresh AI analysis...');
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn('Gemini API rate limit hit, using fallback');
                return cachedAnalysis; // Return old cache if available
            }
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            throw new Error('No response from Gemini');
        }

        const result = parseAIResponse(aiText);

        // Cache the result
        if (result) {
            cachedAnalysis = result;
            cacheTimestamp = now;
        }

        return result;
    } catch (error) {
        console.error('AI analysis failed:', error);
        return cachedAnalysis; // Return cached data on error
    }
}

/**
 * Build prompt for Gemini
 */
function buildPrompt(weatherData, recentIncidents) {
    const daily = weatherData?.daily || {};
    const forecastDays = [];

    for (let i = 0; i < Math.min(5, daily.time?.length || 0); i++) {
        forecastDays.push({
            date: daily.time[i],
            precipitation: daily.precipitation_sum?.[i] || 0,
            windSpeed: daily.wind_speed_10m_max?.[i] || 0
        });
    }

    const incidentSummary = recentIncidents.length > 0
        ? `Recent incidents (last 24h): ${recentIncidents.map(i => i.type).join(', ')}`
        : 'No recent incidents reported.';

    return `You are a disaster risk analyst for Sri Lanka. Analyze this weather data and provide risk assessment.

WEATHER FORECAST (Next 5 days):
${forecastDays.map(d => `- ${d.date}: Rain ${d.precipitation}mm, Wind ${d.windSpeed}km/h`).join('\n')}

${incidentSummary}

CONTEXT:
- Location: Colombo, Sri Lanka (Monsoon region)
- High flood risk area near Kelani River
- Landslide-prone hilly regions in Central Province
- DMC thresholds: Warning >75mm rain, Severe >150mm, Extreme >200mm

Respond ONLY in this JSON format:
{
  "overallRisk": "low|medium|high|critical",
  "riskScore": <number 0-100>,
  "primaryThreat": "<main threat type>",
  "alerts": [
    {
      "type": "flood|cyclone|landslide|heavy_rain|strong_wind",
      "severity": "warning|severe|extreme",
      "title": "<short title>",
      "message": "<actionable advice in 1-2 sentences>",
      "affectedAreas": ["<area names>"],
      "timeframe": "<when this risk is expected>"
    }
  ],
  "recommendations": ["<action item 1>", "<action item 2>"],
  "summary": "<2-3 sentence natural language summary of the situation>"
}`;
}

/**
 * Parse AI response and validate structure
 */
function parseAIResponse(aiText) {
    try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = aiText;
        const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());

        // Validate required fields
        if (!parsed.overallRisk || !parsed.alerts) {
            throw new Error('Invalid AI response structure');
        }

        // Add icons to alerts
        const iconMap = {
            flood: '🌊',
            cyclone: '🌀',
            landslide: '⛰️',
            heavy_rain: '⛈️',
            strong_wind: '💨'
        };

        parsed.alerts = parsed.alerts.map(alert => ({
            ...alert,
            icon: iconMap[alert.type] || '⚠️'
        }));

        parsed.isAI = true;
        return parsed;
    } catch (error) {
        console.error('Failed to parse AI response:', error);
        return null;
    }
}

export { buildPrompt };
