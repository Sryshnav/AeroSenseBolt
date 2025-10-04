export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;

    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      onError?.(event.error);
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError?.('Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (this.currentUtterance) {
      this.synthesis.cancel();
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = 0.9;
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 1.0;

    this.currentUtterance.onstart = () => {
      onStart?.();
    };

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    this.synthesis.speak(this.currentUtterance);
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  isSupported(): boolean {
    return !!this.recognition && !!this.synthesis;
  }
}
