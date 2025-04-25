import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, Send } from "lucide-react";
import { createRecorder, blobToBase64 } from "@/lib/recorder";
import { convertSpeechToText } from "@/lib/aiService";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onImageAnalysis: (file: File, prompt: string) => Promise<void>;
  onToggleFileUpload: () => void;
  onClearConversation: () => void;
}

export default function ChatInput({ 
  onSendMessage, 
  onImageAnalysis,
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
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setShowImageDialog(true);
    }
  };

  const handleImageAnalysis = async () => {
    if (selectedImage && imagePrompt.trim()) {
      try {
        await onImageAnalysis(selectedImage, imagePrompt);
        setShowImageDialog(false);
        setSelectedImage(null);
        setImagePrompt("");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: error.message,
        });
      }
    }
  };

  return (
    <>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            rows={1}
          />
          <div className="flex gap-2">
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyze Medical Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImage && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Describe what you'd like to analyze about this image:</Label>
              <Textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="E.g., Please analyze this X-ray for any abnormalities..."
                rows={3}
              />
            </div>
            <Button onClick={handleImageAnalysis} className="w-full">
              Analyze Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
