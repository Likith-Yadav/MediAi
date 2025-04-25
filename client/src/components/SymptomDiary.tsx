import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle } from 'lucide-react';

interface SymptomLog {
  id: string;
  userId: string;
  symptom: string;
  timestamp: Date; // Store as Date object for easier formatting
}

export function SymptomDiary() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      // No need to set an error, UI will handle logged-out state
      setLogs([]); // Clear logs if user logs out
      return;
    }

    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const logsCollection = collection(db, 'symptomLogs');
        const q = query(
          logsCollection,
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedLogs: SymptomLog[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to JS Date
          const timestamp = data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(); // Fallback, should ideally always be a Timestamp

          fetchedLogs.push({
            id: doc.id,
            userId: data.userId,
            symptom: data.symptom,
            timestamp: timestamp,
          });
        });
        setLogs(fetchedLogs);
      } catch (err) {
        console.error("Error fetching symptom logs:", err);
        setError("Failed to load symptom diary. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [currentUser]); // Re-run when currentUser changes

  const formatDate = (date: Date): string => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Symptom Diary</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : !currentUser ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Please log in to view your symptom diary.
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No symptoms logged yet. Use the input below the chat to log symptoms.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground mb-1">{log.symptom}</p>
                  <p className="text-xs text-muted-foreground">
                    Logged on: {formatDate(log.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 