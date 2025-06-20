import { useState, useEffect } from 'react';
import { X, Search, MapPin, Star, Send, CheckCircle } from 'lucide-react';
import { profileService, patientService, type Doctor } from '../../services/supabaseService';

interface DoctorSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoctorSearchModal({ isOpen, onClose }: DoctorSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && searchQuery.trim()) {
      searchDoctors();
    }
  }, [searchQuery, isOpen]);

  const searchDoctors = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await profileService.searchDoctors(searchQuery);
      setDoctors(results);
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDoctor = async () => {
    if (!selectedDoctor) return;
    
    setIsSubmitting(true);
    try {
      await patientService.requestDoctor(selectedDoctor.profile_id, message);
      setIsSubmitted(true);
      
      // Reset after showing success
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedDoctor(null);
        setMessage('');
        setSearchQuery('');
        setDoctors([]);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error requesting doctor:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get doctor's full name with fallback
  const getDoctorFullName = (doctor: Doctor) => {
    return doctor.profile?.full_name || 'Unknown Doctor';
  };

  // Helper function to get doctor's initials
  const getDoctorInitials = (doctor: Doctor) => {
    const fullName = getDoctorFullName(doctor);
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-2">
            Your request has been sent to Dr. {getDoctorFullName(selectedDoctor!)}.
          </p>
          <p className="text-sm text-gray-500">
            You'll receive a notification when they respond.
          </p>
        </div>
      </div>
    );
  }

  if (selectedDoctor) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Search className="w-5 h-5" />
              <span>Back to Search</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Doctor Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {getDoctorInitials(selectedDoctor)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Dr. {getDoctorFullName(selectedDoctor)}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span className="font-medium text-blue-700">
                    {selectedDoctor.specialties.join(', ')}
                  </span>
                  <span>•</span>
                  <span>{selectedDoctor.years_experience} years experience</span>
                </div>
                
                {selectedDoctor.clinic_name && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedDoctor.clinic_name}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <span>Languages: {selectedDoctor.languages.join(', ')}</span>
                </div>
                
                {selectedDoctor.bio && (
                  <p className="text-gray-700 text-sm">{selectedDoctor.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Request Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Doctor (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like this doctor to be your primary care physician..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> The doctor will receive your request and can choose to accept or decline. 
                If accepted, they'll be able to review your AI consultation reports when you choose to share them.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleRequestDoctor}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Find Your Doctor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, specialty, or clinic..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Search Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Searching doctors...</p>
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getDoctorInitials(doctor)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Dr. {getDoctorFullName(doctor)}
                    </h3>
                    <p className="text-blue-600 text-sm font-medium mb-1">
                      {doctor.specialties.join(', ')}
                    </p>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {doctor.years_experience} years experience
                      </span>
                    </div>
                    {doctor.clinic_name && (
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{doctor.clinic_name}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Languages: {doctor.languages.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try searching with different keywords or specialties.</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Doctors</h3>
            <p className="text-gray-600">Enter a doctor's name, specialty, or clinic to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}