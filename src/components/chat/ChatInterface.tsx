import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { geminiService } from '../../services/geminiService';
import { elevenLabsService } from '../../services/elevenLabsService';

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
}

export default function ChatInterface({ onEmergencyEscalate, onRequestDoctorReview, initialMessage }: ChatInterfaceProps) {
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
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedInitialMessage = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (content: string, audioUrl?: string, imageUrl?: string, isVoiceMessage = false) => {
    if (!content.trim() && !audioUrl && !imageUrl) return;

    console.log('ChatInterface: Sending message:', content);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content || (isVoiceMessage ? 'Voice message' : 'Image uploaded'),
      timestamp: new Date(),
      audioUrl,
      imageUrl,
      isVoiceMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText(''); // Clear input immediately after adding to messages
    setIsLoading(true);

    try {
      let aiResponse: string;

      if (imageUrl) {
        // Convert image to base64 for Gemini Vision API
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]); // Remove data:image/jpeg;base64, prefix
          };
          reader.readAsDataURL(blob);
        });

        aiResponse = await geminiService.analyzeImage(base64, content);
      } else {
        aiResponse = await geminiService.generateResponse(
          content, 
          conversationHistory, 
          !!imageUrl, 
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

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: content },
        { role: 'assistant', content: aiResponse }
      ]);

      // Generate AI voice response using ElevenLabs (only if API is configured)
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
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory]);

  // Handle initial message - only process once per unique message
  useEffect(() => {
    if (initialMessage && 
        initialMessage.trim() && 
        processedInitialMessage.current !== initialMessage) {
      
      console.log('ChatInterface: Processing initial message:', initialMessage);
      processedInitialMessage.current = initialMessage;
      
      // Process the message immediately
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, handleSendMessage]);

  const transcribeAudioWithElevenLabs = async (audioBlob: Blob): Promise<string> => {
    try {
      setIsTranscribing(true);
      
      // Convert audio blob to the format ElevenLabs expects (WAV or MP3)
      const transcribedText = await elevenLabsService.transcribeAudio(audioBlob);
      
      if (!transcribedText || transcribedText.trim().length === 0) {
        return "I couldn't detect any speech in your recording. Please try speaking more clearly or closer to the microphone.";
      }
      
      return transcribedText;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      if (error instanceof Error && error.message.includes('API key')) {
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      handleSendMessage('Please analyze this image and provide medical insights.', undefined, imageUrl);
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                  <img 
                    src={message.imageUrl} 
                    alt="Uploaded" 
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
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
        
        {(isLoading || isTranscribing) && (
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
                    {isTranscribing ? 'Converting speech to text...' : 'Dr. Ava is analyzing...'}
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
                disabled={isRecording || isLoading || isTranscribing}
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
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center transition-colors"
              disabled={isRecording || isLoading || isTranscribing}
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
              disabled={isLoading || isTranscribing}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleSendClick}
              disabled={!inputText.trim() || isRecording || isLoading || isTranscribing}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your conversations are secure
          </p>
        </div>
      </div>
    </div>
  );
}