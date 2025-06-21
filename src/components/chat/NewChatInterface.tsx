import { useState, useRef } from 'react';
import { MessageCircle, Camera, Mic, Send, ArrowRight } from 'lucide-react';

interface NewChatInterfaceProps {
  onStartChat: (initialMessage?: string) => void;
}

export default function NewChatInterface({ onStartChat }: NewChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const processedQuickStarts = useRef(new Set<string>());

  const handleStartChat = () => {
    if (isStarting) return; // Prevent double execution
    
    const messageToSend = inputText.trim();
    console.log('NewChatInterface: Starting chat with message:', messageToSend);
    
    setIsStarting(true);
    
    if (messageToSend) {
      onStartChat(messageToSend);
      setInputText('');
    } else {
      // Start chat without initial message
      onStartChat();
    }
    
    // Reset after a short delay
    setTimeout(() => setIsStarting(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  const handleQuickStart = (message: string) => {
    if (isStarting) return; // Prevent double execution
    
    // Create a unique key for this quick start to prevent duplicates
    const quickStartKey = `${message}-${Date.now()}`;
    
    if (processedQuickStarts.current.has(message)) {
      console.log('Quick start already processed, ignoring:', message);
      return;
    }
    
    processedQuickStarts.current.add(message);
    console.log('NewChatInterface: Quick start with message:', message);
    
    setIsStarting(true);
    onStartChat(message);
    
    // Clean up processed quick starts after delay
    setTimeout(() => {
      processedQuickStarts.current.delete(message);
      setIsStarting(false);
    }, 2000);
  };

  const quickStartOptions = [
    {
      icon: '🤒',
      title: 'I have symptoms',
      description: 'Describe your symptoms for health guidance',
      message: 'I have some symptoms I\'d like to discuss'
    },
    {
      icon: '💊',
      title: 'Medication question',
      description: 'Ask about medications or interactions',
      message: 'I have a question about my medication'
    },
    {
      icon: '🩺',
      title: 'General health',
      description: 'General health and wellness questions',
      message: 'I have a general health question'
    },
    {
      icon: '🏥',
      title: 'Emergency guidance',
      description: 'Need help determining urgency',
      message: 'I need help determining if this is urgent'
    }
  ];

  const capabilities = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'Chat with AI',
      description: 'Type your health questions and get instant responses'
    },
    {
      icon: <Mic className="w-5 h-5" />,
      title: 'Voice Messages',
      description: 'Record voice messages for hands-free interaction'
    },
    {
      icon: <Camera className="w-5 h-5" />,
      title: 'Image Analysis',
      description: 'Upload photos of symptoms for visual assessment'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-blue-200">
            <img 
              src="/ava.webp" 
              alt="Dr. Ava" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Start New Chat with Dr. Ava</h2>
            <p className="text-gray-600 text-sm">Your AI health assistant is ready to help</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-blue-200">
              <img 
                src="/ava.webp" 
                alt="Dr. Ava" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Hello! I'm Dr. Ava, your AI health assistant
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            I'm here to help with your health questions, analyze symptoms, and provide medical guidance. 
            How can I assist you today?
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Quick Start Options
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickStartOptions.map((option, index) => (
              <button
                key={`${option.title}-${index}`}
                onClick={() => handleQuickStart(option.message)}
                disabled={isStarting}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 group-hover:text-blue-700 mb-1">
                      {option.title}
                    </h5>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            What I Can Help With
          </h4>
          <div className="space-y-3">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600">
                  {capability.icon}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{capability.title}</h5>
                  <p className="text-sm text-gray-600">{capability.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-amber-600 text-sm">⚠️</span>
            </div>
            <div>
              <h5 className="font-medium text-amber-900 mb-1">Important Medical Disclaimer</h5>
              <p className="text-sm text-amber-800">
                I provide general health information and guidance, but I'm not a replacement for professional medical care. 
                For emergencies or serious concerns, please contact your healthcare provider or emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your health question here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isStarting}
            />
          </div>
          
          <button
            onClick={handleStartChat}
            disabled={isStarting}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl flex items-center justify-center transition-colors"
            title="Start chat"
          >
            {isStarting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your conversations are secure and private • Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
}