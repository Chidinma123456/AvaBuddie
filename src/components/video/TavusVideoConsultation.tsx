import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { tavusService } from '../../services/tavusService';

interface TavusVideoConsultationProps {
  onClose: () => void;
}

export default function TavusVideoConsultation({ onClose }: TavusVideoConsultationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [hasUserMedia, setHasUserMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isUsingMockMode, setIsUsingMockMode] = useState(false);
  const [showExternalLink, setShowExternalLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }
      if (conversationId && !conversationId.startsWith('mock_') && !conversationId.startsWith('fallback_')) {
        tavusService.endConversation(conversationId);
      }
    };
  }, [conversationId]);

  const setupUserMedia = async () => {
    try {
      console.log('Requesting user media...');
      setMediaError(null);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera and microphone access. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('User media obtained successfully:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrack: stream.getVideoTracks()[0]?.getSettings(),
        audioTrack: stream.getAudioTracks()[0]?.getSettings()
      });
      
      streamRef.current = stream;
      setHasUserMedia(true);
      
      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Add event listeners for video element
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight
          });
          if (videoRef.current) {
            videoRef.current.play().catch(e => {
              console.error('Error playing video:', e);
              setMediaError('Failed to start video playback');
            });
          }
        };

        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };

        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
          setMediaError('Video playback error');
        };

        // Force load the video
        videoRef.current.load();
      }

      return stream;
    } catch (err) {
      console.error('Error accessing user media:', err);
      
      let errorMessage = 'Unable to access camera and microphone.';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera and microphone access denied. Please allow access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found. Please connect a camera and microphone and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera or microphone is already in use by another application. Please close other applications and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera or microphone does not meet the required specifications. Please try with different settings.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera and microphone access blocked due to security restrictions. Please check your browser settings.';
        } else {
          errorMessage = err.message || errorMessage;
        }
      }
      
      setMediaError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const startConsultation = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);
    setMediaError(null);

    try {
      // First, get user media
      await setupUserMedia();

      // Check if Tavus is properly configured
      const configStatus = tavusService.getConfigurationStatus();
      console.log('Tavus configuration status:', configStatus);
      
      if (!tavusService.isConfigured()) {
        console.warn('Tavus not configured, using mock mode');
        setIsUsingMockMode(true);
        setError('Tavus API not configured. Using demo mode - video consultation features are limited.');
      }

      // Create Tavus conversation
      console.log('Creating Tavus conversation...');
      const conversation = await tavusService.createConversation();
      
      console.log('Conversation created:', conversation);
      setConversationId(conversation.conversation_id);
      
      if (conversation.conversation_url) {
        setConversationUrl(conversation.conversation_url);
        console.log('Conversation URL set:', conversation.conversation_url);
        
        // Check if URL is accessible (for CORS issues)
        if (conversation.conversation_url.includes('tavus') || conversation.conversation_url.includes('daily.co')) {
          setShowExternalLink(true);
        }
      }

      // Try to add initial medical context to the conversation (non-blocking)
      if (conversation.conversation_id && tavusService.isConfigured()) {
        // Make this call non-blocking
        tavusService.updateConversationContext(
          conversation.conversation_id,
          'Patient has initiated a video consultation for medical guidance and health assessment.'
        ).then((success) => {
          if (success) {
            console.log('Conversation context updated successfully');
          } else {
            console.log('Conversation context update failed, using default configuration');
          }
        }).catch((err) => {
          console.log('Conversation context update error (non-blocking):', err.message);
        });
      }
      
      // Simulate connection process
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('Video consultation started successfully');
      }, 3000);

    } catch (err) {
      console.error('Error starting consultation:', err);
      let errorMessage = 'Failed to start video consultation. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('API key')) {
          errorMessage = 'Tavus API key not configured. Please check your environment variables.';
        } else if (err.message.includes('persona')) {
          errorMessage = 'Dr. Ava persona not found. Please check your Tavus configuration.';
        } else if (err.message.includes('permissions') || err.message.includes('access')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsConnecting(false);
      setConnectionStatus('error');
    }
  };

  const endConsultation = async () => {
    console.log('Ending consultation...');
    
    if (conversationId && !conversationId.startsWith('mock_') && !conversationId.startsWith('fallback_')) {
      await tavusService.endConversation(conversationId);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('idle');
    setHasUserMedia(false);
    setMediaError(null);
    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted; // If currently muted, enable; if not muted, disable
        console.log(`Audio track ${isMuted ? 'enabled' : 'disabled'}`);
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled; // Toggle the enabled state
        console.log(`Video track ${!isVideoEnabled ? 'enabled' : 'disabled'}`);
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const openExternalConsultation = () => {
    if (conversationUrl) {
      window.open(conversationUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl mx-4 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-blue-200">
                <img 
                  src="/ava.webp" 
                  alt="Dr. Ava" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-white">Dr. Ava - AI Medical Consultation</h3>
                <p className="text-white/70 text-sm">
                  {connectionStatus === 'connecting' && 'Connecting to Dr. Ava...'}
                  {connectionStatus === 'connected' && 'Connected - Ready for consultation'}
                  {connectionStatus === 'idle' && 'Ready to connect'}
                  {connectionStatus === 'error' && 'Connection failed'}
                  {isUsingMockMode && ' (Demo Mode)'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {conversationId && (
                <span className="text-xs text-white/50 font-mono">
                  ID: {conversationId.substring(0, 8)}...
                </span>
              )}
              <button
                onClick={endConsultation}
                className="text-white/70 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-gray-900 relative">
          {!isConnected && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-2xl">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-blue-200">
                    <img 
                      src="/ava.webp" 
                      alt="Dr. Ava" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Start AI Video Consultation</h3>
                <p className="text-white/70 mb-6 text-lg leading-relaxed">
                  Connect with Dr. Ava, your AI-powered virtual doctor, for personalized medical consultation. 
                  Dr. Ava uses persona ID: p9863a04af01 for authentic medical interactions.
                </p>
                
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6 mb-8">
                  <h4 className="text-white font-semibold mb-3">What Dr. Ava can help with:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/80">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Symptom assessment and guidance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Health and wellness advice</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Medication information</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Emergency triage support</span>
                    </div>
                  </div>
                </div>

                {(error || mediaError) && (
                  <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">{error || mediaError}</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={startConsultation}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Consultation with Dr. Ava
                </button>
                
                <div className="mt-6 text-center">
                  <p className="text-white/50 text-sm">
                    📹 Camera and microphone access required for video consultation
                  </p>
                  {!tavusService.isConfigured() && (
                    <p className="text-yellow-400/70 text-sm mt-2">
                      ⚠️ Tavus API not configured - demo mode will be used
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-4">Connecting to Dr. Ava...</h3>
                <div className="space-y-2 text-white/70">
                  <p>• {hasUserMedia ? '✓' : '○'} Camera and microphone access</p>
                  <p>• {conversationId ? '✓' : '○'} Initializing AI medical assistant</p>
                  <p>• {conversationUrl ? '✓' : '○'} Setting up secure video connection</p>
                  <p>• Loading medical knowledge base</p>
                </div>
                <div className="mt-6 bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-white/80">
                    Dr. Ava (persona: p9863a04af01) is being configured with medical expertise to provide you with the best possible consultation experience.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isConnected && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {/* AI Doctor Video */}
              <div className="bg-gray-800 rounded-xl overflow-hidden relative">
                {conversationUrl && 
                 !conversationUrl.includes('mock-tavus-conversation') && 
                 tavusService.isConfigured() && 
                 !showExternalLink ? (
                  <>
                    <iframe
                      ref={iframeRef}
                      src={conversationUrl}
                      className="w-full h-full"
                      allow="camera; microphone"
                      title="Dr. Ava Video Consultation"
                      onError={() => {
                        console.log('Iframe failed to load, showing external link option');
                        setShowExternalLink(true);
                      }}
                    />
                    {/* Fallback for iframe loading issues */}
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={openExternalConsultation}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in New Window</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-blue-200">
                          <img 
                            src="/ava.webp" 
                            alt="Dr. Ava" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <h4 className="text-xl font-semibold mb-2">Dr. Ava</h4>
                      <p className="text-sm opacity-80 mb-4">AI Medical Assistant (ID: p9863a04af01)</p>
                      <div className="bg-white/20 rounded-lg p-3 max-w-xs mx-auto mb-4">
                        <p className="text-xs">
                          "Hello! I'm ready to help with your health concerns. Please tell me what's bothering you today."
                        </p>
                      </div>
                      
                      {/* Show external link option if iframe fails or CORS issues */}
                      {conversationUrl && showExternalLink && tavusService.isConfigured() && (
                        <button
                          onClick={openExternalConsultation}
                          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Video Consultation</span>
                        </button>
                      )}
                      
                      {!tavusService.isConfigured() && (
                        <div className="mt-4 text-xs opacity-60">
                          Demo Mode - Tavus API not configured
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span>Dr. Ava - Online</span>
                  </span>
                </div>
              </div>

              {/* Patient Video */}
              <div className="bg-gray-800 rounded-xl overflow-hidden relative">
                {hasUserMedia && !mediaError ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                      style={{ transform: 'scaleX(-1)' }} // Mirror the video
                    />
                    {!isVideoEnabled && (
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                        <div className="text-center text-white">
                          <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm">Camera Off</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <p className="text-sm">Camera not available</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {mediaError || 'Check permissions'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    {isMuted && <MicOff className="w-3 h-3" />}
                    <span>You</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {isConnected && (
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-b-2xl">
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                  !isVideoEnabled 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </button>

              {/* External Link Button */}
              {conversationUrl && showExternalLink && tavusService.isConfigured() && (
                <button
                  onClick={openExternalConsultation}
                  className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
                  title="Open consultation in new window"
                >
                  <ExternalLink className="w-6 h-6 text-white" />
                </button>
              )}

              <button
                onClick={endConsultation}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg shadow-red-500/25"
                title="End consultation"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-white/70 text-sm mb-2">
                🔒 This consultation is secure and private • Powered by Tavus AI
              </p>
              <p className="text-white/50 text-xs">
                Dr. Ava is an AI assistant. For emergencies, please contact emergency services immediately.
              </p>
              {hasUserMedia && !mediaError && (
                <p className="text-green-400/70 text-xs mt-1">
                  ✓ Camera and microphone connected
                </p>
              )}
              {mediaError && (
                <p className="text-red-400/70 text-xs mt-1">
                  ⚠ {mediaError}
                </p>
              )}
              {showExternalLink && conversationUrl && tavusService.isConfigured() && (
                <p className="text-blue-400/70 text-xs mt-1">
                  💡 If video doesn't load, click the external link button to open in a new window
                </p>
              )}
              {isUsingMockMode && (
                <p className="text-yellow-400/70 text-xs mt-1">
                  ⚠ Demo mode - Limited functionality without Tavus API
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}