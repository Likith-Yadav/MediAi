import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LoginForm, SignUpForm } from "@/components/AuthForms";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuroraUI from "@/components/AuroraUI";

export default function Landing() {
  const { currentUser, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<string>("login");

  // Redirect to dashboard if already logged in
  const handleLoginSuccess = () => {
    setLocation("/dashboard");
  };

  return (
    <AuroraUI>
      <div className="page-container">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-600/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold gradient-text">
              MediAI Assistant
            </h1>
          </div>
          <p className="text-xl text-black max-w-2xl mx-auto">
            Your intelligent healthcare companion powered by advanced AI
          </p>
        </div>

        <main className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-6">
              Your Personal AI-Powered
              <span className="block gradient-text">
                Medical Assistant
              </span>
            </h2>
            <p className="text-black text-lg mb-8 font-medium">
              Get instant medical advice, symptoms analysis, and health recommendations powered by advanced AI. Describe your symptoms through text, voice, or images for comprehensive health insights.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 feature-text">Multi-Modal Input</h3>
                  <p className="feature-description">
                    Describe symptoms via text, voice messages, or medical images
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 feature-text">AI-Powered Analysis</h3>
                  <p className="feature-description">
                    Get instant analysis of your symptoms and potential conditions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 feature-text">Secure & Private</h3>
                  <p className="feature-description">
                    Your health data is encrypted and protected with enterprise-grade security
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white p-8 rounded-3xl shadow-xl">
              {!isLoading && currentUser ? (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 feature-text">Symptom Analysis</h4>
                    <p className="text-sm text-slate-700">
                      "I've been experiencing headaches and fatigue for the past week."
                    </p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <h4 className="font-semibold mb-2 feature-text">AI Response</h4>
                    <p className="text-sm text-slate-700">
                      "Based on your symptoms, here are potential causes and recommended actions..."
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="font-medium mb-1 feature-text">Voice Input</p>
                      <p className="text-sm text-slate-700">Speak your symptoms</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="font-medium mb-1 feature-text">Image Analysis</p>
                      <p className="text-sm text-slate-700">Upload medical images</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Tabs value={authMode} onValueChange={setAuthMode}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <LoginForm onSuccess={handleLoginSuccess} />
                  </TabsContent>
                  <TabsContent value="signup">
                    <SignUpForm onSuccess={handleLoginSuccess} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuroraUI>
  );
}