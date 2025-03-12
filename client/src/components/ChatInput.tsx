import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, Send } from "lucide-react";
import { createRecorder, blobToBase64 } from "@/lib/recorder";
import { convertSpeechToText } from "@/lib/aiService";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onToggleFileUpload: () => void;
  onClearConversation: () => void;
}

export default function ChatInput({ 
  onSendMessage, 
  onToggleFileUpload,
  onClearConversation
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useRef(createRecorder());
  const { toast } = useToast();
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        await recorder.current.start();
        setIsRecording(true);
      } else {
        const audioBlob = await recorder.current.stop();
        setIsRecording(false);
        
        // Show processing toast
        toast({
          title: "Processing speech...",
          description: "Converting your speech to text",
        });
        
        try {
          const text = await convertSpeechToText(audioBlob);
          setMessage(prev => prev + (prev ? " " : "") + text);
          
          // Focus the textarea
          textareaRef.current?.focus();
        } catch (error) {
          console.error("Speech-to-text error:", error);
          toast({
            title: "Speech Recognition Failed",
            description: "Could not convert your speech to text. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Recorder error:", error);
      setIsRecording(false);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="border-t border-slate-200 p-4">
      <div className="flex items-end space-x-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-slate-500 hover:text-primary hover:bg-slate-100"
          onClick={onToggleFileUpload}
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach files</span>
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`rounded-full hover:bg-slate-100 ${
            isRecording ? "text-red-500 bg-red-100" : "text-slate-500 hover:text-primary"
          }`}
          onClick={toggleRecording}
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Record audio</span>
        </Button>
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms or ask a question..."
            className="w-full border border-slate-300 rounded-lg py-2 pl-3 pr-10 focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
            rows={1}
          />
          
          {isRecording && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex items-center text-red-500">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs">Recording...</span>
              </div>
            </div>
          )}
        </div>
        
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          disabled={!message.trim()}
          onClick={handleSendMessage}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <div>
          <button 
            className="hover:text-primary"
            onClick={onClearConversation}
          >
            Clear conversation
          </button>
        </div>
        <div>
          <span>MediAI is designed to assist, not replace professional medical advice</span>
        </div>
      </div>
    </div>
  );
}
