// Verify API key
const apiKey = import.meta.env.VITE_POLLINATIONS_API_KEY;
if (!apiKey) {
  console.error('Pollinations API key is not set in environment variables');
  throw new Error('Pollinations API key is required');
}

const BASE_URL = 'https://gen.pollinations.ai/v1';
const DEFAULT_TIMEOUT_MS = 30000;

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
      console.log('Starting chat request to Pollinations');

      const response = await retry(
        () => withTimeout(
          fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'openai',
              messages: [
                {
                  role: 'system',
                  content: `You are an AI medical assistant. Your role is to:
1. Ask relevant questions about symptoms
2. Provide preliminary analysis
3. Recommend appropriate medications and treatments
4. Give recovery procedures and lifestyle advice
5. Always remind users to seek professional medical help for serious conditions
Respond in a professional, caring manner in the following language: ${language}.`,
                },
                { role: 'user', content: message },
              ],
              temperature: 0.4,
              max_tokens: 512,
            }),
          }),
          DEFAULT_TIMEOUT_MS
        ),
        1
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content;

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
      console.error('Detailed chat error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  },

  async streamMessage(
    message: string,
    onChunk: (partialText: string) => void,
    language: string = 'en-US'
  ): Promise<Message> {
    try {
      console.log('Starting streaming chat request to Pollinations');

      const response = await retry(
        () => withTimeout(
          fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'openai',
              messages: [
                {
                  role: 'system',
                  content: `You are an AI medical assistant. Your role is to:
1. Ask relevant questions about symptoms
2. Provide preliminary analysis
3. Recommend appropriate medications and treatments
4. Give recovery procedures and lifestyle advice
5. Always remind users to seek professional medical help for serious conditions
Respond in a professional, caring manner in the following language: ${language}.`,
                },
                { role: 'user', content: message },
              ],
              temperature: 0.4,
              max_tokens: 512,
              stream: true,
            }),
          }),
          DEFAULT_TIMEOUT_MS
        ),
        1
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            if (trimmedLine === 'data: [DONE]') continue;
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              const content = data.choices[0]?.delta?.content || "";
              fullText += content;
              if (content) onChunk(fullText);
            } catch (e) {
              console.warn('Error parsing stream chunk', e);
            }
          }
        }
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
      console.error('Streaming chat error:', error);
      throw new Error(`Failed to stream AI response: ${error.message}`);
    }
  },
};

export const medicalAnalysisService = {
  async analyzeImage(file: File, userPrompt: string): Promise<string> {
    try {
      console.log('Starting image analysis with Pollinations');

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai', 
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: `You are a medical professional. Analyze this image and patient query: "${userPrompt}"

Provide a concise response using this structure:

What has happened: **[One sentence bold summary of main findings]**

Key Observations:
- [Finding 1]
- [Finding 2]

Clinical Interpretation:
- [Short explanation]

Recommendations:
- [Next step 1]
- [Next step 2]

**Important:** This is not a diagnosis. Seek professional medical consultation.` },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content;

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