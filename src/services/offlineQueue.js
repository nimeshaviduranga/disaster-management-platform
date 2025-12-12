// Offline SOS Queue Service
// Stores SOS requests locally when offline and syncs when back online

const QUEUE_KEY = 'rescuehq_offline_queue';

/**
 * Get all queued SOS requests
 */
export function getQueuedRequests() {
    try {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Add an SOS request to the offline queue
 */
export function addToQueue(sosData) {
    const queue = getQueuedRequests();
    const queueItem = {
        ...sosData,
        id: `offline_${Date.now()}`,
        queuedAt: new Date().toISOString(),
        synced: false
    };
    queue.push(queueItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('SOS request queued for later sync:', queueItem);
    return queueItem;
}

/**
 * Remove a request from the queue (after successful sync)
 */
export function removeFromQueue(id) {
    const queue = getQueuedRequests();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Clear all queued requests
 */
export function clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
}

/**
 * Sync all queued requests to Firebase
 */
export async function syncQueuedRequests(addDoc, collection, db, auth) {
    const queue = getQueuedRequests();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        try {
            const docData = {
                userId: auth?.currentUser?.uid || 'anonymous',
                name: item.name,
                phone: item.phone,
                type: item.type,
                description: item.description,
                location: item.location,
                address: item.address || '',
                imageUrl: item.imageUrl || '',
                status: 'pending',
                timestamp: new Date(),
                offlineQueued: true,
                originalQueuedAt: item.queuedAt
            };

            await addDoc(collection(db, 'incidents'), docData);
            removeFromQueue(item.id);
            synced++;
            console.log('Synced offline SOS:', item.id);
        } catch (error) {
            console.error('Failed to sync SOS:', item.id, error);
            failed++;
        }
    }

    return { synced, failed };
}

/**
 * Check if we should use offline queue
 */
export function isOffline() {
    return !navigator.onLine;
}

/**
 * Register sync event for background sync (if supported)
 */
export async function registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.SyncManager) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-sos-queue');
            console.log('Background sync registered');
        } catch (error) {
            console.log('Background sync not supported:', error);
        }
    }
}
