import { useState } from "react";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";
import RecentConsultations from "@/components/RecentConsultations";
import ChatInterface from "@/components/ChatInterface";
import Footer from "@/components/Footer";
import { Message } from "@/lib/aiService";
import { User, Consultation } from "@/lib/types";
import { nanoid } from "nanoid";
import { useLocation } from "wouter";
import { useUserProfile, useConsultations } from "@/hooks/useFirebase";

// Dynamically check if Clerk is available
const hasClerkAuth = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Only import Clerk components if we have the key
let useUser: any = () => ({ user: null, isLoaded: true, isSignedIn: true });

if (hasClerkAuth) {
  // This code will only run if VITE_CLERK_PUBLISHABLE_KEY exists
  const ClerkImports = require("@clerk/clerk-react");
  useUser = ClerkImports.useUser;
}

export default function Dashboard() {
  // Conditionally use Clerk auth if available
  const hasClerkAuth = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const clerkAuth = hasClerkAuth ? useUser() : { user: null, isLoaded: true, isSignedIn: true };
  const { user, isLoaded, isSignedIn } = clerkAuth;
  const [, setLocation] = useLocation();

  // Only redirect if Clerk auth is enabled and user is not signed in
  if (hasClerkAuth && isLoaded && !isSignedIn) {
    setLocation("/");
    return null;
  }
  
  // Generate a demo user ID if not authenticated via Clerk
  const userId = user?.id || "demo-user-123";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: nanoid(),
      content: "Hello! I'm your MediAI Assistant. How can I help you today?\n\nYou can describe your symptoms via text, use speech-to-text, or upload relevant medical images for analysis.",
      role: "assistant",
      timestamp: new Date()
    }
  ]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg)
    );
  };

  const clearConversation = () => {
    setMessages([
      {
        id: nanoid(),
        content: "Hello! I'm your MediAI Assistant. How can I help you today?\n\nYou can describe your symptoms via text, use speech-to-text, or upload relevant medical images for analysis.",
        role: "assistant",
        timestamp: new Date()
      }
    ]);
  };

  // Query user profile and consultations from Firebase
  const { data: firebaseProfile, isLoading: isLoadingProfile } = useUserProfile(user?.id);
  const { data: consultations = [], isLoading: isLoadingConsultations } = useConsultations(user?.id);

  // Map Firebase user to UI user
  const userProfile = firebaseProfile ? {
    name: firebaseProfile.name,
    email: firebaseProfile.email,
    age: firebaseProfile.age || 0,
    bloodType: firebaseProfile.bloodType || "Unknown",
    allergies: firebaseProfile.allergies || "None"
  } : null;

  if (!isLoaded || isLoadingProfile || isLoadingConsultations || !userProfile || !consultations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col text-slate-800">
      <Header user={userProfile} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserProfile user={userProfile} />
            <RecentConsultations consultations={consultations} />
          </div>
          
          <div className="lg:col-span-2 flex flex-col">
            <ChatInterface 
              messages={messages}
              addMessage={addMessage}
              updateMessage={updateMessage}
              clearConversation={clearConversation}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}