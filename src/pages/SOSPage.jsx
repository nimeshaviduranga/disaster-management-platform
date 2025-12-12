import React from 'react';
import SOSForm from '../components/SOSForm';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function SOSPage() {
    return (
        <div className="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto mb-6">
                <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
            </div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-red-700 tracking-tight">EMERGENCY SOS</h1>
                <p className="mt-2 text-lg text-red-600">
                    Only use for life-threatening emergencies. Rescuers will be dispatched to your location.
                </p>
            </div>
            <SOSForm />
        </div>
    );
}
