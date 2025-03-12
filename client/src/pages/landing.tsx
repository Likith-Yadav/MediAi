import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { AuthForms } from '../components/AuthForms';

export function Landing() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect to dashboard if user is logged in
  React.useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <div className="flex w-full justify-between">
          <h1 className="text-2xl font-bold">MedAssist AI</h1>
          {!isLoading && !user && (
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Sign In
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your AI Healthcare Assistant
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Receive preliminary health assessments, analyze medical images, and get personalized health
                    insights with our advanced AI system.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" onClick={() => navigate('/dashboard')}>
                    Get Started
                  </Button>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="mx-auto flex flex-col justify-center">
                <AuthForms />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}