import { useState, useEffect } from 'react';
import { X, User, CheckCircle, XCircle, MessageCircle, Search, Filter, Star, MapPin } from 'lucide-react';
import { patientService, profileService, type Doctor, type PatientDoctorRequest } from '../../services/supabaseService';
import DoctorSearchModal from './DoctorSearchModal';

interface MyDoctorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyDoctorsModal({ isOpen, onClose }: MyDoctorsModalProps) {
  const [myDoctors, setMyDoctors] = useState<Doctor[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PatientDoctorRequest[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'doctors' | 'requests' | 'browse'>('doctors');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  // Helper functions - moved to the top to avoid initialization errors
  const getDoctorFullName = (doctor: Doctor) => {
    console.log('Getting doctor full name for:', doctor);
    
    // Check if we have the profile data with full_name
    if (doctor.profile?.full_name) {
      return doctor.profile.full_name;
    }
    
    // If no profile, try to construct from other available data
    if (doctor.clinic_name) {
      return `Doctor at ${doctor.clinic_name}`;
    }
    
    // Fallback to a default name
    return 'Unknown Doctor';
  };

  const getDoctorInitials = (doctor: Doctor) => {
    const fullName = getDoctorFullName(doctor);
    if (fullName === 'Unknown Doctor' || fullName.startsWith('Doctor at')) {
      return 'DR';
    }
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRequestDoctorFullName = (request: PatientDoctorRequest) => {
    console.log('Getting request doctor full name for:', request);
    
    if (request.doctor?.full_name) {
      return request.doctor.full_name;
    }
    return 'Unknown Doctor';
  };

  const getRequestDoctorInitials = (request: PatientDoctorRequest) => {
    const fullName = getRequestDoctorFullName(request);
    if (fullName === 'Unknown Doctor') {
      return 'DR';
    }
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading data...');
      
      const [doctors, requests, allDocs] = await Promise.all([
        patientService.getMyDoctors(),
        patientService.getPendingRequests(),
        loadAllDoctors()
      ]);
      
      console.log('Loaded doctors:', doctors);
      console.log('Loaded requests:', requests);
      console.log('Loaded all doctors:', allDocs);
      
      setMyDoctors(doctors);
      setPendingRequests(requests);
      setAllDoctors(allDocs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllDoctors = async () => {
    try {
      console.log('Loading all doctors...');
      // Get all verified doctors
      const doctors = await profileService.searchDoctors(''); // Empty query returns all
      console.log('All doctors from search:', doctors);
      return doctors;
    } catch (error) {
      console.error('Error loading all doctors:', error);
      return [];
    }
  };

  const handleRequestDoctor = async (doctorProfileId: string, message?: string) => {
    try {
      console.log('Requesting doctor with profile ID:', doctorProfileId);
      await patientService.requestDoctor(doctorProfileId, message);
      // Refresh data to show the new request
      loadData();
    } catch (error) {
      console.error('Error requesting doctor:', error);
      alert('Failed to send request. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <MessageCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAlreadyConnected = (doctorProfileId: string) => {
    return myDoctors.some(doctor => doctor.profile_id === doctorProfileId);
  };

  const hasPendingRequest = (doctorProfileId: string) => {
    return pendingRequests.some(request => 
      request.doctor_id === doctorProfileId && request.status === 'pending'
    );
  };

  const getUniqueSpecialties = () => {
    const specialties = new Set<string>();
    allDoctors.forEach(doctor => {
      doctor.specialties.forEach(specialty => specialties.add(specialty));
    });
    return Array.from(specialties).sort();
  };

  const filteredDoctors = allDoctors.filter(doctor => {
    const doctorFullName = getDoctorFullName(doctor);
    const matchesSearch = !searchQuery || 
      doctorFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doctor.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === 'All' || 
      doctor.specialties.includes(specialtyFilter);
    
    return matchesSearch && matchesSpecialty;
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">My Healthcare Team</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'doctors'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Doctors ({myDoctors.length})
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse All Doctors ({allDoctors.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Requests ({pendingRequests.length})
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : activeTab === 'doctors' ? (
            <div>
              {/* My Doctors List */}
              {myDoctors.length > 0 ? (
                <div className="space-y-4">
                  {myDoctors.map((doctor) => (
                    <div key={doctor.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {getDoctorInitials(doctor)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            Dr. {getDoctorFullName(doctor)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="font-medium text-blue-700">
                              {doctor.specialties.join(', ')}
                            </span>
                            <span>•</span>
                            <span>{doctor.years_experience} years experience</span>
                          </div>
                          
                          {doctor.clinic_name && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{doctor.clinic_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                            <span>Languages: {(doctor.languages || []).join(', ')}</span>
                          </div>
                          
                          {doctor.bio && (
                            <p className="text-gray-700 text-sm">{doctor.bio}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Connected
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Send Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors added yet</h3>
                  <p className="text-gray-600 mb-6">
                    Browse and connect with doctors to build your healthcare team.
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Browse All Doctors
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'browse' ? (
            <div>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctors by name, specialty, or clinic..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white min-w-48"
                  >
                    <option value="All">All Specialties</option>
                    {getUniqueSpecialties().map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* All Doctors Grid */}
              {filteredDoctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDoctors.map((doctor) => {
                    const isConnected = isAlreadyConnected(doctor.profile_id);
                    const isPending = hasPendingRequest(doctor.profile_id);
                    
                    return (
                      <div key={doctor.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-all">
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
                              Languages: {(doctor.languages || []).join(', ')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          {isConnected ? (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              Connected
                            </span>
                          ) : isPending ? (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                              Request Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestDoctor(doctor.profile_id, `Hi Dr. ${getDoctorFullName(doctor)}, I would like to add you as my doctor.`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Send Request
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Pending Requests */}
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getRequestDoctorInitials(request)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Dr. {getRequestDoctorFullName(request)}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              Request sent: {formatDate(request.requested_at)}
                            </p>
                            {request.message && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-gray-700 text-sm">
                                  <strong>Your message:</strong> {request.message}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 text-sm">
                            ⏳ Waiting for Dr. {getRequestDoctorFullName(request)} to respond to your request.
                          </p>
                        </div>
                      )}
                      
                      {request.status === 'approved' && request.responded_at && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 text-sm">
                            ✅ Request approved on {formatDate(request.responded_at)}. 
                            Dr. {getRequestDoctorFullName(request)} is now your doctor!
                          </p>
                        </div>
                      )}
                      
                      {request.status === 'rejected' && request.responded_at && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">
                            ❌ Request declined on {formatDate(request.responded_at)}.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600 mb-6">
                    All your doctor requests have been processed.
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Browse Doctors
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DoctorSearchModal
        isOpen={showDoctorSearch}
        onClose={() => {
          setShowDoctorSearch(false);
          loadData(); // Refresh data after closing search modal
        }}
      />
    </>
  );
}