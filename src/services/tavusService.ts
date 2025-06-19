interface TavusPersona {
  persona_id: string;
  persona_name: string;
  status: string;
}

interface TavusConversation {
  conversation_id: string;
  status: string;
  callback_url?: string;
  conversation_url?: string;
}

interface TavusConversationConfig {
  persona_id: string;
  callback_url?: string;
  properties?: {
    max_call_duration?: number;
    participant_left_timeout?: number;
    enable_recording?: boolean;
    language?: string;
  };
}

class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com';
  private drAvaPersonaId = 'p9863a04af01'; // Dr. Ava persona ID

  constructor() {
    this.apiKey = import.meta.env.VITE_TAVUS_API_KEY;
    if (!this.apiKey) {
      console.warn('Tavus API key not found in environment variables');
    }
  }

  private getMedicalSystemPrompt(): string {
    return `You are Dr. Ava, a professional and empathetic AI medical assistant. Your role is to provide helpful medical guidance while maintaining the highest standards of care.

CORE IDENTITY:
- You are a warm, professional, and knowledgeable medical AI
- You have extensive medical knowledge but always emphasize the importance of professional medical care
- You speak in a calm, reassuring tone while being thorough and accurate

MEDICAL GUIDELINES:
- Provide helpful medical information and guidance
- Always recommend consulting healthcare professionals for serious concerns
- If symptoms seem severe or emergency-related, immediately suggest emergency care
- Use simple, understandable language that patients can easily follow
- Show genuine concern for the patient's wellbeing
- Ask relevant follow-up questions to better understand symptoms

CONVERSATION STYLE:
- Be conversational and natural in video calls
- Maintain eye contact and use appropriate facial expressions
- Speak at a comfortable pace, allowing for patient responses
- Show empathy and understanding for patient concerns
- Use encouraging and supportive language

SAFETY PROTOCOLS:
- Never provide specific diagnoses - only general medical information
- Always emphasize the need for professional medical evaluation
- For emergencies, immediately direct to emergency services
- Maintain patient confidentiality and privacy
- Be honest about limitations as an AI assistant

SPECIALIZATION AREAS:
- General health and wellness guidance
- Symptom assessment and triage
- Medication information and interactions
- Preventive care recommendations
- Mental health support and resources
- Chronic condition management guidance

Remember: You are here to support and guide patients, but professional medical care is irreplaceable for proper diagnosis and treatment.`;
  }

  async createConversation(): Promise<TavusConversation> {
    try {
      if (!this.apiKey) {
        // Return mock data for development
        return {
          conversation_id: `mock_${Date.now()}`,
          status: 'active',
          conversation_url: 'https://mock-tavus-url.com'
        };
      }

      const conversationConfig: TavusConversationConfig = {
        persona_id: this.drAvaPersonaId,
        callback_url: `${window.location.origin}/api/tavus/callback`,
        properties: {
          max_call_duration: 1800, // 30 minutes
          participant_left_timeout: 60,
          enable_recording: false,
          language: 'English'
        }
      };

      console.log('Creating Tavus conversation with Dr. Ava persona:', this.drAvaPersonaId);

      const response = await fetch(`${this.baseUrl}/v2/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationConfig),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Tavus API Error Response:', errorText);
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Tavus conversation created successfully with Dr. Ava:', result);
      return result;
    } catch (error) {
      console.error('Error creating Tavus conversation:', error);
      
      // Return mock data as fallback
      return {
        conversation_id: `fallback_${Date.now()}`,
        status: 'active',
        conversation_url: 'https://mock-tavus-url.com'
      };
    }
  }

  async updateConversationContext(conversationId: string, context: string): Promise<void> {
    try {
      // Skip API call if no API key or using mock/fallback conversation
      if (!this.apiKey || conversationId.startsWith('mock_') || conversationId.startsWith('fallback_')) {
        console.log('Skipping conversation context update - using mock/fallback mode');
        return;
      }

      const response = await fetch(`${this.baseUrl}/v2/conversations/${conversationId}/context`, {
        method: 'PUT',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: context,
          system_prompt: this.getMedicalSystemPrompt()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update conversation context: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating conversation context:', error);
      // Don't throw the error to prevent breaking the consultation flow
    }
  }

  async sendMessage(conversationId: string, message: string): Promise<void> {
    try {
      if (!this.apiKey || conversationId.startsWith('mock_') || conversationId.startsWith('fallback_')) {
        console.log('Skipping message send - using mock/fallback mode');
        return;
      }

      const response = await fetch(`${this.baseUrl}/v2/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sender: 'system'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending message to conversation:', error);
      // Don't throw the error to prevent breaking the consultation flow
    }
  }

  async getPersonas(): Promise<TavusPersona[]> {
    try {
      if (!this.apiKey) {
        return [];
      }

      const response = await fetch(`${this.baseUrl}/v2/personas`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Tavus personas:', error);
      return [];
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      if (!this.apiKey || conversationId.startsWith('mock_') || conversationId.startsWith('fallback_')) {
        // Skip API call for mock conversations
        console.log('Skipping conversation end - using mock/fallback mode');
        return;
      }

      const response = await fetch(`${this.baseUrl}/v2/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to end conversation: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error ending Tavus conversation:', error);
      // Don't throw the error to prevent breaking the consultation flow
    }
  }

  async getConversationStatus(conversationId: string): Promise<string> {
    try {
      if (!this.apiKey || conversationId.startsWith('mock_') || conversationId.startsWith('fallback_')) {
        return 'active';
      }

      const response = await fetch(`${this.baseUrl}/v2/conversations/${conversationId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const data = await response.json();
      return data.status || 'unknown';
    } catch (error) {
      console.error('Error getting conversation status:', error);
      return 'error';
    }
  }
}

export const tavusService = new TavusService();