import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import PatientAnalysisInterface from '../components/healthworker/PatientAnalysisInterface';
import MedicalRecordsInterface from '../components/healthworker/MedicalRecordsInterface';
import AnalyticsInterface from '../components/healthworker/AnalyticsInterface';
import { Activity, Users, AlertCircle, FileText, TrendingUp, Search, Filter, Phone } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  roomNumber: string;
  condition: string;
  status: 'Stable' | 'Critical' | 'Improving' | 'Monitoring';
  lastVitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
    timestamp: string;
  };
  allergies: string[];
  medications: string[];
  admissionDate: string;
  primaryDoctor: string;
  notes: string;
}

const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    roomNumber: '101A',
    condition: 'Post-operative recovery',
    status: 'Stable',
    lastVitals: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      oxygenSaturation: 98,
      respiratoryRate: 16,
      timestamp: '2 hours ago'
    },
    allergies: ['Penicillin', 'Shellfish'],
    medications: ['Ibuprofen 400mg', 'Metformin 500mg'],
    admissionDate: '2025-01-10',
    primaryDoctor: 'Dr. Sarah Johnson',
    notes: 'Patient recovering well from appendectomy. Monitor for signs of infection.'
  },
  {
    id: 'P002',
    name: 'Maria Garcia',
    age: 62,
    gender: 'Female',
    roomNumber: '102B',
    condition: 'Diabetes management',
    status: 'Monitoring',
    lastVitals: {
      bloodPressure: '140/90',
      heartRate: 85,
      temperature: 99.2,
      oxygenSaturation: 96,
      respiratoryRate: 18,
      timestamp: '1 hour ago'
    },
    allergies: ['Latex'],
    medications: ['Insulin', 'Lisinopril 10mg', 'Atorvastatin 20mg'],
    admissionDate: '2025-01-08',
    primaryDoctor: 'Dr. Michael Chen',
    notes: 'Blood sugar levels fluctuating. Adjusting insulin dosage.'
  },
  {
    id: 'P003',
    name: 'Robert Johnson',
    age: 78,
    gender: 'Male',
    roomNumber: '103A',
    condition: 'Pneumonia',
    status: 'Critical',
    lastVitals: {
      bloodPressure: '90/60',
      heartRate: 110,
      temperature: 101.5,
      oxygenSaturation: 88,
      respiratoryRate: 24,
      timestamp: '30 minutes ago'
    },
    allergies: ['Sulfa drugs'],
    medications: ['Antibiotics', 'Oxygen therapy', 'Bronchodilators'],
    admissionDate: '2025-01-12',
    primaryDoctor: 'Dr. Emily Rodriguez',
    notes: 'Requires close monitoring. Oxygen levels concerning.'
  },
  {
    id: 'P004',
    name: 'Lisa Chen',
    age: 34,
    gender: 'Female',
    roomNumber: '104B',
    condition: 'Maternity care',
    status: 'Stable',
    lastVitals: {
      bloodPressure: '110/70',
      heartRate: 78,
      temperature: 98.4,
      oxygenSaturation: 99,
      respiratoryRate: 14,
      timestamp: '3 hours ago'
    },
    allergies: ['None known'],
    medications: ['Prenatal vitamins', 'Iron supplements'],
    admissionDate: '2025-01-13',
    primaryDoctor: 'Dr. Priya Patel',
    notes: 'Routine prenatal care. Baby and mother doing well.'
  },
  {
    id: 'P005',
    name: 'David Wilson',
    age: 56,
    gender: 'Male',
    roomNumber: '105A',
    condition: 'Cardiac monitoring',
    status: 'Improving',
    lastVitals: {
      bloodPressure: '130/85',
      heartRate: 68,
      temperature: 98.8,
      oxygenSaturation: 97,
      respiratoryRate: 15,
      timestamp: '45 minutes ago'
    },
    allergies: ['Aspirin'],
    medications: ['Beta blockers', 'ACE inhibitors', 'Statins'],
    admissionDate: '2025-01-09',
    primaryDoctor: 'Dr. Thomas Weber',
    notes: 'Post-cardiac catheterization. Heart rhythm stabilizing.'
  }
];

