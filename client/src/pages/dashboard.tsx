
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Mic, Upload, SendIcon } from 'lucide-react';

function Dashboard() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle text analysis
  const handleSubmitMessage = useCallback(async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to analyze text. Please try again.');
      }
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('An error occurred while analyzing your message. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  // Handle image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/analyze/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to analyze image. Please try again.');
      }
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('An error occurred while analyzing your image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user && !useAuth().loading) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 px-8 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold">MediAssist AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {user.displayName || user.email}
          </span>
          <Button variant="outline" onClick={() => signOut().then(() => navigate('/'))}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-6xl">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="text">Text Analysis</TabsTrigger>
            <TabsTrigger value="image">Image Analysis</TabsTrigger>
            <TabsTrigger value="voice">Voice Input</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Symptom Analysis</CardTitle>
                <CardDescription>
                  Describe your symptoms in detail for a preliminary analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your symptoms here... (e.g., I've been experiencing a persistent cough and fever for 3 days)"
                    className="min-h-[150px]"
                  />
                  <Button 
                    onClick={handleSubmitMessage} 
                    disabled={isLoading || !message.trim()} 
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Analyze Symptoms
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical Image Analysis</CardTitle>
                <CardDescription>
                  Upload a medical image for preliminary analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="image-upload">Image</Label>
                    <Input 
                      id="image-upload" 
                      type="file" 
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleImageUpload}
                      disabled={isLoading}
                    />
                  </div>
                  {isLoading && (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voice Input</CardTitle>
                <CardDescription>
                  Record your voice to describe symptoms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <Button size="lg" className="h-16 w-16 rounded-full">
                    <Mic className="h-8 w-8" />
                  </Button>
                  <p className="text-sm text-muted-foreground">Click to start recording</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {response.message && (
                <div className="mb-6 whitespace-pre-line">
                  {response.message}
                </div>
              )}
              
              {response.diagnosis && response.diagnosis.conditions && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Possible Conditions:</h3>
                  <div className="flex flex-wrap gap-2">
                    {response.diagnosis.conditions.map((condition: any, index: number) => (
                      <Badge 
                        key={index} 
                        variant={index === 0 ? "default" : "secondary"}
                      >
                        {condition.name} ({Math.round(condition.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {response.observations && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Observations:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {response.observations.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {response.findings && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Findings:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {response.findings.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(response.diagnosis?.recommendations || response.recommendations) && (
                <div>
                  <h3 className="font-semibold mb-2">Recommendations:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {(response.diagnosis?.recommendations || response.recommendations).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
