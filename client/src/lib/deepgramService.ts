export class DeepgramService {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private currentTranscript: string = '';

  async initialize(onTranscript: (text: string) => void, onError: (error: string) => void) {
    try {
      if (!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY) {
        throw new Error('Deepgram API key not found');
      }

      // Create WebSocket connection with authorization in URL and additional parameters
      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?' +
        'encoding=linear16&' +
        'sample_rate=16000&' +
        'channels=1&' +
        'punctuate=true&' + // Add punctuation
        'interim_results=true&' + // Get interim results
        'language=en-US&' + // Specify language
        'model=nova-2', // Use the most accurate model
        ['token', process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY]
      );

      this.socket = socket;
      this.currentTranscript = '';

      socket.onopen = () => {
        console.log('DeepGram connection established');
      };

      socket.onmessage = (event) => {
        try {
          const received = JSON.parse(event.data);
          const transcript = received.channel?.alternatives?.[0]?.transcript || '';
          
          if (transcript) {
            // If this is a final result, append it to the current transcript
            if (received.is_final) {
              this.currentTranscript += (this.currentTranscript ? ' ' : '') + transcript;
              onTranscript(this.currentTranscript);
            } else {
              // For interim results, show the current transcript plus the interim result
              const interimText = this.currentTranscript + 
                (this.currentTranscript ? ' ' : '') + 
                transcript;
              onTranscript(interimText);
            }
          }
        } catch (error) {
          console.error('Error parsing transcript:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('DeepGram WebSocket error:', error);
        onError('Failed to process speech');
        this.stopRecording();
      };

      socket.onclose = () => {
        // When connection closes, make sure we have the final transcript
        if (this.currentTranscript) {
          onTranscript(this.currentTranscript);
        }
      };

      // Get microphone stream with specific constraints for better quality
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Setup MediaRecorder with specific MIME type
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(event.data);
        }
      };

      return true;
    } catch (error) {
      console.error('Error initializing DeepGram:', error);
      onError('Failed to initialize speech recognition');
      return false;
    }
  }

  startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.currentTranscript = ''; // Reset transcript when starting new recording
      this.mediaRecorder.start(100); // Send data every 100ms for more responsive updates
      return true;
    }
    return false;
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.currentTranscript = ''; // Reset transcript
  }

  isRecording() {
    return this.mediaRecorder?.state === 'recording';
  }
} 