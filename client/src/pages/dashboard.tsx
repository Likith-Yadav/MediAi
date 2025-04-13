import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";
import RecentConsultations from "@/components/RecentConsultations";
import MedicalChat from "@/components/MedicalChat";
import Footer from "@/components/Footer";
import { useConsultations } from "@/hooks/useFirebase";
import { Consultation } from "@/lib/types";
import AuroraUI from "@/components/AuroraUI";
import GuidedTour from "@/components/GuidedTour";

function DashboardContent({
  userProfile,
  consultations,
}: {
  userProfile: any;
  consultations: Consultation[];
}) {
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showTour, setShowTour] = useState(false);

  const handleSelectChat = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
  };

  const headerUser = {
    name: userProfile?.name || "User",
    email: userProfile?.email || "",
    profileImage: userProfile?.photoURL || undefined
  };

  return (
    <AuroraUI>
      <GuidedTour forceStart={showTour} />
      <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <Header 
          user={headerUser} 
          onStartTour={() => setShowTour(true)}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-purple-500/5 border border-white/20 user-profile-section">
                <UserProfile user={userProfile || {}} />
              </div>
              
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-purple-500/5 border border-white/20 recent-consultations">
                <RecentConsultations 
                  consultations={consultations} 
                  onSelectChat={handleSelectChat}
                />
              </div>
            </div>
            
            {/* Right Column - Chat Area */}
            <div className="lg:col-span-2">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-purple-500/5 border border-white/20 min-h-[calc(100vh-12rem)] chat-interface">
                <MedicalChat selectedConsultation={selectedConsultation} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuroraUI>
  );
}

// Add this helper function at the top of the file
const formatArrayField = (field: any): string => {
  if (!field) return '';
  if (Array.isArray(field)) return field.join(', ');
  if (typeof field === 'string') return field;
  return '';
};

export default function Dashboard() {
  const { currentUser, userProfile, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: consultations = [], isLoading: isLoadingConsultations } = useConsultations(
    currentUser?.uid
  );
  
  // Format consultations for display
  const formattedConsultations: Consultation[] = consultations.map(c => ({
    id: c.id,
    chatId: c.id, // Use the same ID for chatId
    title: c.title,
    date: c.date instanceof Date ? c.date : new Date(c.date),
    status: c.status === 'ongoing' ? 'active' : 'completed',
    userId: currentUser?.uid || '',
    messages: [], // Initialize with empty messages array
    symptoms: formatArrayField(c.symptoms),
    diagnosis: c.diagnosis || '',
    recommendations: formatArrayField(c.recommendations)
  }));
  
  React.useEffect(() => {
    if (!isLoading && !currentUser) {
      setLocation("/");
    }
  }, [isLoading, currentUser, setLocation]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }
  
  if (isLoadingConsultations) {
    return <div className="flex items-center justify-center min-h-screen">Loading data...</div>;
  }
  
  return (
    <DashboardContent
      userProfile={userProfile}
      consultations={formattedConsultations}
    />
  );
}