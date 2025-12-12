import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
    ShieldCheck, LogOut, RefreshCw, Clock, CheckCircle2,
    AlertTriangle, Phone, MapPin, Navigation, ExternalLink,
    Filter, Search, Trash2
} from 'lucide-react';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [incidents, setIncidents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user && !user.isAnonymous) {
                setUser(user);
                setLoading(false);
            } else {
                navigate('/admin/login');
            }
        });

        return () => unsubAuth();
    }, [navigate]);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIncidents(data);
        });

        return () => unsubscribe();
    }, [user]);

    const handleStatusUpdate = async (incidentId, newStatus) => {
        try {
            await updateDoc(doc(db, "incidents", incidentId), {
                status: newStatus,
                updatedAt: new Date(),
                updatedBy: user.email
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (incidentId, incidentName) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the incident for "${incidentName}"?\n\nThis action cannot be undone.`
        );
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, "incidents", incidentId));
            console.log('Incident deleted:', incidentId);
        } catch (error) {
            console.error("Error deleting incident:", error);
            alert("Failed to delete incident: " + error.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin/login');
    };

    const filteredIncidents = incidents
        .filter(i => filter === 'all' || i.status === filter)
        .filter(i =>
            searchTerm === '' ||
            i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.phone?.includes(searchTerm) ||
            i.address?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const statusCounts = {
        pending: incidents.filter(i => i.status === 'pending').length,
        'in-progress': incidents.filter(i => i.status === 'in-progress').length,
        completed: incidents.filter(i => i.status === 'completed').length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <RefreshCw className="animate-spin w-8 h-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-slate-900 text-white sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                        <div>
                            <h1 className="font-bold text-lg">Admin Dashboard</h1>
                            <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm text-slate-300 hover:text-white">
                            View Public Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            All ({incidents.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}
                        >
                            <Clock className="w-4 h-4" /> Pending ({statusCounts.pending})
                        </button>
                        <button
                            onClick={() => setFilter('in-progress')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                        >
                            <RefreshCw className="w-4 h-4" /> In Progress ({statusCounts['in-progress']})
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        >
                            <CheckCircle2 className="w-4 h-4" /> Completed ({statusCounts.completed})
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Incidents Table */}
            <div className="max-w-7xl mx-auto px-4 pb-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Victim</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                        No incidents found
                                    </td>
                                </tr>
                            ) : (
                                filteredIncidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {incident.timestamp?.seconds
                                                ? new Date(incident.timestamp.seconds * 1000).toLocaleString()
                                                : 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize
                        ${incident.type === 'flood' ? 'bg-blue-100 text-blue-700' : ''}
                        ${incident.type === 'landslide' ? 'bg-orange-100 text-orange-700' : ''}
                        ${incident.type === 'medical' ? 'bg-red-100 text-red-700' : ''}
                        ${incident.type === 'trapped' ? 'bg-purple-100 text-purple-700' : ''}
                      `}>
                                                {incident.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{incident.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                <a href={`tel:${incident.phone}`} className="hover:underline">{incident.phone}</a>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {incident.location && (
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.location.latitude},${incident.location.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                                >
                                                    <Navigation className="w-3 h-3" />
                                                    Navigate
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                            {incident.address && (
                                                <p className="text-xs text-gray-500 truncate max-w-xs" title={incident.address}>
                                                    {incident.address}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize
                        ${incident.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${incident.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : ''}
                        ${incident.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                      `}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {incident.status !== 'in-progress' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(incident.id, 'in-progress')}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                                {incident.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(incident.id, 'completed')}
                                                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {incident.status !== 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(incident.id, 'pending')}
                                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                                {incident.status === 'completed' && (
                                                    <button
                                                        onClick={() => handleDelete(incident.id, incident.name)}
                                                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                                                        title="Delete incident"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
