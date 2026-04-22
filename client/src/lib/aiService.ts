import { GoogleGenerativeAI } from '@google/generative-ai';

// Verify API key
const apiKey = "AIzaSyBbZxOPOPGnQ3JUF-EuTwhNvBCMqacLGBE";
// if (!apiKey) {
//   console.error('Gemini API key is not set in environment variables');
//   throw new Error('Gemini API key is required');
// }

console.log('API Key loaded:', apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

const DEFAULT_TIMEOUT_MS = 15000;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
};

const retry = async <T>(fn: () => Promise<T>, maxRetries = 1, delayMs = 500): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

export interface Message {
  role: 'user' | 'assistant';
  id: string;
  content: string;
  timestamp: Date | string;
  isLoading?: boolean;
  image?: string;
  imagePrompt?: string;
  suggestsBooking?: boolean;
  appointmentId?: string;
  isAppointmentUpdate?: boolean;
}

export const medicalChatService = {
  async sendMessage(message: string, language: string = 'en-US'): Promise<Message> {
    try {
      console.log('Starting chat request');

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        },
      }, { apiVersion: "v1" });

      let prompt = `You are an AI medical assistant. Your role is to:
1. Ask relevant questions about symptoms
2. Provide preliminary analysis
3. Recommend appropriate medications and treatments
4. Give recovery procedures and lifestyle advice
5. Always remind users to seek professional medical help for serious conditions

User message: ${message}

Please respond in a professional, caring manner.`;

      const result = await retry(
        () => withTimeout(model.generateContent(prompt), DEFAULT_TIMEOUT_MS),
        1,
      );
      
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from AI');
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: text.trim(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Detailed chat error:', {
        error: error.name,
        message: error.message,
      });
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  },

  async streamMessage(
    message: string,
    onChunk: (partialText: string) => void,
  ): Promise<Message> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        },
      }, { apiVersion: "v1" });

      const prompt = `You are an AI medical assistant. Your role is to:
1. Ask relevant questions about symptoms
2. Provide preliminary analysis
3. Recommend appropriate medications and treatments
4. Give recovery procedures and lifestyle advice
5. Always remind users to seek professional medical help for serious conditions

User message: ${message}

Please respond in a professional, caring manner.`;

      const streamResult = await retry(
        () => withTimeout(model.generateContentStream(prompt), DEFAULT_TIMEOUT_MS),
        1,
      );

      let fullText = "";
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (!text) continue;
        fullText += text;
        onChunk(fullText);
      }

      if (!fullText.trim()) {
        throw new Error('Empty response from AI');
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullText.trim(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Streaming chat error:', {
        error: error.name,
        message: error.message,
      });
      throw new Error(`Failed to stream AI response: ${error.message}`);
    }
  },
};

export const medicalAnalysisService = {
  async analyzeImage(file: File, userPrompt: string): Promise<string> {
    try {
      console.log('Starting image analysis with prompt:', userPrompt);
      
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
  
      const imageData = {
        inlineData: {
          data: data.split(',')[1],
          mimeType: file.type,
        },
      };
  
      const prompt = `You are a medical professional analyzing this medical image. The patient asks: "${userPrompt}"

Please provide a comprehensive analysis in the following format:

Image Type: [Specify the exact type of medical image - X-ray, MRI, CT scan, etc.]

Anatomical Region: [Specify the body part or organ system being examined]

Key Findings:
1. [List primary observations with specific details]
2. [Note any abnormalities, masses, or concerning features]
3. [Describe tissue characteristics, density variations, or structural changes]

Clinical Interpretation:
- [Provide detailed explanation of findings]
- [Discuss potential medical implications]
- [Compare with normal expectations]

Recommendations:
1. [Specific medical follow-up needed]
2. [Additional tests if required]
3. [Lifestyle or preventive measures]

Important Notes:
- [Critical information for patient awareness]
- [Limitations of the analysis]
- [Reminder about professional medical consultation]

Please be thorough and precise while explaining in patient-friendly terms.`;

      const visionModel = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
      }, { apiVersion: "v1" });
      
      const result = await visionModel.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
  
      if (!text) {
        throw new Error('Empty response from AI');
      }
  
      return text.trim();
    } catch (error: any) {
      console.error('Image analysis error:', error);
      throw new Error(`Failed to analyze medical image: ${error.message}`);
    }
  }
};

export const voiceService = {
  recognition: typeof window !== 'undefined' ? new (window as any).webkitSpeechRecognition() : null,
  synthesis: typeof window !== 'undefined' ? window.speechSynthesis : null,

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('Speech recognition not supported');
        return;
      }

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        reject(event.error);
      };

      this.recognition.start();
    });
  },

  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject('Speech synthesis not supported');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        console.log('Speech finished');
        resolve();
      };
      utterance.onerror = (error) => {
        console.error('Speech error:', error);
        reject(error);
      };
      // Fallback timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('Speech timeout fallback');
        resolve(); // Resolve even if speech fails
      }, 10000); // 10-second timeout
      utterance.onend = () => {
        clearTimeout(timeout);
        console.log('Speech finished');
        resolve();
      };
      this.synthesis.speak(utterance);
    });
  }
};