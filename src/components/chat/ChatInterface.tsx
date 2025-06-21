import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  AlertTriangle,
  Calendar,
  User,
  Loader2,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { geminiService, type GeminiMessage } from '../../services/geminiService';
import { elevenLabsService } from '../../services/elevenLabsService';
import { chatHistoryService, type ChatMessage, type ChatSession } from '../../services/supabaseService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  imageUrl?: string;
  isVoiceMessage?: boolean;
}

interface ChatInterfaceProps {
  onEmergencyEscalate?: () => void;
  onRequestDoctorReview?: () => void;
  initialMessage?: string;
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
}

export default function ChatInterface({ 
  onEmergencyEscalate, 
  onRequestDoctorReview, 
  initialMessage,
  sessionId,
  onSessionChange 
}: ChatInterfaceProps) {
  // Initialize with fresh welcome message - no previous messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm Dr. Ava, your AI health assistant. How can I help you today? You can type your message, record a voice note, or upload an image of any symptoms you'd like me to analyze.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<GeminiMessage[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedInitialMessage = useRef<string>('');
  const isProcessingInitialMessage = useRef(false);
  const hasLoadedSession = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat session on mount or when sessionId changes
  useEffect(() => {
    // Reset state when sessionId changes or component mounts
    if (!sessionId || sessionId !== currentSession?.id) {
      hasLoadedSession.current = false;
      processedInitialMessage.current = '';
      isProcessingInitialMessage.current = false;
      
      // Reset to fresh welcome message
      setMessages([{
        id: '1',
        type: 'ai',
        content: "Hello! I'm Dr. Ava, your AI health assistant. How can I help you today? You can type your message, record a voice note, or upload an image of any symptoms you'd like me to analyze.",
        timestamp: new Date()
      }]);
      setConversationHistory([]);
    }
    
    loadChatSession();
  }, [sessionId]);

  const loadChatSession = async () => {
    try {
      let session: ChatSession | null = null;

      if (sessionId) {
        // Load specific session
        session = await chatHistoryService.getSession(sessionId);
      } else {
        // For new chats, don't load any existing session
        // This ensures we start completely fresh
        session = null;
      }

      if (session && session.messages && session.messages.length > 0) {
        setCurrentSession(session);
        
        // Convert stored messages to component format
        const storedMessages: Message[] = session.messages.map((msg: ChatMessage) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          audioUrl: msg.audioUrl,
          imageUrl: msg.imageUrl,
          isVoiceMessage: msg.isVoiceMessage
        }));

        // Set messages with welcome message + stored messages
        setMessages([
          {
            id: '1',
            type: 'ai',
            content: "Hello! I'm Dr. Ava, your AI health assistant. How can I help you today? You can type your message, record a voice note, or upload an image of any symptoms you'd like me to analyze.",
            timestamp: new Date()
          },
          ...storedMessages
        ]);

        // Rebuild conversation history for AI context
        const history: GeminiMessage[] = [];
        storedMessages.forEach(msg => {
          if (msg.type === 'user') {
            history.push({ role: 'user', parts: msg.content });
          } else if (msg.type === 'ai') {
            history.push({ role: 'model', parts: msg.content });
          }
        });
        setConversationHistory(history);

        // Notify parent component of session change
        if (onSessionChange && session.id !== sessionId) {
          onSessionChange(session.id);
        }
      } else if (!sessionId) {
        // For new chats without sessionId, create a new session
        const newSession = await chatHistoryService.createNewSession();
        setCurrentSession(newSession);
        if (onSessionChange) {
          onSessionChange(newSession.id);
        }
      } else {
        // Session exists but has no messages, use it as is
        setCurrentSession(session);
      }

      hasLoadedSession.current = true;
    } catch (error) {
      console.error('Error loading chat session:', error);
      // Continue with default messages if loading fails
      hasLoadedSession.current = true;
    }
  };

  const saveMessageToHistory = async (message: Message) => {
    if (!currentSession || isSavingMessage) return;

    try {
      setIsSavingMessage(true);
      
      const chatMessage: ChatMessage = {
        id: message.id,
        type: message.type,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        audioUrl: message.audioUrl,
        imageUrl: message.imageUrl,
        isVoiceMessage: message.isVoiceMessage
      };

      await chatHistoryService.saveMessage(currentSession.id, chatMessage);
    } catch (error) {
      console.error('Error saving message to history:', error);
      // Don't throw error to avoid breaking chat flow
    } finally {
      setIsSavingMessage(false);
    }
  };

  const handleSendMessage = useCallback(async (content: string, audioUrl?: string, imageBase64?: string, isVoiceMessage = false) => {
    if (!content.trim() && !audioUrl && !imageBase64) return;

    console.log('ChatInterface: Sending message:', content);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content || (isVoiceMessage ? 'Voice message' : 'Image uploaded'),
      timestamp: new Date(),
      audioUrl,
      imageUrl: imageBase64 ? 'data:image/jpeg;base64,' + imageBase64 : undefined,
      isVoiceMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText(''); // Clear input immediately after adding to messages
    setIsLoading(true);

    // Save user message to history (without the base64 image data to save space)
    const messageToSave = { ...userMessage };
    if (imageBase64) {
      messageToSave.imageUrl = 'Medical image analyzed'; // Just save a placeholder
    }
    await saveMessageToHistory(messageToSave);

    try {
      let aiResponse: string;

      if (imageBase64) {
        // Use base64 directly for Gemini Vision API
        try {
          setIsProcessingImage(true);
          console.log('Processing image for AI analysis...');
          
          aiResponse = await geminiService.analyzeImage(imageBase64, content || 'Please analyze this medical image and provide insights.');
          
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          aiResponse = `I can see that you've uploaded an image, but I'm having trouble analyzing it right now. ${
            imageError instanceof Error ? imageError.message : 'Please try uploading the image again or describe your symptoms in text.'
          } For any concerning visual symptoms, please consult with a healthcare professional who can properly examine the area.`;
        } finally {
          setIsProcessingImage(false);
        }
      } else {
        aiResponse = await geminiService.generateResponse(
          content, 
          conversationHistory, 
          !!imageBase64, 
          isVoiceMessage
        );
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to history
      await saveMessageToHistory(aiMessage);

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', parts: content },
        { role: 'model', parts: aiResponse }
      ]);

      // Generate AI voice response using ElevenLabs (only if API is configured and working)
      if (elevenLabsService.isConfigured()) {
        try {
          const audioBuffer = await elevenLabsService.generateSpeech(aiResponse);
          const aiAudioUrl = elevenLabsService.createAudioUrl(audioBuffer);
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, audioUrl: aiAudioUrl }
              : msg
          ));
        } catch (voiceError) {
          console.error('Error generating AI voice:', voiceError);
          // Continue without voice - the text response is still available
          // Don't show error to user as voice is optional feature
        }
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm experiencing technical difficulties right now. For immediate medical concerns, please contact your healthcare provider or emergency services. I'll be back to assist you shortly.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveMessageToHistory(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory, currentSession, isSavingMessage]);

  // Handle initial message - only process once per unique message and after session is loaded
  useEffect(() => {
    if (initialMessage && 
        initialMessage.trim() && 
        processedInitialMessage.current !== initialMessage &&
        !isProcessingInitialMessage.current &&
        hasLoadedSession.current &&
        currentSession) {
      
      console.log('ChatInterface: Processing initial message:', initialMessage);
      processedInitialMessage.current = initialMessage;
      isProcessingInitialMessage.current = true;
      
      // Process the message immediately
      handleSendMessage(initialMessage).finally(() => {
        isProcessingInitialMessage.current = false;
      });
    }
  }, [initialMessage, handleSendMessage, currentSession, hasLoadedSession.current]);

  const transcribeAudioWithElevenLabs = async (audioBlob: Blob): Promise<string> => {
    try {
      setIsTranscribing(true);
      
      // Check if ElevenLabs is configured before attempting transcription
      if (!elevenLabsService.isConfigured()) {
        throw new Error('Speech-to-text service is not configured');
      }
      
      // Convert audio blob to the format ElevenLabs expects (WAV or MP3)
      const transcribedText = await elevenLabsService.transcribeAudio(audioBlob);
      
      if (!transcribedText || transcribedText.trim().length === 0) {
        return "I couldn't detect any speech in your recording. Please try speaking more clearly or closer to the microphone.";
      }
      
      return transcribedText;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('401'))) {
        return "Speech-to-text service is not available. Please type your message instead.";
      }
      
      return "I had trouble understanding your voice message. Please try speaking more clearly or type your message instead.";
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Use higher quality audio recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        try {
          // Transcribe the audio using ElevenLabs
          const transcribedText = await transcribeAudioWithElevenLabs(audioBlob);
          
          // Send the transcribed text as the message content
          await handleSendMessage(transcribedText, audioUrl, undefined, true);
        } catch (error) {
          console.error('Error transcribing audio:', error);
          // Fallback: send with generic voice message text
          await handleSendMessage('Voice message (transcription failed)', audioUrl, undefined, true);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const speakText = async (text: string, messageId: string) => {
    // Check if message already has AI-generated audio
    const message = messages.find(m => m.id === messageId);
    if (message?.audioUrl) {
      playAudio(message.audioUrl, messageId);
      return;
    }

    // Fallback to browser speech synthesis
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file is too large. Please select an image smaller than 10MB.');
        return;
      }

      console.log('Processing uploaded image:', file.name, file.type, file.size);

      // Convert image to base64 for Gemini
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result) {
            // Remove data:image/jpeg;base64, prefix
            const base64String = result.split(',')[1];
            if (base64String) {
              resolve(base64String);
            } else {
              reject(new Error('Failed to extract base64 data from image'));
            }
          } else {
            reject(new Error('Failed to read image file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      
      // Send message with base64 image data
      await handleSendMessage('Please analyze this image and provide medical insights.', undefined, base64);
      
    } catch (error) {
      console.error('Error handling image upload:', error);
      alert(`Failed to process the image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
      return;
    }

    const audio = new Audio(audioUrl);
    setPlayingAudio(messageId);
    
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => setPlayingAudio(null);
    
    audio.play();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        handleSendMessage(inputText);
      }
    }
  };

  const handleSendClick = () => {
    if (inputText.trim()) {
      handleSendMessage(inputText);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-blue-200">
            <img 
              src="/ava.webp" 
              alt="Dr. Ava" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Dr. Ava</h3>
            <p className="text-sm text-gray-600">AI Health Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRequestDoctorReview}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Doctor Review</span>
          </button>
          <button
            onClick={onEmergencyEscalate}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-white border-2 border-blue-200 overflow-hidden'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <img 
                    src="/ava.webp" 
                    alt="Dr. Ava" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.imageUrl} 
                      alt="Medical image" 
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-full h-32 bg-gray-200 rounded-lg border flex items-center justify-center';
                        placeholder.innerHTML = '<div class="text-center text-gray-500"><svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Medical image</p></div>';
                        target.parentNode?.insertBefore(placeholder, target);
                      }}
                    />
                  </div>
                )}
                
                {message.audioUrl && (
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={() => playAudio(message.audioUrl!, message.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      {playingAudio === message.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <div className={`flex-1 h-1 rounded-full ${
                      message.type === 'user' ? 'bg-blue-400' : 'bg-gray-300'
                    }`}>
                      <div className="h-full bg-current rounded-full w-1/3"></div>
                    </div>
                    {message.isVoiceMessage && (
                      <span className="text-xs opacity-75">🎤</span>
                    )}
                  </div>
                )}
                
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {message.type === 'ai' && (
                  <button
                    onClick={() => speakText(message.content, message.id)}
                    className="mt-2 flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {isSpeaking || playingAudio === message.id ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                    <span>{isSpeaking || playingAudio === message.id ? 'Stop' : 'Listen'}</span>
                  </button>
                )}
                
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {(isLoading || isTranscribing || isProcessingImage) && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-200 overflow-hidden flex items-center justify-center">
                <img 
                  src="/ava.webp" 
                  alt="Dr. Ava" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {isTranscribing ? 'Converting speech to text...' : 
                     isProcessingImage ? 'Analyzing image...' : 
                     'Dr. Ava is analyzing...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {isRecording && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">Recording...</span>
                <span className="text-sm text-red-600">{formatTime(recordingTime)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your symptoms, ask health questions, or upload an image..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isRecording || isLoading || isTranscribing || isProcessingImage}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRecording || isLoading || isTranscribing || isProcessingImage}
              title="Upload medical image"
            >
              <Camera className="w-5 h-5" />
            </button>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
              disabled={isLoading || isTranscribing || isProcessingImage}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleSendClick}
              disabled={!inputText.trim() || isRecording || isLoading || isTranscribing || isProcessingImage}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your conversations are secure and automatically saved
          </p>
        </div>
      </div>
    </div>
  );
}