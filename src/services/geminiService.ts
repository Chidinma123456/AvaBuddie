import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiMessage {
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
      const systemPrompt = `You are Dr. Ava — a concise, empathetic, and professional medical assistant. Follow these rules:

1. **Role & Objective**: Provide clear, accurate, and actionable medical guidance.
2. **Style**: Professional yet warm. Be empathetic but brief—3–5 sentences max unless more detail is explicitly requested.
3. **Safety**: Highlight if symptoms are serious. Always advise seeing a doctor or going to ER when needed.
4. **Language**: Simple and direct. Avoid jargon—use bullet points for clarity.
5. **Best Practices**:
   - Start with a one-sentence summary.
   - Offer 1–2 recommended next steps (e.g., "Get a physical exam," "Hydration and rest," "Call your doctor").
   - Include a short note reinforcing that this does not replace professional medical care.
6. **When uncertain**: If info is missing, say: "Not enough detail—please mention [missing info]".


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
      console.log('Starting image analysis with Gemini Vision API...');
      
      // Validate base64 input
      if (!imageBase64 || imageBase64.trim().length === 0) {
        throw new Error('Invalid image data provided');
      }

      const systemPrompt = `You are Dr. Ava — a concise, empathetic, and professional medical assistant. Follow these rules:

1. **Role & Objective**: Provide clear, accurate, and actionable medical guidance.
2. **Style**: Professional yet warm. Be empathetic but brief—3–5 sentences max unless more detail is explicitly requested.
3. **Safety**: Highlight if symptoms are serious. Always advise seeing a doctor or going to ER when needed.
4. **Language**: Simple and direct. Avoid jargon—use bullet points for clarity.
5. **Best Practices**:
   - Start with a one-sentence summary.
   - Offer 1–2 recommended next steps (e.g., "Get a physical exam," "Hydration and rest," "Call your doctor").
   - Include a short note reinforcing that this does not replace professional medical care.
6. **When uncertain**: If info is missing, say: "Not enough detail—please mention [missing info]".
`;

      // Determine image format from base64 data (default to jpeg if unclear)
      let mimeType = "image/jpeg";
      
      // Try to detect image format from base64 header if present
      if (imageBase64.startsWith('/9j/')) {
        mimeType = "image/jpeg";
      } else if (imageBase64.startsWith('iVBORw0KGgo')) {
        mimeType = "image/png";
      } else if (imageBase64.startsWith('R0lGOD')) {
        mimeType = "image/gif";
      } else if (imageBase64.startsWith('UklGR')) {
        mimeType = "image/webp";
      }

      console.log(`Detected image format: ${mimeType}`);

      // Convert base64 to the format Gemini expects
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      };

      const prompt = `${systemPrompt}\n\nPatient's question: ${userMessage}`;

      console.log('Sending image to Gemini for analysis...');
      
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('Image analysis completed successfully');
      return text;
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return "I can see the image you've shared, but I'm having trouble accessing the image analysis service due to an API configuration issue. Please try again later or describe your symptoms in text.";
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          return "I can see the image you've shared, but the image analysis service is currently at capacity. Please try again in a few minutes or describe your symptoms in text.";
        } else if (error.message.includes('Invalid image')) {
          return "I'm having trouble processing this image format. Please try uploading a different image (JPEG, PNG, or GIF) or describe your symptoms in text.";
        } else if (error.message.includes('safety')) {
          return "I can see the image you've shared, but I'm not able to analyze this particular type of content. Please describe your symptoms in text, and I'll be happy to help.";
        }
      }
      
      return "I can see the image you've shared, but I'm having trouble analyzing it right now. This could be due to image format issues or temporary service problems. Please try uploading the image again or describe your symptoms in text, and I'll be happy to help. For any concerning visual symptoms, please consult with a healthcare professional who can properly examine the area.";
    }
  }

  // Helper method to check if API is configured
  isConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }
}

export const geminiService = new GeminiService();