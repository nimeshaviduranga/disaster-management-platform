import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log config for debugging (remove in production)
console.log("Firebase Config Loaded:", {
    apiKey: firebaseConfig.apiKey ? "✓ Set" : "✗ Missing",
    authDomain: firebaseConfig.authDomain ? "✓ Set" : "✗ Missing",
    projectId: firebaseConfig.projectId ? "✓ Set" : "✗ Missing",
    storageBucket: firebaseConfig.storageBucket ? "✓ Set" : "✗ Missing",
    messagingSenderId: firebaseConfig.messagingSenderId ? "✓ Set" : "✗ Missing",
    appId: firebaseConfig.appId ? "✓ Set" : "✗ Missing",
});

let app, db, storage, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { db, storage, auth };
export default app;
