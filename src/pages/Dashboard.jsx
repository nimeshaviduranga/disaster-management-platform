import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import MapVisualizer from '../components/MapVisualizer';
import IncidentCard from '../components/IncidentCard';
import WeatherWidget from '../components/WeatherWidget';
import AlertBanner from '../components/AlertBanner';
import { Link } from 'react-router-dom';
import { AlertTriangle, Filter, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
    const [incidents, setIncidents] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIncidents(data);
        });
        return () => unsubscribe();
    }, []);

    const filteredIncidents = filter === 'all'
        ? incidents
        : incidents.filter(i => i.type === filter);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Predictive Alert Banner */}
            <AlertBanner />
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">RescueHQ</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/admin"
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ShieldCheck className="w-4 h-4" /> Admin
                        </Link>
                        <Link
                            to="/sos"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 animate-pulse"
                        >
                            REPORT SOS
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats & Map */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats & Weather Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <WeatherWidget />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                                    <span className="block text-3xl font-bold text-red-600">{incidents.length}</span>
                                    <span className="text-sm text-gray-500">Active Incidents</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                                    <span className="block text-3xl font-bold text-blue-600">{incidents.filter(i => i.type === 'flood').length}</span>
                                    <span className="text-sm text-gray-500">Flood Reports</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Live Incident Map</h2>
                            <MapVisualizer incidents={filteredIncidents} />
                        </div>
                    </div>

                    {/* Right Column: Feed */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-8rem)] flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-800">Incoming Alerts</h2>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="border-none bg-transparent focus:ring-0 text-sm p-0 text-gray-600 font-medium cursor-pointer"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="flood">Floods</option>
                                        <option value="landslide">Landslides</option>
                                        <option value="medical">Medical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {filteredIncidents.length === 0 ? (
                                    <p className="text-center text-gray-400 mt-10">No active incidents reported.</p>
                                ) : (
                                    filteredIncidents.map(incident => (
                                        <IncidentCard key={incident.id} incident={incident} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
