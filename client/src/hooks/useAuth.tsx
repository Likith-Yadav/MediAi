import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseAuthUser
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { FirebaseUser } from "@/lib/firebase";

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

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as FirebaseUser);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      
      const newUserProfile: FirebaseUser = {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: new Date(),
      };
      
      await setDoc(userDocRef, newUserProfile);
      setUserProfile(newUserProfile);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if the user already exists in Firestore, if not create a profile
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user profile
        const newUserProfile: FirebaseUser = {
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email || "",
          createdAt: new Date(),
        };
        
        await setDoc(userDocRef, newUserProfile);
        setUserProfile(newUserProfile);
      } else {
        setUserProfile(userDoc.data() as FirebaseUser);
      }
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<FirebaseUser>): Promise<void> => {
    if (!currentUser) throw new Error("No user logged in");
    
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, data, { merge: true });
    
    // Update local state
    if (userProfile) {
      const updatedProfile = { ...userProfile, ...data };
      setUserProfile(updatedProfile);
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
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};