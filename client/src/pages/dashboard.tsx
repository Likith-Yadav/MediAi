import React from "react";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";
import RecentConsultations from "@/components/RecentConsultations";
import ChatInterface from "@/components/ChatInterface";
import Footer from "@/components/Footer";
import { Message } from "@/lib/aiService";
import { Consultation } from "@/lib/types";
import { nanoid } from "nanoid";
import { useLocation } from "wouter";
import { useConsultations } from "@/hooks/useFirebase";
import { useAuth } from "@/hooks/useAuth";
import { FirebaseConsultation } from "@/lib/firebase";

// Create a welcome message that doesn't change on each render
const initialWelcomeMessage = {
  id: "welcome-message",
  content: "Hello! I'm your MediAI Assistant. How can I help you today?\n\nYou can describe your symptoms via text, use speech-to-text, or upload relevant medical images for analysis.",
  role: "assistant",
  timestamp: new Date()
} as Message;

function DashboardContent({
  userProfile,
  consultations,
  messages,
  addMessage,
  updateMessage,
  clearConversation
}: {
  userProfile: any;
  consultations: FirebaseConsultation[];
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearConversation: () => void;
}) {
  // Format consultations for display
  const formattedConsultations: Consultation[] = consultations.map(c => ({
    id: c.id,
    title: c.title,
    status: c.status,
    date: c.date instanceof Date ? c.date.toISOString().split('T')[0] : String(c.date)
  }));
  
  // Create header user object
  const headerUser = {
    name: userProfile?.name || "User",
    email: userProfile?.email || ""
  };
  
  return (
    <div className="bg-slate-100 min-h-screen flex flex-col text-slate-800">
      <Header user={headerUser} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserProfile user={userProfile || {}} />
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

export default function Dashboard() {
  // Authentication related hooks
  const { currentUser, userProfile, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Chat related state - using a function initializer to prevent recreation on each render
  const [messages, setMessages] = React.useState<Message[]>(() => [initialWelcomeMessage]);
  
  // Always fetch consultations, we'll use the result only when needed
  const { data: consultations = [], isLoading: isLoadingConsultations } = useConsultations(
    currentUser?.uid
  );
  
  // Redirect to landing page if not logged in
  React.useEffect(() => {
    if (!isLoading && !currentUser) {
      setLocation("/");
    }
  }, [isLoading, currentUser, setLocation]);
  
  // Message handling functions
  const addMessage = React.useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);
  
  const updateMessage = React.useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg));
  }, []);
  
  const clearConversation = React.useCallback(() => {
    setMessages([initialWelcomeMessage]);
  }, []);
  
  // Show loading state if authentication is still loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // Redirect if no user is logged in
  if (!currentUser) {
    // We already have the useEffect at the top that handles redirection
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }
  
  // Show loading state while consultations are being fetched
  if (isLoadingConsultations) {
    return <div className="flex items-center justify-center min-h-screen">Loading data...</div>;
  }
  
  // Render the dashboard content
  return (
    <DashboardContent
      userProfile={userProfile}
      consultations={consultations}
      messages={messages}
      addMessage={addMessage}
      updateMessage={updateMessage}
      clearConversation={clearConversation}
    />
  );
}