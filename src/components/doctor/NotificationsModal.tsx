import { useState } from 'react';
import { X, Bell, AlertTriangle, User, MessageCircle, Calendar, Check, XCircle } from 'lucide-react';
import { type Notification } from '../../services/supabaseService';
import { doctorService } from '../../services/supabaseService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onPatientAccepted?: () => void; // Callback to refresh patient list
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onPatientAccepted
}: NotificationsModalProps) {
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleAcceptPatient = async (notification: Notification) => {
    if (!notification.data?.request_id) return;

    const requestId = notification.data.request_id;
    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      await doctorService.approveRequest(requestId);
      
      // Mark notification as read
      onMarkAsRead(notification.id);
      
      // Notify parent component to refresh patient list
      if (onPatientAccepted) {
        onPatientAccepted();
      }

      console.log('Patient request approved successfully');
    } catch (error) {
      console.error('Error approving patient request:', error);
      alert('Failed to accept patient request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectPatient = async (notification: Notification) => {
    if (!notification.data?.request_id) return;

    const reason = prompt('Please provide a reason for declining this request (optional):');
    if (reason === null) return; // User cancelled

    const requestId = notification.data.request_id;
    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      await doctorService.rejectRequest(requestId, reason || undefined);
      
      // Mark notification as read
      onMarkAsRead(notification.id);

      console.log('Patient request rejected successfully');
    } catch (error) {
      console.error('Error rejecting patient request:', error);
      alert('Failed to reject patient request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'doctor_request':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'report_received':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'appointment_reminder':
        return <Calendar className="w-5 h-5 text-orange-600" />;
      case 'system':
        return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'doctor_request':
        return 'bg-blue-50 border-blue-200';
      case 'report_received':
        return 'bg-green-50 border-green-200';
      case 'appointment_reminder':
        return 'bg-orange-50 border-orange-200';
      case 'system':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const renderNotificationActions = (notification: Notification) => {
    if (notification.type === 'doctor_request' && notification.data?.request_id && !notification.read) {
      const requestId = notification.data.request_id;
      const isProcessing = processingRequests.has(requestId);

      return (
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptPatient(notification);
            }}
            disabled={isProcessing}
            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
            ) : (
              <Check className="w-3 h-3" />
            )}
            <span>Accept Patient</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRejectPatient(notification);
            }}
            disabled={isProcessing}
            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>Decline</span>
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-gray-600 text-sm">
                {unreadNotifications.length} unread of {notifications.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadNotifications.length > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">You'll see notifications here when patients request you or send reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Unread ({unreadNotifications.length})
                </h3>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border rounded-xl p-4 ${getNotificationColor(notification.type)} cursor-pointer hover:shadow-md transition-all`}
                      onClick={() => notification.type !== 'doctor_request' && onMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{notification.message}</p>
                          {notification.data && Object.keys(notification.data).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              {notification.data.patient_name && (
                                <span>Patient: {notification.data.patient_name}</span>
                              )}
                            </div>
                          )}
                          {renderNotificationActions(notification)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Read Notifications */}
            {readNotifications.length > 0 && (
              <div>
                {unreadNotifications.length > 0 && <hr className="my-6" />}
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Read ({readNotifications.length})
                </h3>
                <div className="space-y-3">
                  {readNotifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50 opacity-75"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 opacity-60">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-700 text-sm">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{notification.message}</p>
                          {notification.data?.patient_name && (
                            <div className="mt-1 text-xs text-gray-500">
                              Patient: {notification.data.patient_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}