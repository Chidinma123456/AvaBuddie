import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/chat/ChatInterface';
import NewChatInterface from '../components/chat/NewChatInterface';
import ChatHistoryModal from '../components/chat/ChatHistoryModal';
import EmergencyModal from '../components/chat/EmergencyModal';
import DoctorReviewModal from '../components/chat/DoctorReviewModal';
import DoctorSchedulingModal from '../components/appointments/DoctorSchedulingModal';
import TavusVideoConsultation from '../components/video/TavusVideoConsultation';
import ProfileSettingsModal from '../components/patient/ProfileSettingsModal';
import MyDoctorsModal from '../components/patient/MyDoctorsModal';
import { 
  MessageCircle, 
  Video, 
  Calendar, 
  History, 
  AlertCircle, 
  Camera, 
  Plus,
  Menu,
  X,
  LogOut,
  Heart,
  User,
  Bell,
  Settings,
  Users
} from 'lucide-react';

function PatientHome({ 
  showNewChat, 
  onStartNewChat, 
  onNewChatClick, 
  initialMessage,
  onEmergencyEscalate,
  onRequestDoctorReview,
  currentSessionId,
  onSessionChange,
  onShowChatHistory,
  chatKey
}: {
  showNewChat: boolean;
  onStartNewChat: (message?: string) => void;
  onNewChatClick: () => void;
  initialMessage: string;
  onEmergencyEscalate: () => void;
  onRequestDoctorReview: () => void;
  currentSessionId?: string;
  onSessionChange: (sessionId: string) => void;
  onShowChatHistory: () => void;
  chatKey: number;
}) {
  return (
    <div className="h-full flex flex-col">
      {!showNewChat && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold mb-1">Chat with Dr. Ava</h1>
                <p className="text-blue-100 text-sm">
                  Your AI health assistant • Chat, voice messages, and image analysis
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onShowChatHistory}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                </button>
                <button
                  onClick={onNewChatClick}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {showNewChat ? (
          <NewChatInterface onStartChat={onStartNewChat} />
        ) : (
          <ChatInterface
            key={chatKey} // Use chatKey to force re-render
            onEmergencyEscalate={onEmergencyEscalate}
            onRequestDoctorReview={onRequestDoctorReview}
            initialMessage={initialMessage}
            sessionId={currentSessionId}
            onSessionChange={onSessionChange}
          />
        )}
      </div>
    </div>
  );
}

