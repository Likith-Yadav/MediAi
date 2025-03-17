import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Consultation } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import { MessageSquare, Clock } from 'lucide-react';

interface RecentConsultationsProps {
  consultations: Consultation[];
  onSelectChat?: (consultation: Consultation) => void;
}

export default function RecentConsultations({ consultations: propConsultations, onSelectChat }: RecentConsultationsProps) {
  const { currentUser } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      console.log('No current user');
      setConsultations([]);
      setIsLoading(false);
      return;
    }

    console.log('Setting up consultations listener for user:', currentUser.uid);

    try {
      const consultationsRef = collection(db, 'consultations');
      const q = query(
        consultationsRef,
        where('userId', '==', currentUser.uid),
        orderBy('lastUpdated', 'desc'),
        limit(5)
      );

      console.log('Query created:', q);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('Snapshot received, docs count:', snapshot.docs.length);
        
        const fetchedConsultations = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing doc:', doc.id, data);

          // Convert Firestore timestamps to dates
          let consultationDate = new Date();
          if (data.lastUpdated) {
            consultationDate = (data.lastUpdated as Timestamp).toDate();
          } else if (data.date) {
            consultationDate = (data.date as Timestamp).toDate();
          }

          // Convert message timestamps from ISO strings back to dates
          const messages = (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
          }));

          return {
            id: doc.id,
            chatId: data.chatId || doc.id,
            title: data.title || `Chat ${format(consultationDate, 'PPP')}`,
            date: consultationDate,
            status: data.status || 'completed',
            userId: data.userId,
            messages: messages,
            symptoms: data.symptoms || '',
            diagnosis: data.diagnosis || '',
            recommendations: data.recommendations || ''
          } as Consultation;
        });

        console.log('Processed consultations:', fetchedConsultations);
        setConsultations(fetchedConsultations);
        setIsLoading(false);
      }, (error) => {
        console.error('Error in snapshot listener:', error);
        setIsLoading(false);
      });

      return () => {
        console.log('Cleaning up consultations listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up consultations listener:', error);
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleChatClick = (consultation: Consultation) => {
    if (onSelectChat) {
      onSelectChat(consultation);
    }
  };

  const getLastMessage = (consultation: Consultation) => {
    if (consultation.messages && consultation.messages.length > 0) {
      const lastMessage = consultation.messages[consultation.messages.length - 1];
      const preview = lastMessage.content.slice(0, 60);
      return preview + (lastMessage.content.length > 60 ? '...' : '');
    }
    return consultation.symptoms ? consultation.symptoms.slice(0, 60) + '...' : 'No messages';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return format(date, 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Chats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Chats ({consultations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {consultations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No recent chats
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => handleChatClick(consultation)}
                className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">
                        {consultation.title}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({consultation.messages.length} messages)
                        </span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(consultation.date)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    consultation.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : consultation.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {consultation.status}
                  </span>
                </div>
                
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-foreground/80">
                    {getLastMessage(consultation)}
                  </p>
                  {consultation.diagnosis && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                    </p>
                  )}
                  {consultation.recommendations && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Recommendation:</span> {consultation.recommendations}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
