import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mic, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Message, Consultation } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { SpeechService } from '@/lib/speechService';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  arrayUnion
} from 'firebase/firestore';
import { medicalChatService } from "@/lib/aiService";

interface MedicalChatProps {
  selectedConsultation?: Consultation | null;
}

export default function MedicalChat({ selectedConsultation }: MedicalChatProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const speechService = useRef<SpeechService | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update messages when selectedConsultation changes
  useEffect(() => {
    if (selectedConsultation) {
      setMessages(selectedConsultation.messages);
      setCurrentConsultation(selectedConsultation.id);
    }
  }, [selectedConsultation]);

  // Initialize speech service
  useEffect(() => {
    speechService.current = new SpeechService();
    speechService.current.initialize(
      // Handle transcript updates
      (text) => {
        setInput(text);
      },
      // Handle errors
      (error) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        setIsRecording(false);
      }
    );

    return () => {
      if (speechService.current) {
        speechService.current.stopRecording();
      }
    };
  }, []);

  // Handle voice recording
  const handleVoiceRecord = () => {
    if (!speechService.current) {
      toast({
        title: "Error",
        description: "Speech recognition not available",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      speechService.current.stopRecording();
      setIsRecording(false);
      toast({
        title: "Stopped",
        description: "Voice recording stopped.",
      });
    } else {
      // Start recording
      if (speechService.current.startRecording()) {
        setIsRecording(true);
        setInput(''); // Clear existing input
        toast({
          title: "Recording",
          description: "Speak clearly... Click the mic again to stop.",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not start recording. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Create a new consultation
  const createConsultation = async (firstMessage?: string) => {
    if (!currentUser) return null;

    try {
      // Create a unique chat ID
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const consultationData = {
        userId: currentUser.uid,
        chatId: chatId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        date: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        status: firstMessage ? 'active' : 'new',
        messages: firstMessage ? [{
          id: Date.now().toString(),
          role: 'user',
          content: firstMessage,
          timestamp: new Date().toISOString()
        }] : [],
        symptoms: firstMessage || '',
      };

      console.log('Creating new consultation:', consultationData);
      const consultationRef = await addDoc(collection(db, 'consultations'), consultationData);
      console.log('Created consultation with ID:', consultationRef.id);
      
      setCurrentConsultation(consultationRef.id);
      return consultationRef.id;
    } catch (error) {
      console.error('Error creating consultation:', error);
      return null;
    }
  };

  // Add message to consultation
  const addMessageToConsultation = async (consultationId: string, message: Message) => {
    if (!consultationId) {
      console.error('No consultation ID provided');
      return;
    }

    try {
      const consultationRef = doc(db, 'consultations', consultationId);
      
      // Store message with ISO string timestamp
      const messageToStore = {
        ...message,
        timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp
      };

      console.log('Adding message to consultation:', consultationId, messageToStore);
      
      await updateDoc(consultationRef, {
        messages: arrayUnion(messageToStore),
        lastUpdated: serverTimestamp(),
      });

      console.log('Message added successfully');
    } catch (error) {
      console.error('Error adding message to consultation:', error);
    }
  };

  // Start a new chat
  const handleNewChat = async () => {
    // If there's an existing consultation with messages, update its status
    if (currentConsultation && messages.length > 0) {
      try {
        const consultationRef = doc(db, 'consultations', currentConsultation);
        
        // Store all messages with ISO string timestamps
        const messagesToStore = messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
        }));

        const updateData = {
          status: 'completed',
          lastUpdated: serverTimestamp(),
          messages: messagesToStore,
          diagnosis: messages.length >= 2 ? extractDiagnosis(messages[messages.length - 1].content) : '',
          recommendations: messages.length >= 2 ? extractRecommendations(messages[messages.length - 1].content) : ''
        };

        console.log('Updating consultation:', currentConsultation, updateData);
        
        await updateDoc(consultationRef, updateData);

        toast({
          title: "Chat Saved",
          description: "Your chat has been saved to recent consultations.",
        });
      } catch (error) {
        console.error('Error updating previous consultation:', error);
        toast({
          title: "Error",
          description: "Failed to save the current chat. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    // Clear current messages and create new consultation
    setMessages([]);
    setInput('');
    const newConsultationId = await createConsultation();
    if (newConsultationId) {
      setCurrentConsultation(newConsultationId);
    }
  };

  // Helper function to remove asterisks from text
  const removeAsterisks = (text: string): string => {
    return text.replace(/\*/g, '');
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !currentUser) return;

    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Create new consultation if none exists
      let consultationId = currentConsultation;
      if (!consultationId) {
        consultationId = await createConsultation(text);
        if (!consultationId) throw new Error('Failed to create consultation');
      }

      // Add user message to consultation
      await addMessageToConsultation(consultationId, userMessage);

      // Get AI response
      const response = await medicalChatService.sendMessage(text);
      
      const aiMessage: Message = {
        ...response,
        content: removeAsterisks(response.content), // Remove asterisks from AI response
        timestamp: new Date(),
      };

      // Add AI message to consultation
      await addMessageToConsultation(consultationId, aiMessage);
      
      setMessages(prev => [...prev, aiMessage]);

      // Update consultation status and any medical insights
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: 'active',
        lastUpdated: serverTimestamp(),
        // Extract potential medical insights from AI response
        diagnosis: extractDiagnosis(aiMessage.content),
        recommendations: extractRecommendations(aiMessage.content),
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to get response: ${error.message}`,
        variant: "destructive"
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to extract medical insights from AI responses
  const extractDiagnosis = (content: string): string => {
    // Simple extraction - you might want to make this more sophisticated
    const diagnosisMatch = content.match(/diagnosis|assessment/i);
    if (diagnosisMatch) {
      const startIndex = content.indexOf(diagnosisMatch[0]);
      const endIndex = content.indexOf('.', startIndex);
      return content.slice(startIndex, endIndex + 1);
    }
    return '';
  };

  const extractRecommendations = (content: string): string => {
    // Simple extraction - you might want to make this more sophisticated
    const recommendationsMatch = content.match(/recommend|suggest|advise/i);
    if (recommendationsMatch) {
      const startIndex = content.indexOf(recommendationsMatch[0]);
      const endIndex = content.indexOf('.', startIndex);
      return content.slice(startIndex, endIndex + 1);
    }
    return '';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medical Assistant</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNewChat}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Describe your symptoms or ask any medical questions...
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start mt-2">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder="Type your symptoms or questions..."
            disabled={isLoading || isRecording}
          />
          
          {/* Voice Recording Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleVoiceRecord}
            disabled={isLoading}
            className={isRecording ? "bg-red-100 hover:bg-red-200" : ""}
          >
            <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
          </Button>

          {/* Send Button */}
          <Button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || isRecording}
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}