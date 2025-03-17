export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  initialize(onTranscript: (text: string) => void, onError: (error: string) => void) {
    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported');
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Send the combined transcript
        onTranscript(finalTranscript + interimTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let message = 'Failed to recognize speech';
        
        switch (event.error) {
          case 'not-allowed':
            message = 'Microphone access denied';
            break;
          case 'no-speech':
            message = 'No speech detected';
            break;
          case 'network':
            message = 'Network error occurred';
            break;
        }
        
        onError(message);
        this.stopRecording();
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart if we're still supposed to be listening
          this.recognition.start();
        }
      };

      return true;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      onError('Speech recognition not supported in this browser');
      return false;
    }
  }

  startRecording() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        return true;
      } catch (error) {
        console.error('Error starting recognition:', error);
        return false;
      }
    }
    return false;
  }

  stopRecording() {
    if (this.recognition) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  isRecording() {
    return this.isListening;
  }
} 