import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import FileUploadArea from "./FileUploadArea";
import { Message } from "@/lib/aiService";
import { Separator } from "@/components/ui/separator";
import { SmileIcon, MoreVertical } from "lucide-react";

interface ChatInterfaceProps {
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearConversation: () => void;
}

export default function ChatInterface({ 
  messages, 
  addMessage, 
  updateMessage,
  clearConversation
}: ChatInterfaceProps) {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  return (
    <Card className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-full">
              <SmileIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">MediAI Assistant</h2>
              <div className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                <span className="text-xs text-slate-500 ml-1">Online</span>
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* File upload area (conditionally rendered) */}
      {showFileUpload && (
        <FileUploadArea 
          onClose={() => setShowFileUpload(false)} 
          onUpload={(files) => {
            console.log("Files to upload:", files);
            setShowFileUpload(false);
          }} 
        />
      )}
      
      <Separator />
      
      {/* Chat input */}
      <ChatInput 
        onSendMessage={(text) => {
          addMessage({
            id: Date.now().toString(),
            content: text,
            role: "user",
            timestamp: new Date()
          });
        }}
        onToggleFileUpload={() => setShowFileUpload(!showFileUpload)}
        onClearConversation={clearConversation}
      />
    </Card>
  );
}
