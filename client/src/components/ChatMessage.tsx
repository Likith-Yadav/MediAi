import React from "react";
import { Message } from "@/lib/aiService";
import { SmileIcon } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="chat-message flex justify-end">
        <div className="bg-primary text-white rounded-lg p-4 max-w-[80%]">
          <p className="text-sm whitespace-pre-line">{message.content}</p>
        </div>
      </div>
    );
  }
  
  // For AI assistant messages
  return (
    <div className="chat-message flex">
      <div className="flex-shrink-0 mr-3">
        <div className="bg-primary text-white p-2 rounded-full h-8 w-8 flex items-center justify-center">
          <SmileIcon className="h-5 w-5" />
        </div>
      </div>
      <div className="bg-slate-100 rounded-lg p-4 max-w-[80%]">
        {message.isLoading ? (
          <div className="flex space-x-1 items-center p-2">
            <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-line">
            {parseMessageContent(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}

function parseMessageContent(content: string) {
  // This is a simple parser that could be expanded to handle markdown or custom formatting
  // For now, we'll just render the content with pre-line whitespace handling
  return content;
}
