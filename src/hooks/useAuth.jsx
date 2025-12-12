import { auth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setLoading(false);
            } else {
                // Sign in anonymously if not authenticated
                signInAnonymously(auth)
                    .then((result) => {
                        setUser(result.user);
                        console.log("Signed in anonymously:", result.user.uid);
                    })
                    .catch((error) => {
                        console.error("Anonymous auth failed:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
