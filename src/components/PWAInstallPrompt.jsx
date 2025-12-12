import React, { useEffect, useState } from 'react';
import { Download, X, Wifi, WifiOff } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);

    useEffect(() => {
        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowInstallPrompt(true);
            }
        };

        // Listen for online/offline status
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineBanner(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        if (!navigator.onLine) {
            setIsOnline(false);
            setShowOfflineBanner(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('PWA installed');
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    return (
        <>
            {/* Offline Banner */}
            {showOfflineBanner && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 z-50 flex items-center justify-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
                    <button
                        onClick={() => setShowOfflineBanner(false)}
                        className="ml-2 p-1 hover:bg-yellow-600 rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Install Prompt */}
            {showInstallPrompt && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 text-white rounded-xl shadow-2xl p-4 z-50 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <Download className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">Install RescueHQ</h3>
                            <p className="text-gray-300 text-sm mt-1">
                                Add to your home screen for quick access during emergencies, even offline!
                            </p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleInstallClick}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    Install App
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Online status indicator (small) */}
            {isOnline && !showOfflineBanner && (
                <div className="fixed bottom-4 right-4 z-40 opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                        <Wifi className="w-3 h-3" />
                        <span>Online</span>
                    </div>
                </div>
            )}
        </>
    );
}
