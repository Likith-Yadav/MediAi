import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mic, PlusCircle, Upload, FileText, Image, Send, Save, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Message, Consultation } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { SpeechService } from '@/lib/speechService';
import { cloudinaryService } from '@/lib/cloudinaryService';
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
import { medicalChatService, medicalAnalysisService } from "@/lib/aiService";
import * as AppointmentService from '@/lib/appointmentService';
import AppointmentLoginModal from './AppointmentLoginModal';

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
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'text' | 'image' | null>(null);
  const [isBookingFlowActive, setIsBookingFlowActive] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [appointmentUser, setAppointmentUser] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update messages when selectedConsultation changes
  useEffect(() => {
    if (selectedConsultation?.id && selectedConsultation?.messages) {
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
    // If there's a file, handle image analysis first
    if (file && fileType === 'image') {
      try {
        setIsLoading(true);
        // Upload image to Cloudinary first
        const imageUrl = await cloudinaryService.uploadImage(file);
        
        // Create a user message with the image
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: text || 'Please analyze this medical image.',
          timestamp: new Date(),
          image: imageUrl,
          imagePrompt: text || 'Please analyze this medical image.',
          suggestsBooking: false
        };
        
        // Create a new consultation if none exists
        let consultationId = currentConsultation;
        if (!consultationId) {
          consultationId = await createConsultation(userMessage.content);
          if (!consultationId) throw new Error('Failed to create consultation');
        }
        
        // Add user message to consultation
        await addMessageToConsultation(consultationId, userMessage);
        
        setMessages(prev => [...prev, userMessage]);
        setInput(''); // Clear input field immediately after sending
        
        // Add a loading message
        const loadingMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Analyzing your medical image...',
          timestamp: new Date(),
          isLoading: true,
          suggestsBooking: false
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        // Analyze the image
        const analysis = await medicalAnalysisService.analyzeImage(file, text || 'Please analyze this medical image.');
        
        console.log("AI Response:", analysis, "Suggests Booking:", false);
        
        // Create analysis message
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: analysis,
          timestamp: new Date(),
          suggestsBooking: false
        };
        
        // Replace loading message with analysis result
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id ? aiMessage : msg
        ));
        
        // Add AI message to consultation
        await addMessageToConsultation(consultationId, aiMessage);
        
        setFile(null);
        setFileType(null);
        setIsLoading(false);
        return;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to analyze the image",
          variant: "destructive"
        });
        return;
      }
    }

    // If in booking flow, handle differently (or disable regular send)
    if (isBookingFlowActive) {
      toast({ title: "Please complete the booking process or cancel it.", variant: "destructive" });
      return;
    }

    if (!text.trim() || isLoading || !currentUser) return;

    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      suggestsBooking: false
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
      
      // Clean and format the response
      let cleanContent = response.content
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\d+\. /g, '') // Remove numbered lists
        .replace(/\n\n/g, '\n') // Reduce multiple newlines
        .trim();

      // Check if AI suggests booking
      const suggestsBookingKeywords = ['consult', 'see a doctor', 'specialist', 'appointment', 'physician'];
      const lowerCaseContent = cleanContent.toLowerCase();
      const suggestsBooking = suggestsBookingKeywords.some(keyword => lowerCaseContent.includes(keyword));
      
      console.log("[Text Response] AI Content:", cleanContent, "| Suggests Booking:", suggestsBooking);

      const aiMessage: Message = {
        ...response,
        content: cleanContent,
        timestamp: new Date(),
        suggestsBooking: suggestsBooking
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

  // PLACEHOLDER: Function to log symptoms
  const handleLogSymptom = async (text: string) => {
    if (!text.trim() || !currentUser) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "You must be logged in to log symptoms.",
      });
      return;
    }

    const symptomToLog = text.trim();
    setInput(''); // Clear input immediately

    try {
      const symptomLogData = {
        userId: currentUser.uid,
        timestamp: serverTimestamp(), // Use server timestamp for consistency
        symptom: symptomToLog,
      };

      await addDoc(collection(db, 'symptomLogs'), symptomLogData);

      toast({
        title: "Symptom Logged Successfully",
        description: `"${symptomToLog.substring(0, 30)}${symptomToLog.length > 30 ? '...' : ''}" saved to your diary.`,
      });

    } catch (error) {
      console.error("Error logging symptom:", error);
      toast({
        variant: "destructive",
        title: "Error Logging Symptom",
        description: "Could not save symptom to diary. Please try again.",
      });
      setInput(symptomToLog); // Restore input if saving failed
    }
  };

  // Check if appointment user is logged in
  useEffect(() => {
    // Check localStorage on mount
    const checkAppointmentAuth = () => {
      const isAuth = AppointmentService.isAuthenticated();
      if (isAuth) {
        // If we have a token but no user data, set a minimal user object
        if (!appointmentUser) {
          setAppointmentUser({ isLoggedIn: true });
        }
      }
    };
    
    checkAppointmentAuth();
  }, [appointmentUser]);

  // --- Booking Flow Logic --- 
  const handleStartBooking = async () => {
    // Check if user is authenticated for appointments
    if (!AppointmentService.isAuthenticated()) {
      console.log("User not authenticated for appointment system, showing login modal");
      setShowLoginModal(true);
      return;
    }

    // Continue with booking flow as before
    setIsBookingFlowActive(true);
    setIsLoading(true);
    setBookingStep(1); // Move to doctor selection step
    console.log("Starting booking flow...");

    // Placeholder: Add a message indicating booking started
    const bookingStartMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Okay, let's find a doctor for you. Fetching available doctors...",
      timestamp: new Date(),
      isLoading: true, // Show loading indicator
      suggestsBooking: false
    };
    setMessages(prev => [...prev, bookingStartMessage]);

    try {
      // TODO: Potentially extract specialty from previous AI message?
      const doctors = await AppointmentService.fetchDoctors();
      setAvailableDoctors(doctors);
      // Replace loading message with doctor list (implementation detail for later)
      setMessages(prev => prev.map(msg => 
        msg.id === bookingStartMessage.id 
          ? { ...msg, content: "Please select a doctor:", isLoading: false } 
          : msg
      ));
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({ title: "Error fetching doctors", variant: "destructive" });
      setMessages(prev => prev.map(msg => 
        msg.id === bookingStartMessage.id 
          ? { ...msg, content: "Sorry, I couldn't fetch doctors right now.", isLoading: false } 
          : msg
      ));
      resetBookingFlow(); // Reset flow on error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login
  const handleLoginSuccess = (userData: any) => {
    console.log("Login successful, user data:", userData);
    setAppointmentUser(userData);
    setShowLoginModal(false);
    
    // Start the booking flow
    handleStartBooking();
  };

  const handleSelectDoctor = async (doctor: any) => {
    // Log the entire doctor object to see its structure
    console.log("SELECTED DOCTOR OBJECT:", doctor);
    
    setSelectedDoctor(doctor);
    setIsLoading(true);
    setBookingStep(2); // Move to slot selection
    console.log("Doctor selected:", doctor);

    // Add placeholder message
    const loadingSlotsMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Fetching available slots for ${doctor.name || (doctor.firstName ? doctor.firstName + ' ' + doctor.lastName : 'the doctor')}...`,
      timestamp: new Date(),
      isLoading: true,
      suggestsBooking: false
    };
    setMessages(prev => [...prev, loadingSlotsMessage]);

    try {
      // Get the correct ID from the doctor object
      // MongoDB ObjectIds are typically stored in _id
      const doctorId = doctor._id || doctor.id;
      
      console.log("Using doctor ID for API call:", doctorId);
      
      const slots = await AppointmentService.fetchAvailability(doctorId);
      setAvailableSlots(slots);
       setMessages(prev => prev.map(msg => 
        msg.id === loadingSlotsMessage.id 
          ? { ...msg, content: "Please select an available time slot:", isLoading: false } 
          : msg
      ));
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast({ title: "Error fetching time slots", variant: "destructive" });
       setMessages(prev => prev.map(msg => 
        msg.id === loadingSlotsMessage.id 
          ? { ...msg, content: `Sorry, I couldn't fetch slots for ${doctor.name || (doctor.firstName ? doctor.firstName + ' ' + doctor.lastName : 'the doctor')}.`, isLoading: false } 
          : msg
      ));
      // Optionally reset only this step or the whole flow
      setBookingStep(1); // Go back to doctor selection
      setSelectedDoctor(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = async (slot: any) => {
    // Log the full slot object to understand its structure
    console.log("SELECTED SLOT FULL OBJECT:", slot);
    
    setSelectedSlot(slot);
    setIsLoading(true);
    setBookingStep(3); // Move to confirmation
    console.log("Slot selected:", slot);

    // Add placeholder message
    const requestingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Requesting appointment with ${selectedDoctor.name || selectedDoctor.firstName + ' ' + selectedDoctor.lastName} for ${slot.date || slot.appointmentDate} at ${slot.time || slot.startTime}...`,
      timestamp: new Date(),
      isLoading: true,
      suggestsBooking: false
    };
    setMessages(prev => [...prev, requestingMessage]);

    if (!currentUser) {
      toast({ title: "Login Required", variant: "destructive" });
      resetBookingFlow();
      setIsLoading(false);
      return;
    }

    try {
      // Get the MongoDB ObjectId for the doctor
      const doctorId = selectedDoctor._id || selectedDoctor.id;
      
      // Log the doctor ID being used
      console.log("Using doctor ID for appointment:", doctorId);
      
      // Extract date and time from the slot
      const appointmentDate = slot.date || slot.appointmentDate;
      const appointmentTime = slot.time || slot.startTime;
      
      // Prepare the appointment data for the API
      const appointmentData: any = {
        // Doctor details
        doctorId: doctorId,
        doctorName: selectedDoctor.name || 
                   (selectedDoctor.firstName ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Doctor"),
        
        // Patient details - using Firebase user information
        patientName: currentUser.displayName || "Patient",
        patientEmail: currentUser.email || "patient@example.com",
        patientPhone: "", // Add if available
        
        // Store the Firebase UID as external ID for patient lookup/creation
        externalPatientId: currentUser.uid,
        
        // Appointment details
        date: appointmentDate,
        time: appointmentTime,
        dateTime: slot.dateTime || `${appointmentDate}T${appointmentTime}`,
        status: "pending",
        
        // Additional fields
        reason: "Consultation from MediAI",
        notes: "Appointment booked via MediAI assistant",
      };
      
      // If slot has its own ID, include it
      if (slot._id) appointmentData.slotId = slot._id;
      if (slot.id) appointmentData.slotId = slot.id;
      
      // Log the appointment data we're sending
      console.log("SENDING APPOINTMENT DATA:", JSON.stringify(appointmentData, null, 2));
      
      // The service will handle patient creation/lookup based on externalPatientId
      const response = await AppointmentService.requestAppointment(appointmentData);
      console.log("Appointment request response:", response);

      // Show confirmation message with doctor's name and appointment details
      const doctorName = selectedDoctor.name || 
                        (selectedDoctor.firstName ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : 'the doctor');
      
      setMessages(prev => prev.map(msg => 
        msg.id === requestingMessage.id 
          ? { ...msg, content: `Appointment request sent! You will be notified once ${doctorName} confirms for ${appointmentDate} at ${appointmentTime}.`, isLoading: false } 
          : msg
      ));
      
      // Optionally show the appointment ID if returned
      if (response && response.appointmentId) {
        toast({
          title: "Appointment Requested",
          description: `Appointment ID: ${response.appointmentId}`,
        });
      }
      
      // Reset the booking flow
      resetBookingFlow();

    } catch (error: any) { 
      console.error("Error requesting appointment:", error);
      toast({ 
        title: "Error requesting appointment", 
        description: error.message || "Failed to book appointment",
        variant: "destructive" 
      });
      setMessages(prev => prev.map(msg => 
        msg.id === requestingMessage.id 
          ? { ...msg, content: "Sorry, I couldn't submit the appointment request.", isLoading: false } 
          : msg
      ));
      // Optionally reset only this step or the whole flow
      setBookingStep(2); // Go back to slot selection
      setSelectedSlot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetBookingFlow = () => {
    setIsBookingFlowActive(false);
    setBookingStep(0);
    setAvailableDoctors([]);
    setAvailableSlots([]);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setIsLoading(false);
    console.log("Booking flow reset.");
  };
  
  // --- End Booking Flow Logic ---

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
                    className={`max-w-[80%] rounded-lg p-3 relative ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {msg.image && (
                      <div className="mb-2">
                        <img 
                          src={msg.image} 
                          alt="Uploaded medical image" 
                          className="max-w-full max-h-[200px] object-contain rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '';
                            target.alt = 'Failed to load image';
                            target.className = 'max-w-full rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-500';
                            target.textContent = 'Image failed to load';
                          }}
                        />
                      </div>
                    )}
                    {msg.role === 'user' && msg.image ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.imagePrompt || 'Please analyze this medical image.'}
                      </p>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    
                    {/* Render Booking Button if AI suggests it and flow isn't active */}
                    {msg.role === 'assistant' && msg.suggestsBooking && !isBookingFlowActive && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mt-2 flex items-center gap-1 bg-white hover:bg-slate-50"
                        onClick={handleStartBooking}
                        disabled={isLoading}
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Book Appointment
                      </Button>
                    )}

                    {/* Example for showing doctors (bookingStep 1) */}
                    {msg.role === 'assistant' && bookingStep === 1 && availableDoctors.length > 0 && (
                       <div className="mt-2 space-y-1">
                         {availableDoctors.map(doc => (
                           <Button 
                             key={doc._id || doc.id} 
                             variant="outline" 
                             size="sm" 
                             className="w-full justify-start bg-white hover:bg-slate-50" 
                             onClick={() => handleSelectDoctor(doc)} 
                             disabled={isLoading}
                           >
                             {doc.name || doc.firstName + ' ' + doc.lastName || 'Unnamed Doctor'} 
                             {doc.specialization && ` (${doc.specialization})`}
                             {doc.specialty && ` (${doc.specialty})`}
                           </Button>
                         ))}
                       </div>
                    )}

                    {/* Example for showing slots (bookingStep 2) */}
                     {msg.role === 'assistant' && bookingStep === 2 && availableSlots.length > 0 && (
                       <div className="mt-2 grid grid-cols-3 gap-1">
                         {availableSlots.map((slot, index) => {
                           // Handle different data formats that might come from API
                           const displayDate = slot.date || slot.appointmentDate || '';
                           const displayTime = slot.time || slot.startTime || '';
                           
                           return (
                             <Button 
                               key={index} 
                               variant="outline" 
                               size="sm" 
                               className="bg-white hover:bg-slate-50" 
                               onClick={() => handleSelectSlot(slot)} 
                               disabled={isLoading}
                             >
                               {displayDate && displayTime 
                                 ? `${displayDate} @ ${displayTime}`
                                 : (slot.displayText || JSON.stringify(slot))
                               }
                             </Button>
                           );
                         })}
                         {availableSlots.length === 0 && 
                           <p className="text-xs text-muted-foreground col-span-3">No available slots found.</p>
                         }
                       </div>
                    )}
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

        {/* Cancel Booking Button */} 
        {isBookingFlowActive && (
          <div className="flex justify-center mb-2">
            <Button variant="destructive" size="sm" onClick={resetBookingFlow} disabled={isLoading}>
              Cancel Booking Process
            </Button>
          </div>
        )}

        {/* Selected File Display */}
        {file && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <Image className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFile(null);
                setFileType(null);
              }}
              disabled={isLoading}
            >
              Remove
            </Button>
          </div>
        )}
        
        {/* Loading indicator for image upload */}
        {file && isLoading && (
          <div className="flex justify-center items-center p-2 bg-muted rounded-lg mb-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Uploading and analyzing image...</span>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <label htmlFor="file-upload" className="flex items-center justify-center px-3 py-2 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Upload
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (!selectedFile) return;
                if (selectedFile.type.startsWith('image/')) {
                  setFile(selectedFile);
                  setFileType('image');
                } else {
                  toast({
                    variant: "destructive",
                    title: "Invalid file type",
                    description: "Please upload an image file (JPG, PNG)",
                  });
                }
              }}
              disabled={isLoading}
            />
          </label>
          
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
              placeholder="Type your symptoms or questions..."
              disabled={isLoading || isRecording}
            />
          </div>
          
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
            disabled={isLoading || isRecording || !input.trim()}
            title="Send message to AI"
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* Log Symptom Button */}
          <Button
            variant="outline"
            onClick={() => handleLogSymptom(input)}
            disabled={isLoading || !input.trim()}
            title="Log symptom to diary"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {/* Login Modal */}
        <AppointmentLoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </CardContent>
    </Card>
  );
}