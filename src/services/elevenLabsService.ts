interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

interface SpeechToTextResponse {
  text: string;
  alignment?: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = 'paRTfYnetOrTukxfEm1J'; 

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found in environment variables');
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const formData = new FormData();
      // Fix: Use 'file' parameter name as expected by ElevenLabs API
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model_id', 'scribe_v1');
      formData.append('language_code', 'en');

      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs Speech-to-Text API error:', errorText);
        throw new Error(`ElevenLabs Speech-to-Text API error: ${response.status} ${response.statusText}`);
      }

      const data: SpeechToTextResponse = await response.json();
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No speech detected in audio');
      }

      return data.text.trim();
    } catch (error) {
      console.error('Error transcribing audio with ElevenLabs:', error);
      
      // Fallback error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return "Speech-to-text service is not configured. Please type your message instead.";
        } else if (error.message.includes('No speech detected')) {
          return "I couldn't detect any speech in your recording. Please try speaking more clearly or closer to the microphone.";
        }
      }
      
      return "I had trouble understanding your voice message. Please try speaking more clearly or type your message instead.";
    }
  }

  async generateSpeech(text: string, voiceId?: string): Promise<ArrayBuffer> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId || this.defaultVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS API error: ${response.status} ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error generating speech with ElevenLabs:', error);
      throw error;
    }
  }

  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    try {
      if (!this.apiKey) {
        return [];
      }

      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices from ElevenLabs:', error);
      return [];
    }
  }

  createAudioUrl(audioBuffer: ArrayBuffer): string {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  // Helper method to check if API is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const elevenLabsService = new ElevenLabsService();