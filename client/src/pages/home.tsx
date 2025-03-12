import { useState } from "react";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";
import RecentConsultations from "@/components/RecentConsultations";
import ChatInterface from "@/components/ChatInterface";
import Footer from "@/components/Footer";
import { Message } from "@/lib/aiService";
import { nanoid } from "nanoid";

export default function Home() {
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

  // Mock user profile data (in a real app, this would come from authentication)
  const userProfile = {
    name: "John Davis",
    email: "john.davis@example.com",
    age: 34,
    bloodType: "O+",
    allergies: "Penicillin"
  };

  // Mock consultation history (in a real app, this would be fetched from API)
  const consultations = [
    { id: '1', title: "Respiratory Issue", date: "May 15, 2023", status: "Completed" },
    { id: '2', title: "Skin Rash Analysis", date: "April 28, 2023", status: "Completed" },
    { id: '3', title: "Headache Assessment", date: "March 12, 2023", status: "Completed" }
  ];

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
