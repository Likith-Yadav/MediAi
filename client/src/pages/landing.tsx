import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LoginForm, SignUpForm } from "@/components/AuthForms";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Landing() {
  const { currentUser, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<string>("login");

  // Redirect to dashboard if already logged in
  const handleLoginSuccess = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            MediAI Assistant
          </h1>
          <div>
            {!isLoading && currentUser ? (
              <Link href="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              >
                {authMode === "login" ? "Sign Up" : "Login"}
              </Button>
            )}
          </div>
        </nav>

        <main className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Your Personal AI-Powered
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                Medical Assistant
              </span>
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              Get instant medical advice, symptoms analysis, and health recommendations powered by advanced AI. Describe your symptoms through text, voice, or images for comprehensive health insights.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Multi-Modal Input</h3>
                  <p className="text-slate-600">
                    Describe symptoms via text, voice messages, or medical images
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Analysis</h3>
                  <p className="text-slate-600">
                    Get instant analysis of your symptoms and potential conditions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Private</h3>
                  <p className="text-slate-600">
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
                    <h4 className="font-semibold mb-2">Symptom Analysis</h4>
                    <p className="text-sm text-slate-600">
                      "I've been experiencing headaches and fatigue for the past week."
                    </p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <h4 className="font-semibold mb-2">AI Response</h4>
                    <p className="text-sm text-slate-600">
                      "Based on your symptoms, here are potential causes and recommended actions..."
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="font-medium mb-1">Voice Input</p>
                      <p className="text-sm text-slate-600">Speak your symptoms</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="font-medium mb-1">Image Analysis</p>
                      <p className="text-sm text-slate-600">Upload medical images</p>
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
    </div>
  );
}