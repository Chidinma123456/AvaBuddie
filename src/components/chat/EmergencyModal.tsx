import React, { useState } from 'react';
import { AlertTriangle, Phone, X, MapPin, Clock } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleEmergencyCall = () => {
    setIsConnecting(true);
    // Simulate emergency call connection
    setTimeout(() => {
      window.open('tel:112', '_self');
      setIsConnecting(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Emergency Services</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium mb-2">⚠️ This is for medical emergencies only</p>
            <p className="text-red-700 text-sm">
              If you're experiencing a life-threatening emergency, please call immediately.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Your location will be shared with emergency services</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Average response time: 8-12 minutes</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEmergencyCall}
            disabled={isConnecting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                <span>Call Emergency Services (112)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            For non-emergency medical questions, continue chatting with our AI assistant
          </p>
        </div>
      </div>
    </div>
  );
}