function HealthWorkerHome() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || patient.status === statusFilter;
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

  const getVitalStatus = (_type: string, value: number | string) => {
    // Simple vital sign assessment
    if (typeof value === 'number') {
      if (_type === 'heartRate') {
        if (value < 60 || value > 100) return 'text-red-600';
        return 'text-green-600';
      }
      if (_type === 'temperature') {
        if (value > 100.4) return 'text-red-600';
        return 'text-green-600';
      }
      if (_type === 'oxygenSaturation') {
        if (value < 95) return 'text-red-600';
        return 'text-green-600';
      }
    }
    return 'text-gray-900';
  };

  const handleEmergencyCall = () => {
    setShowEmergencyCall(true);
    // Simulate emergency call
    setTimeout(() => {
      window.open('tel:911', '_self');
      setShowEmergencyCall(false);
    }, 2000);
  };

  if (selectedPatient) {
    return (
      <PatientAnalysisInterface 
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Emergency Button */}
      <div className="flex items-center justify-between">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white flex-1 mr-6">
          <h1 className="text-3xl font-bold mb-2">AvaBuddie Patient Care Dashboard</h1>
          <p className="text-teal-100 text-lg">Monitor patient vitals and coordinate care with AI assistance.</p>
        </div>
        
        <button
          onClick={handleEmergencyCall}
          disabled={showEmergencyCall}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-4 rounded-xl font-semibold transition-colors shadow-lg"
        >
          {showEmergencyCall ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Calling Emergency...</span>
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              <span>Emergency Services</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{mockPatients.length}</span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Patients</h3>
          <p className="text-gray-600 text-sm">Under your care</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {mockPatients.filter(p => p.status === 'Critical').length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Critical Patients</h3>
          <p className="text-gray-600 text-sm">Requiring immediate attention</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {mockPatients.filter(p => p.status === 'Stable').length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Stable Patients</h3>
          <p className="text-gray-600 text-sm">Condition stable</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {mockPatients.filter(p => p.status === 'Improving').length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Improving</h3>
          <p className="text-gray-600 text-sm">Showing progress</p>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Patient List</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full sm:w-64"
                />
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
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
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-700 font-semibold">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Room {patient.roomNumber}</span>
                      <span>•</span>
                      <span>{patient.age}y {patient.gender}</span>
                      <span>•</span>
                      <span>{patient.condition}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Last vitals: {patient.lastVitals.timestamp}</div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-medium ${getVitalStatus('heartRate', patient.lastVitals.heartRate)}`}>
                      HR: {patient.lastVitals.heartRate}
                    </span>
                    <span className={`font-medium ${getVitalStatus('temperature', patient.lastVitals.temperature)}`}>
                      Temp: {patient.lastVitals.temperature}°F
                    </span>
                    <span className={`font-medium ${getVitalStatus('oxygenSaturation', patient.lastVitals.oxygenSaturation)}`}>
                      O2: {patient.lastVitals.oxygenSaturation}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthWorkerPatients() {
  return <HealthWorkerHome />;
}

function HealthWorkerRecords() {
  return <MedicalRecordsInterface />;
}

function HealthWorkerAnalytics() {
  return <AnalyticsInterface />;
}

function HealthWorkerAlerts() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Management</h2>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Alert Center</h3>
          <p className="text-gray-600">Manage patient alerts and critical notifications.</p>
        </div>
      </div>
    </div>
  );
}

export default function HealthWorkerDashboard() {
  const navigationItems = [
    { icon: Users, label: 'Patients', path: '' },
    { icon: Activity, label: 'Vitals', path: 'vitals' },
    { icon: FileText, label: 'Records', path: 'records' },
    { icon: TrendingUp, label: 'Analytics', path: 'analytics' },
    { icon: AlertCircle, label: 'Alerts', path: 'alerts' }
  ];

  return (
    <DashboardLayout navigationItems={navigationItems} userType="health-worker">
      <Routes>
        <Route path="/" element={<HealthWorkerHome />} />
        <Route path="/vitals" element={<HealthWorkerPatients />} />
        <Route path="/records" element={<HealthWorkerRecords />} />
        <Route path="/analytics" element={<HealthWorkerAnalytics />} />
        <Route path="/alerts" element={<HealthWorkerAlerts />} />
      </Routes>
    </DashboardLayout>
  );
}