// Mapbox Geocoding Service
// Converts coordinates to human-readable addresses (Reverse Geocoding)

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Convert latitude/longitude to a human-readable address
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{address: string, place: string, district: string, country: string}>}
 */
export async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,place,locality,district`
        );

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];

            // Extract context information
            const context = feature.context || [];
            const place = context.find(c => c.id.startsWith('place'))?.text || '';
            const district = context.find(c => c.id.startsWith('district'))?.text || '';
            const country = context.find(c => c.id.startsWith('country'))?.text || '';

            return {
                address: feature.place_name || `${latitude}, ${longitude}`,
                place,
                district,
                country,
                shortAddress: feature.text || place || district
            };
        }

        return { address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return { address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
    }
}

/**
 * Get a short, readable location name
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>}
 */
export async function getLocationName(latitude, longitude) {
    const result = await reverseGeocode(latitude, longitude);
    return result.shortAddress || result.address;
}