function PatientConsultations() {
  const [showVideoConsultation, setShowVideoConsultation] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Consultations</h2>
        
        {/* AI Video Consultation */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Doctor Consultation</h3>
              <p className="text-blue-700 text-sm">Powered by Tavus AI</p>
            </div>
          </div>
          <p className="text-gray-700 mb-6">
            Connect with Dr. Ava, our AI-powered virtual doctor, for face-to-face medical consultation with realistic video interaction.
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Real-time video conversation
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Natural speech interaction
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Available 24/7
            </div>
          </div>
          <button 
            onClick={() => setShowVideoConsultation(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Start AI Video Consultation
          </button>
        </div>

        {/* Recent Consultations */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Consultations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI Consultation with Dr. Ava</p>
                  <p className="text-sm text-gray-600">Yesterday at 2:30 PM • 15 minutes</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Completed</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI Consultation with Dr. Ava</p>
                  <p className="text-sm text-gray-600">Last week • 20 minutes</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {showVideoConsultation && (
        <TavusVideoConsultation
          onClose={() => setShowVideoConsultation(false)}
        />
      )}
    </div>
  );
}

function PatientImages() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Images</h2>
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Image Upload Available in Chat</h3>
          <p className="text-gray-600 mb-6">
            You can upload medical images directly in your chat with Dr. Ava for instant analysis and guidance.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              💡 <strong>Tip:</strong> Go to the Dr. Ava Chat and use the camera button to upload photos of symptoms, rashes, injuries, or medical documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientHistory() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical History</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">AI Video Consultation</h3>
              <span className="text-sm text-gray-500">Yesterday</span>
            </div>
            <p className="text-gray-600 text-sm">Discussed symptoms with Dr. Ava via video call and received health recommendations.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Chat with Dr. Ava</h3>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <p className="text-gray-600 text-sm">Discussed symptoms and received health recommendations via chat.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Doctor Review Request</h3>
              <span className="text-sm text-gray-500">Last week</span>
            </div>
            <p className="text-gray-600 text-sm">Scheduled appointment for follow-up consultation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientAppointments() {
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments</h2>
        
        {/* Upcoming Appointments */}
        <div className="space-y-4 mb-6">
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-green-900">Upcoming Consultation</h3>
              <span className="text-sm text-green-700">Tomorrow at 2:00 PM</span>
            </div>
            <p className="text-green-700 text-sm mb-2">Follow-up consultation with Dr. Sarah Johnson</p>
            <div className="flex items-center space-x-2">
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">Video Call</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">General Medicine</span>
            </div>
          </div>
          
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-blue-900">Scheduled Appointment</h3>
              <span className="text-sm text-blue-700">Next Friday at 10:30 AM</span>
            </div>
            <p className="text-blue-700 text-sm mb-2">Dermatology consultation with Dr. Priya Patel</p>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">In-Person</span>
              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">Dermatology</span>
            </div>
          </div>
        </div>

        {/* Schedule New Appointment Button */}
        <button 
          onClick={() => setShowSchedulingModal(true)}
          className="w-full text-blue-600 border border-blue-600 hover:bg-blue-50 py-3 rounded-lg font-medium transition-colors"
        >
          Schedule New Appointment
        </button>

        {/* Past Appointments */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Appointments</h3>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Dr. Michael Chen</h4>
                <span className="text-sm text-gray-500">Last week</span>
              </div>
              <p className="text-gray-600 text-sm mb-2">Internal Medicine consultation</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Video Call</span>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Summary
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Dr. Emily Rodriguez</h4>
                <span className="text-sm text-gray-500">2 weeks ago</span>
              </div>
              <p className="text-gray-600 text-sm mb-2">Family Medicine consultation</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Phone Call</span>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DoctorSchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => setShowSchedulingModal(false)}
      />
    </div>
  );
}

function PatientEmergency() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Emergency Services</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Emergency Assistance</h3>
          <p className="text-red-700 mb-6">For immediate medical emergencies, call emergency services.</p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Call Emergency (112)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDoctorReviewModal, setShowDoctorReviewModal] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showMyDoctors, setShowMyDoctors] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatKey, setChatKey] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartNewChat = useCallback((message?: string) => {
    console.log('PatientDashboard: Starting new chat with message:', message);
    
    // Set the initial message and switch to chat interface
    setInitialMessage(message || '');
    setShowNewChat(false);
    setCurrentSessionId(''); // Clear session to start fresh
    setChatKey(prev => prev + 1); // Force ChatInterface to re-render
  }, []);

  const handleNewChatClick = useCallback(() => {
    console.log('PatientDashboard: New chat clicked');
    setShowNewChat(true);
    setInitialMessage('');
    setCurrentSessionId('');
    setChatKey(prev => prev + 1);
  }, []);

  const handleSessionChange = useCallback((sessionId: string) => {
    console.log('PatientDashboard: Session changed to:', sessionId);
    setCurrentSessionId(sessionId);
    setShowNewChat(false);
    setInitialMessage(''); // Clear initial message when switching sessions
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    console.log('PatientDashboard: Selecting session:', sessionId);
    setCurrentSessionId(sessionId);
    setShowNewChat(false);
    setInitialMessage('');
    setChatKey(prev => prev + 1);
  }, []);

  const navigationItems = [
    { id: 'chat', icon: MessageCircle, label: 'Dr. Ava Chat' },
    { id: 'consultations', icon: Video, label: 'Consultations' },
    { id: 'images', icon: Camera, label: 'Upload Images' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'appointments', icon: Calendar, label: 'Appointments' },
    { id: 'emergency', icon: AlertCircle, label: 'Emergency' }
  ];

  const handleNavigation = (viewId: string) => {
    setCurrentView(viewId);
    setSidebarOpen(false);
    // Reset chat state when navigating away from chat
    if (viewId !== 'chat') {
      setShowNewChat(false);
      setInitialMessage('');
      setChatKey(prev => prev + 1);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'chat':
        return (
          <PatientHome 
            showNewChat={showNewChat}
            onStartNewChat={handleStartNewChat}
            onNewChatClick={handleNewChatClick}
            initialMessage={initialMessage}
            onEmergencyEscalate={() => setShowEmergencyModal(true)}
            onRequestDoctorReview={() => setShowDoctorReviewModal(true)}
            currentSessionId={currentSessionId}
            onSessionChange={handleSessionChange}
            onShowChatHistory={() => setShowChatHistory(true)}
            chatKey={chatKey}
          />
        );
      case 'consultations':
        return <PatientConsultations />;
      case 'images':
        return <PatientImages />;
      case 'history':
        return <PatientHistory />;
      case 'appointments':
        return <PatientAppointments />;
      case 'emergency':
        return <PatientEmergency />;
      default:
        return (
          <PatientHome 
            showNewChat={showNewChat}
            onStartNewChat={handleStartNewChat}
            onNewChatClick={handleNewChatClick}
            initialMessage={initialMessage}
            onEmergencyEscalate={() => setShowEmergencyModal(true)}
            onRequestDoctorReview={() => setShowDoctorReviewModal(true)}
            currentSessionId={currentSessionId}
            onSessionChange={handleSessionChange}
            onShowChatHistory={() => setShowChatHistory(true)}
            chatKey={chatKey}
          />
        );
    }
  };

  const getCurrentViewTitle = () => {
    const item = navigationItems.find(item => item.id === currentView);
    return item ? item.label : 'Dr. Ava Chat';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AvaBuddie</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium text-left
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-600">Patient</p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setShowMyDoctors(true)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              <span>My Doctors</span>
            </button>
            <button
              onClick={() => setShowProfileSettings(true)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{getCurrentViewTitle()}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => setShowProfileSettings(true)}
              className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
            >
              <User className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full">
          {renderCurrentView()}
        </div>
      </main>

      {/* Modals */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      <DoctorReviewModal
        isOpen={showDoctorReviewModal}
        onClose={() => setShowDoctorReviewModal(false)}
      />

      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />

      <MyDoctorsModal
        isOpen={showMyDoctors}
        onClose={() => setShowMyDoctors(false)}
      />

      <ChatHistoryModal
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onSelectSession={handleSelectSession}
        currentSessionId={currentSessionId}
      />
    </div>
  );
}