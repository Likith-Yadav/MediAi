import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { currentUser, userProfile: firebaseUserProfile, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to landing page if not logged in
  useEffect(() => {
    if (!isLoading && !currentUser) {
      setLocation("/");
    }
  }, [isLoading, currentUser, setLocation]);

  // Return null during loading or if no user is found
  if (isLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // Use the Firebase user ID
  const userId = currentUser?.uid;

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

  // Query consultations from Firebase (temporarily using mock data until Firebase collection is ready)
  const { data: consultations = [], isLoading: isLoadingConsultations } = useConsultations(userId);

  // Map Firebase user to UI format
  const uiProfile = {
    name: firebaseUserProfile?.name || "User",
    email: firebaseUserProfile?.email || "",
    age: firebaseUserProfile?.age || 0,
    bloodType: firebaseUserProfile?.bloodType || "Unknown",
    allergies: firebaseUserProfile?.allergies || "None"
  } as User;

  if (isLoadingConsultations) {
    return <div className="flex items-center justify-center min-h-screen">Loading data...</div>;
  }

  // Convert Firebase consultations to the expected format
  const formattedConsultations: Consultation[] = consultations.map(c => ({
    id: c.id,
    title: c.title,
    status: c.status,
    date: c.date instanceof Date ? c.date.toISOString().split('T')[0] : String(c.date)
  }));

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col text-slate-800">
      <Header user={uiProfile} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserProfile user={uiProfile} />
            <RecentConsultations consultations={formattedConsultations} />
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