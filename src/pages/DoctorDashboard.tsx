import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doctorService, type Profile, type PatientDoctorRequest } from '../services/supabaseService';
import AddPatientModal from '../components/doctor/AddPatientModal';
import ScheduleAppointmentModal from '../components/doctor/ScheduleAppointmentModal';
import ReviewCasesModal from '../components/doctor/ReviewCasesModal';
import { 
  Users, 
  Calendar, 
  FileText, 
  Video, 
  Clock, 
  CheckCircle,
  Menu,
  X,
  LogOut,
  Heart,
  User,
  Bell,
  Phone,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface Patient extends Profile {
  lastVisit?: string;
  nextAppointment?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  condition?: string;
  status?: 'Stable' | 'Critical' | 'Improving' | 'Monitoring';
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: 'Video' | 'Phone' | 'In-Person';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  duration: string;
  notes?: string;
}

const mockAppointments: Appointment[] = [
  {
    id: 'A001',
    patientName: 'Michael Johnson',
    time: '2:00 PM - 2:30 PM',
    type: 'Video',
    status: 'Scheduled',
    duration: '30 min',
    notes: 'Follow-up consultation'
  },
  {
    id: 'A002',
    patientName: 'Emma Wilson',
    time: '3:00 PM - 3:30 PM',
    type: 'Video',
    status: 'Scheduled',
    duration: '30 min'
  },
  {
    id: 'A003',
    patientName: 'David Brown',
    time: '4:00 PM - 4:45 PM',
    type: 'In-Person',
    status: 'Scheduled',
    duration: '45 min',
    notes: 'Physical examination'
  }
];

function DoctorHome({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter,
  patients,
  setPatients,
  appointments,
  setAppointments,
  pendingRequests,
  isLoading
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  pendingRequests: PatientDoctorRequest[];
  isLoading: boolean;
}) {
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReviewCasesModal, setShowReviewCasesModal] = useState(false);

  const filteredPatients = patients.filter(patient => {
    if (!patient) return false;
    
    const matchesSearch = patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.condition || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (patient.status || 'Stable') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Monitoring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Improving': return 'bg-green-100 text-green-800 border-green-200';
      case 'Stable': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAddPatient = (newPatient: Patient) => {
    setPatients([...patients, newPatient]);
  };

  const handleScheduleAppointment = (newAppointment: Appointment) => {
    setAppointments([...appointments, newAppointment]);
  };

  const handleStartVideoCall = () => {
    // In a real app, this would initiate a video call
    alert('Starting video consultation...');
  };

  const handleJoinAppointment = (appointmentId: string) => {
    alert(`Joining appointment ${appointmentId}...`);
  };

  const getPatientAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPatientInitials = (fullName: string) => {
    if (!fullName) return 'N/A';
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading patients...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">BuddyDoc Doctor Dashboard</h1>
        <p className="text-green-100 text-base lg:text-lg">Manage patient cases and consultations with comprehensive tools.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gray-900">{patients.length}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Total Patients</h3>
          <p className="text-gray-600 text-xs lg:text-sm">Under your care</p>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gray-900">{appointments.length}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Today's Appointments</h3>
          <p className="text-gray-600 text-xs lg:text-sm">Scheduled consultations</p>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gray-900">{pendingRequests.length}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Pending Reviews</h3>
          <p className="text-gray-600 text-xs lg:text-sm">Cases awaiting review</p>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gray-900">23</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Completed Today</h3>
          <p className="text-gray-600 text-xs lg:text-sm">Reviews finished</p>
        </div>
      </div>

      {/* Patient Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">My Patients</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white w-full sm:w-auto"
                >
                  <option value="All">All Status</option>
                  <option value="Critical">Critical</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Stable">Stable</option>
                  <option value="Improving">Improving</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {getPatientInitials(patient.full_name)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getPriorityColor(patient.priority || 'Low')} rounded-full border-2 border-white`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-base lg:text-lg font-semibold text-gray-900">{patient.full_name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status || 'Stable')}`}>
                            {patient.status || 'Stable'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600">
                          <span>{getPatientAge(patient.date_of_birth)} years old</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{patient.gender || 'Not specified'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{patient.condition || 'General care'}</span>
                          {patient.lastVisit && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                          View Details
                        </button>
                        <button 
                          onClick={() => setShowScheduleModal(true)}
                          className="border border-green-600 text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600 mb-6">
                {patients.length === 0 
                  ? "You don't have any patients yet. Patients can request you as their doctor."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Schedule and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <button className="text-green-600 hover:text-green-700 font-medium text-sm">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patientName}</p>
                    <p className="text-sm text-gray-600">{appointment.time}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                        {appointment.type}
                      </span>
                      <span className="text-xs text-gray-500">{appointment.duration}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoinAppointment(appointment.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Quick Actions</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => setShowAddPatientModal(true)}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add New Patient</p>
                <p className="text-sm text-gray-600">Register a new patient</p>
              </div>
            </button>
            
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Schedule Appointment</p>
                <p className="text-sm text-gray-600">Book a new consultation</p>
              </div>
            </button>
            
            <button 
              onClick={() => setShowReviewCasesModal(true)}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Cases</p>
                <p className="text-sm text-gray-600">Pending patient reviews</p>
              </div>
            </button>
            
            <button 
              onClick={handleStartVideoCall}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Start Video Call</p>
                <p className="text-sm text-gray-600">Begin consultation</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onSave={handleAddPatient}
      />

      <ScheduleAppointmentModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleScheduleAppointment}
        patients={patients}
      />

      <ReviewCasesModal
        isOpen={showReviewCasesModal}
        onClose={() => setShowReviewCasesModal(false)}
      />
    </div>
  );
}

function DoctorSchedule() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Management</h2>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Management</h3>
          <p className="text-gray-600">Comprehensive appointment scheduling system coming soon.</p>
        </div>
      </div>
    </div>
  );
}

function DoctorReviews() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Reviews</h2>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Review System</h3>
          <p className="text-gray-600">Advanced patient case review and management tools coming soon.</p>
        </div>
      </div>
    </div>
  );
}

function DoctorConsultations() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Consultations</h2>
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Video Consultation Platform</h3>
          <p className="text-gray-600">Integrated video consultation system with patient management coming soon.</p>
        </div>
      </div>
    </div>
  );
}

function DoctorFollowups() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Follow-up Management</h2>
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Follow-up System</h3>
          <p className="text-gray-600">Automated follow-up scheduling and patient tracking system coming soon.</p>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [pendingRequests, setPendingRequests] = useState<PatientDoctorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load doctor's patients and requests on component mount
  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      setIsLoading(true);
      
      // Load patients affiliated with this doctor
      const doctorPatients = await doctorService.getPatients();
      
      // Transform patients to include additional fields
      const transformedPatients: Patient[] = doctorPatients.map(patient => ({
        ...patient,
        condition: patient.medical_history ? 'Chronic condition' : 'General care',
        status: 'Stable' as const,
        priority: 'Low' as const,
        lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      
      setPatients(transformedPatients);
      
      // Load pending requests
      const requests = await doctorService.getPendingRequests();
      setPendingRequests(requests);
      
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEmergencyCall = () => {
    setShowEmergencyCall(true);
    // Simulate emergency call
    setTimeout(() => {
      window.open('tel:911', '_self');
      setShowEmergencyCall(false);
    }, 2000);
  };

  const navigationItems = [
    { id: 'patients', icon: Users, label: 'Patients' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'reviews', icon: FileText, label: 'Reviews' },
    { id: 'consultations', icon: Video, label: 'Consultations' },
    { id: 'followups', icon: Clock, label: 'Follow-ups' }
  ];

  const handleNavigation = (viewId: string) => {
    setCurrentView(viewId);
    setSidebarOpen(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'patients':
        return (
          <DoctorHome 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            patients={patients}
            setPatients={setPatients}
            appointments={appointments}
            setAppointments={setAppointments}
            pendingRequests={pendingRequests}
            isLoading={isLoading}
          />
        );
      case 'schedule':
        return <DoctorSchedule />;
      case 'reviews':
        return <DoctorReviews />;
      case 'consultations':
        return <DoctorConsultations />;
      case 'followups':
        return <DoctorFollowups />;
      default:
        return (
          <DoctorHome 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            patients={patients}
            setPatients={setPatients}
            appointments={appointments}
            setAppointments={setAppointments}
            pendingRequests={pendingRequests}
            isLoading={isLoading}
          />
        );
    }
  };

  const getCurrentViewTitle = () => {
    const item = navigationItems.find(item => item.id === currentView);
    return item ? item.label : 'Patients';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex">
      {/* Emergency Button - Fixed in Corner */}
      <button
        onClick={handleEmergencyCall}
        disabled={showEmergencyCall}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center group"
        title="Emergency Services"
      >
        {showEmergencyCall ? (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        ) : (
          <Phone className="w-7 h-7" />
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Emergency Services
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BuddyDoc</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
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
                      ? 'bg-green-600 text-white' 
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
                <p className="text-xs text-gray-600">Doctor</p>
              </div>
            </div>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">{getCurrentViewTitle()}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 relative">
                <Bell className="w-6 h-6" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}