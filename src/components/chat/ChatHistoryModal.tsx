import { useState, useEffect } from 'react';
import { X, MessageCircle, Calendar, Trash2, Edit3, Plus } from 'lucide-react';
import { chatHistoryService, type ChatSession } from '../../services/supabaseService';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
}

export default function ChatHistoryModal({ 
  isOpen, 
  onClose, 
  onSelectSession, 
  currentSessionId 
}: ChatHistoryModalProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const allSessions = await chatHistoryService.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const newSession = await chatHistoryService.createNewSession();
      setSessions(prev => [newSession, ...prev]);
      onSelectSession(newSession.id);
      onClose();
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    try {
      await chatHistoryService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleting current session, create a new one
      if (sessionId === currentSessionId) {
        const newSession = await chatHistoryService.createNewSession();
        setSessions(prev => [newSession, ...prev]);
        onSelectSession(newSession.id);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleEditSessionName = (sessionId: string, currentName: string) => {
    setEditingSession(sessionId);
    setEditName(currentName);
  };

  const handleSaveSessionName = async (sessionId: string) => {
    if (!editName.trim()) return;

    try {
      await chatHistoryService.updateSessionName(sessionId, editName.trim());
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, session_name: editName.trim() }
          : s
      ));
      setEditingSession(null);
      setEditName('');
    } catch (error) {
      console.error('Error updating session name:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditName('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLastMessagePreview = (session: ChatSession) => {
    if (!session.messages || session.messages.length === 0) {
      return 'No messages yet';
    }

    const lastMessage = session.messages[session.messages.length - 1];
    const preview = lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content;
    
    return `${lastMessage.type === 'user' ? 'You: ' : 'Dr. Ava: '}${preview}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleCreateNewSession}
          className="w-full flex items-center space-x-3 p-4 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all mb-4"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Start New Chat</p>
            <p className="text-sm text-gray-600">Begin a fresh conversation with Dr. Ava</p>
          </div>
        </button>

        {/* Sessions List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat history...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`border rounded-xl p-4 transition-all cursor-pointer ${
                  session.id === currentSessionId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (editingSession !== session.id) {
                    onSelectSession(session.id);
                    onClose();
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingSession === session.id ? (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveSessionName(session.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveSessionName(session.id);
                          }}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {session.session_name}
                      </h3>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {getLastMessagePreview(session)}
                    </p>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(session.last_message_at)}</span>
                      <span>•</span>
                      <span>{session.messages?.length || 0} messages</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSessionName(session.id, session.session_name);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename chat"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chat history yet</h3>
            <p className="text-gray-600 mb-6">
              Start your first conversation with Dr. Ava to begin building your chat history.
            </p>
            <button
              onClick={handleCreateNewSession}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Start First Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}