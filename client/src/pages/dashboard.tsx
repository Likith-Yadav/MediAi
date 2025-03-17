import React, { useState } from "react";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";
import RecentConsultations from "@/components/RecentConsultations";
import MedicalChat from "@/components/MedicalChat";
import Footer from "@/components/Footer";
import { Consultation } from "@/lib/types";
import { useLocation } from "wouter";
import { useConsultations } from "@/hooks/useFirebase";
import { useAuth } from "@/hooks/use-auth";
import { FirebaseConsultation } from "@/lib/firebase";

function DashboardContent({
  userProfile,
  consultations,
}: {
  userProfile: any;
  consultations: FirebaseConsultation[];
}) {
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

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
    email: userProfile?.email || "",
    profileImage: userProfile?.photoURL || undefined
  };

  const handleSelectChat = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
  };
  
  return (
    <div className="bg-slate-100 min-h-screen flex flex-col text-slate-800">
      <Header user={headerUser} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserProfile user={userProfile || {}} />
            <RecentConsultations 
              consultations={formattedConsultations} 
              onSelectChat={handleSelectChat}
            />
          </div>
          
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <MedicalChat selectedConsultation={selectedConsultation} />
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
  
  // Show loading state if authentication is still loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // Redirect if no user is logged in
  if (!currentUser) {
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
    />
  );
}