import React, { useState, useCallback, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';

export function Dashboard() {
  const { user, signOut, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('chat');

  // Redirect to landing if user is not logged in
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
    navigate('/');
  }, [signOut, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex w-full justify-between">
            <h1 className="text-2xl font-bold">MedAssist AI</h1>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm">Hello, {user.displayName || user.email}</span>
                  <Button variant="ghost" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container px-4 md:px-6 py-6">
        <div className="flex flex-col space-y-4">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 ${activeTab === 'chat' ? 'border-b-2 border-primary font-medium' : ''}`}
              onClick={() => handleTabChange('chat')}
            >
              Chat Consultation
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'upload' ? 'border-b-2 border-primary font-medium' : ''}`}
              onClick={() => handleTabChange('upload')}
            >
              Image Analysis
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'voice' ? 'border-b-2 border-primary font-medium' : ''}`}
              onClick={() => handleTabChange('voice')}
            >
              Voice Input
            </button>
          </div>

          {activeTab === 'chat' && (
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Chat with MedAssist AI</h2>
                <p className="text-gray-500 mb-4">
                  Describe your symptoms or health concerns and receive an AI-powered initial assessment.
                </p>
                <div className="flex gap-2">
                  <Button>Start New Consultation</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Upload Medical Images</h2>
                <p className="text-gray-500 mb-4">
                  Upload X-rays, skin conditions, or other medical images for AI analysis.
                </p>
                <div className="flex gap-2">
                  <Button>Upload Image</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Voice Input</h2>
                <p className="text-gray-500 mb-4">
                  Describe your symptoms by voice for a quick initial assessment.
                </p>
                <div className="flex gap-2">
                  <Button>Start Recording</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}