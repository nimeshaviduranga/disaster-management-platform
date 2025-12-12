import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MapPin, Camera, AlertTriangle, Loader2, ShieldCheck, Navigation, WifiOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { reverseGeocode } from '../services/geocoding';
import { addToQueue, isOffline } from '../services/offlineQueue';

export default function SOSForm() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [offline, setOffline] = useState(!navigator.onLine);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        type: 'flood',
        description: '',
        image: null
    });

    // Listen for online/offline changes
    useEffect(() => {
        const handleOnline = () => setOffline(false);
        const handleOffline = () => setOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Show loading while authenticating
    if (authLoading) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 m-4 text-center">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-red-600" />
                <p className="mt-2 text-gray-600">Initializing secure connection...</p>
            </div>
        );
    }

    const getLocation = () => {
        if (navigator.geolocation) {
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setLocation(coords);

                    // Get human-readable address
                    try {
                        const geoResult = await reverseGeocode(coords.latitude, coords.longitude);
                        setAddress(geoResult.address);
                    } catch (err) {
                        console.error('Address lookup failed:', err);
                        setAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
                    }
                    setLocationLoading(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to retrieve your location.");
                    setLocationLoading(false);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log("Starting SOS submission...");

        const sosData = {
            name: formData.name,
            phone: formData.phone,
            type: formData.type,
            description: formData.description,
            location: location,
            address: address
        };

        // If offline, queue the request
        if (isOffline()) {
            console.log("Offline mode: Queuing SOS request");
            addToQueue(sosData);
            alert("You're offline! Your SOS request has been saved and will be sent automatically when you're back online.");
            setFormData({ name: '', phone: '', type: 'flood', description: '', image: null });
            setLocation(null);
            navigate('/');
            setLoading(false);
            return;
        }

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Submission timed out after 15 seconds")), 15000)
        );

        try {
            let imageUrl = '';
            if (formData.image) {
                console.log("Uploading image...");
                const storageRef = ref(storage, `sos-images/${Date.now()}_${formData.image.name}`);
                const snapshot = await uploadBytes(storageRef, formData.image);
                imageUrl = await getDownloadURL(snapshot.ref);
                console.log("Image uploaded:", imageUrl);
            }

            const docData = {
                userId: user?.uid || 'anonymous',
                ...sosData,
                imageUrl,
                status: 'pending',
                timestamp: serverTimestamp()
            };
            console.log("Submitting to Firestore:", docData);

            // Race between submission and timeout
            const docRef = await Promise.race([
                addDoc(collection(db, "incidents"), docData),
                timeoutPromise
            ]);

            console.log("SOS submitted successfully with ID:", docRef.id);
            alert("SOS Request Sent! Help is on the way.");
            setFormData({ name: '', phone: '', type: 'flood', description: '', image: null });
            setLocation(null);
            navigate('/');

        } catch (error) {
            console.error("Error submitting SOS:", error);

            // If network error, queue the request
            if (error.message.includes("network") || error.code === 'unavailable') {
                console.log("Network error: Queuing SOS request");
                addToQueue(sosData);
                alert("Network issue! Your SOS request has been saved and will be sent when connection is restored.");
            } else if (error.message.includes("timed out")) {
                alert("Submission is taking too long. Your request may still be saved. Please check the dashboard.");
            } else {
                alert("Failed to send request: " + error.message);
            }
        } finally {
            setLoading(false);
            console.log("Submission process completed");
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 border border-red-100">
            <div className="p-8">
                <div className="flex items-center mb-6 text-red-600">
                    <AlertTriangle className="w-8 h-8 mr-2" />
                    <h2 className="text-2xl font-bold">Emergency SOS</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            type="tel"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="flood">Flood</option>
                            <option value="landslide">Landslide</option>
                            <option value="trapped">Trapped / Stranded</option>
                            <option value="medical">Medical Emergency</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description / Details</label>
                        <textarea
                            required
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                            placeholder="Describe the situation clearly..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={getLocation}
                                disabled={locationLoading}
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {locationLoading ? (
                                    <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Getting Location...</>
                                ) : (
                                    <><MapPin className="w-4 h-4 mr-2" /> {location ? 'Update Location' : 'Get GPS Location'}</>
                                )}
                            </button>
                        </div>
                        {location && (
                            <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                                <p className="text-sm text-green-700 font-medium">📍 Location Captured</p>
                                {address && <p className="text-xs text-green-600 truncate">{address}</p>}
                                <p className="text-xs text-gray-500">
                                    ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                                </p>
                            </div>
                        )}
                        {!location && <p className="text-xs text-red-500 mt-1">* Location is critical for rescue</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Camera className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                />
                            </label>
                        </div>
                        {formData.image && <p className="text-sm text-gray-600 mt-1">Selected: {formData.image.name}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Sending Alert...</>
                        ) : (
                            'SEND SOS ALERT'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
