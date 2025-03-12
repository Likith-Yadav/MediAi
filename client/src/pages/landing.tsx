import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { AuthForms } from '../components/AuthForms';

export function Landing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoaded, setIsLoaded] = useState(true);

  // Redirect to dashboard if user is already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold">MediAssist AI</h1>
        <div className="flex gap-4">
          {isLoaded && !user && (
            <>
              <Button variant="outline" onClick={() => navigate('/login')}>Sign In</Button>
              <Button onClick={() => navigate('/register')}>Sign Up</Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="md:w-1/2 flex flex-col justify-center px-8 py-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4">AI-Powered Medical Assistant</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get preliminary medical insights, analyze symptoms, and understand health conditions with advanced AI technology.
          </p>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => navigate('/register')}>Get Started</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/about')}>Learn More</Button>
          </div>
        </div>
        <div className="md:w-1/2 bg-muted p-8 flex items-center justify-center">
          <div className="max-w-md w-full p-6 bg-background rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-6">Experience MediAssist AI</h3>
            <p className="text-muted-foreground mb-6">
              Sign up now to access our AI-powered tools:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                <span>Symptom analysis and preliminary insights</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                <span>Medical image analysis capabilities</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                <span>Speech-to-text for hands-free symptom reporting</span>
              </li>
            </ul>
            <Button className="w-full" onClick={() => navigate('/register')}>
              Create Free Account
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Landing;