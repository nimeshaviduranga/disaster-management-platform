import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, Layers } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Available map styles
const MAP_STYLES = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    dark: 'mapbox://styles/mapbox/dark-v11'
};

export default function MapVisualizer({ incidents }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [currentStyle, setCurrentStyle] = useState('streets');
    const [showStylePicker, setShowStylePicker] = useState(false);

    useEffect(() => {
        if (map.current) return; // initialize map only once

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[currentStyle],
            center: [80.7718, 7.8731], // Center of Sri Lanka
            zoom: 7
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    }, []);

    // Handle style change
    const changeStyle = (styleName) => {
        if (map.current) {
            map.current.setStyle(MAP_STYLES[styleName]);
            setCurrentStyle(styleName);
            setShowStylePicker(false);
        }
    };

    useEffect(() => {
        if (!map.current || !incidents) return;

        // Wait for style to load before adding markers
        const addMarkers = () => {
            // Remove existing markers
            const markers = document.getElementsByClassName('mapboxgl-marker');
            while (markers[0]) {
                markers[0].remove();
            }

            incidents.forEach(incident => {
                if (incident.location) {
                    const { latitude, longitude } = incident.location;

                    // Color code based on type
                    const color = incident.type === 'medical' ? '#ef4444' :
                        incident.type === 'flood' ? '#3b82f6' :
                            incident.type === 'landslide' ? '#854d0e' : '#f97316';

                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

                    const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(
                        `<div class="p-2">
              <h3 class="font-bold capitalize text-gray-900 text-base">${incident.type}</h3>
              <p class="text-sm text-gray-700 mt-1">${incident.name || 'Unknown'}</p>
              <p class="text-xs text-gray-600">${incident.description}</p>
              <p class="text-xs text-gray-400 mt-1">${incident.timestamp?.seconds ? new Date(incident.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</p>
              ${incident.address ? `<p class="text-xs text-gray-500 mt-1 truncate">${incident.address}</p>` : ''}
              ${incident.phone ? `<p class="text-xs mt-1"><a href="tel:${incident.phone}" class="text-blue-600 hover:underline">📞 ${incident.phone}</a></p>` : ''}
              <a 
                href="${googleMapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                🧭 Navigate with Google Maps
              </a>
            </div>`
                    );

                    new mapboxgl.Marker({ color })
                        .setLngLat([longitude, latitude])
                        .setPopup(popup)
                        .addTo(map.current);
                }
            });
        };

        if (map.current.isStyleLoaded()) {
            addMarkers();
        } else {
            map.current.once('style.load', addMarkers);
        }
    }, [incidents, currentStyle]);

    return (
        <div className="relative h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <div ref={mapContainer} className="h-full w-full" />

            {/* Style Picker */}
            <div className="absolute top-2 left-2 z-10">
                <button
                    onClick={() => setShowStylePicker(!showStylePicker)}
                    className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                    title="Change map style"
                >
                    <Layers className="w-5 h-5 text-gray-700" />
                </button>

                {showStylePicker && (
                    <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg p-2 min-w-[140px]">
                        {Object.keys(MAP_STYLES).map(style => (
                            <button
                                key={style}
                                onClick={() => changeStyle(style)}
                                className={`w-full text-left px-3 py-2 rounded text-sm capitalize hover:bg-gray-100 ${currentStyle === style ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
