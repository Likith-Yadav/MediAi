import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";
import Footer from "@/components/Footer";

export default function Profile() {
  const { currentUser, userProfile, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  const headerUser = {
    name: userProfile?.name || "User",
    email: userProfile?.email || "",
    profileImage: userProfile?.photoURL || undefined
  };

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col text-slate-800">
      <Header user={headerUser} />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        <UserProfile user={userProfile || {}} />
      </main>
      
      <Footer />
    </div>
  );
} 