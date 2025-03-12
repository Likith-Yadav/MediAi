import { apiRequest } from "./queryClient";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isLoading?: boolean;
}

export interface DiagnosisResult {
  conditions: Array<{
    name: string;
    confidence: number;
  }>;
  recommendations: string[];
  warnings: string[];
}

export interface ImageAnalysisResult {
  observations: string[];
  findings: string[];
  recommendations: string[];
}

// Send text message to AI for analysis
export async function analyzeTextSymptoms(
  message: string,
  conversationHistory: Message[]
): Promise<{ message: string; diagnosis?: DiagnosisResult }> {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/analyze/text", 
      { 
        message,
        history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    throw error;
  }
}

// Send audio for speech-to-text conversion
export async function convertSpeechToText(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    
    const response = await fetch("/api/speech-to-text", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error converting speech to text:", error);
    throw error;
  }
}

// Send medical image for analysis
export async function analyzeMedicalImage(imageFile: File): Promise<ImageAnalysisResult> {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    
    const response = await fetch("/api/analyze/image", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing medical image:", error);
    throw error;
  }
}
