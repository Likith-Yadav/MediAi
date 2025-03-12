
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { isFirebaseConfigured } from '../lib/firebase';

// Define the auth context type
interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);

  // Initialize Firebase when the component mounts
  useEffect(() => {
    if (isFirebaseConfigured()) {
      try {
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
        
        // Initialize Firebase
        const firebaseApp = initializeApp(firebaseConfig);
        setApp(firebaseApp);
        
        // Initialize Firebase Auth
        const firebaseAuth = getAuth(firebaseApp);
        setAuth(firebaseAuth);
        
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
          setUser(currentUser);
          setIsLoading(false);
        });
        
        console.log("Firebase successfully initialized");
        
        // Clean up the listener when the component unmounts
        return () => unsubscribe();
      } catch (err) {
        console.error("Error initializing Firebase:", err);
        setError("Failed to initialize authentication");
        setIsLoading(false);
      }
    } else {
      setError("Firebase is not properly configured");
      setIsLoading(false);
    }
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's profile with their name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      setUser(userCredential.user);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to sign up");
      throw err;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
      throw err;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error("Sign out error:", err);
      setError(err.message || "Failed to sign out");
      throw err;
    }
  };

  // Update user profile function
  const updateUserProfile = async (name: string) => {
    if (!user) {
      setError("No user is logged in");
      return;
    }
    
    try {
      await updateProfile(user, {
        displayName: name
      });
      // Update the local user state to reflect changes
      setUser({ ...user });
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
      throw err;
    }
  };

  // Create the auth context value
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    updateUserProfile
  };

  // Return the auth provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Create the useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
