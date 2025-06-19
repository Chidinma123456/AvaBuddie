import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: GeminiMessage[] = [],
    hasImage = false,
    isVoiceMessage = false
  ): Promise<string> {
    try {
      // Build the system prompt
      const systemPrompt = `You are Dr. Ava, a professional medical assistant. You provide helpful, accurate, and empathetic medical guidance while always emphasizing the importance of professional medical care when needed. 

Key guidelines:
- Be professional yet warm and empathetic
- Provide helpful medical information but always recommend consulting healthcare professionals for serious concerns
- If symptoms seem severe, suggest emergency care or doctor consultation
- Be concise but thorough in your responses
- Use simple, understandable language
- Show concern for the patient's wellbeing

${hasImage ? 'The user has shared an image. Acknowledge that you can see it and provide relevant guidance based on visual symptoms.' : ''}
${isVoiceMessage ? 'The user sent a voice message. Acknowledge this and respond appropriately to their spoken concerns.' : ''}`;

      // Build conversation history for context
      let conversationContext = systemPrompt + '\n\n';
      
      if (conversationHistory.length > 0) {
        conversationContext += 'Previous conversation:\n';
        conversationHistory.forEach(msg => {
          const role = msg.role === 'model' ? 'Dr. Ava' : 'Patient';
          conversationContext += `${role}: ${msg.parts}\n`;
        });
        conversationContext += '\n';
      }

      conversationContext += `Patient: ${userMessage}\nDr. Ava:`;

      const result = await this.model.generateContent(conversationContext);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Fallback response for API errors
      return "I apologize, but I'm experiencing technical difficulties right now. For immediate medical concerns, please contact your healthcare provider or emergency services. I'll be back to assist you shortly.";
    }
  }

  async analyzeImage(imageBase64: string, userMessage: string): Promise<string> {
    try {
      const systemPrompt = `You are Dr. Ava, analyzing a medical image. Provide helpful observations while emphasizing the need for professional medical evaluation.`;

      // Convert base64 to the format Gemini expects
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      };

      const prompt = `${systemPrompt}\n\nPatient's question: ${userMessage}`;

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      return "I can see the image you've shared, but I'm having trouble analyzing it right now. For any concerning visual symptoms, please consult with a healthcare professional who can properly examine the area.";
    }
  }
}

export const geminiService = new GeminiService();