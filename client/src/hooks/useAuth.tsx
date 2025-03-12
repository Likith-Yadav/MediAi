import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  auth, 
  googleProvider, 
  db,
  usersCollection,
  FirebaseUser
} from '@/lib/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseAuthUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextProps {
  currentUser: FirebaseAuthUser | null;
  userProfile: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<FirebaseUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch or create user profile
        const userRef = doc(db, usersCollection, user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as FirebaseUser);
        } else {
          // Create default profile
          const newUserProfile: FirebaseUser = {
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            createdAt: new Date()
          };
          
          await setDoc(userRef, newUserProfile);
          setUserProfile(newUserProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const userRef = doc(db, usersCollection, result.user.uid);
      const newUserProfile: FirebaseUser = {
        uid: result.user.uid,
        name,
        email,
        createdAt: new Date()
      };
      
      await setDoc(userRef, newUserProfile);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists
      const userRef = doc(db, usersCollection, user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create user profile
        const newUserProfile: FirebaseUser = {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          createdAt: new Date()
        };
        
        await setDoc(userRef, newUserProfile);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<FirebaseUser>) => {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      const userRef = doc(db, usersCollection, currentUser.uid);
      await setDoc(userRef, data, { merge: true });
      
      // Update local state
      if (userProfile) {
        setUserProfile({ ...userProfile, ...data });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    currentUser,
    userProfile,
    isLoading,
    login,
    signUp,
    loginWithGoogle,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};