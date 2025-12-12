import React from 'react';
import { Phone, Clock, MapPin, Navigation, ExternalLink } from 'lucide-react';

export default function IncidentCard({ incident }) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800'
    };

    const typeColors = {
        flood: 'border-blue-500 bg-blue-50',
        landslide: 'border-brown-500 bg-orange-50',
        medical: 'border-red-500 bg-red-50',
        default: 'border-gray-500 bg-gray-50'
    };

    return (
        <div className={`p-4 rounded-lg border-l-4 shadow-sm bg-white mb-4 ${typeColors[incident.type] || typeColors.default}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[incident.status] || 'bg-gray-100'}`}>
                        {incident.status}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 flex items-center inline-flex">
                        <Clock className="w-3 h-3 mr-1" />
                        {incident.timestamp?.seconds ? new Date(incident.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now'}
                    </span>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {incident.type}
                </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{incident.name}</h3>
            <p className="text-gray-700 text-sm mb-3">{incident.description}</p>

            {incident.imageUrl && (
                <div className="mb-3">
                    <img src={incident.imageUrl} alt="Evidence" className="h-32 w-full object-cover rounded-md" />
                </div>
            )}

            <div className="flex flex-col gap-1 text-sm text-gray-600">
                <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <a href={`tel:${incident.phone}`} className="hover:underline">{incident.phone}</a>
                </div>
                {incident.location && (
                    <div className="flex flex-col gap-1">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${incident.location.latitude},${incident.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                            <Navigation className="w-4 h-4 mr-2" />
                            Navigate to Location
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        {incident.address && (
                            <p className="text-xs text-gray-500 ml-6 truncate" title={incident.address}>
                                {incident.address}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 ml-6">
                            ({incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)})
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
