import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Eye, 
  Edit3, 
  Plus,
  Clock,
  User,
  Stethoscope,
  Activity,
  AlertTriangle,
  Phone
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: 'Vital Signs' | 'Clinical Notes' | 'Lab Results' | 'Medication' | 'Procedure' | 'Discharge Summary';
  title: string;
  date: string;
  time: string;
  recordedBy: string;
  status: 'Complete' | 'Pending' | 'Review Required';
  priority: 'Normal' | 'High' | 'Critical';
  content: string;
  attachments?: string[];
}

const mockRecords: MedicalRecord[] = [
  {
    id: 'R001',
    patientId: 'P001',
    patientName: 'John Smith',
    type: 'Vital Signs',
    title: 'Post-operative Vital Signs Check',
    date: '2025-01-15',
    time: '14:30',
    recordedBy: 'Nurse Sarah Wilson',
    status: 'Complete',
    priority: 'Normal',
    content: 'BP: 120/80, HR: 72 bpm, Temp: 98.6°F, O2 Sat: 98%, RR: 16. Patient stable post-appendectomy. No signs of infection or complications.',
    attachments: ['vitals_chart.pdf']
  },
  {
    id: 'R002',
    patientId: 'P003',
    patientName: 'Robert Johnson',
    type: 'Clinical Notes',
    title: 'Pneumonia Assessment - Critical Update',
    date: '2025-01-15',
    time: '13:45',
    recordedBy: 'Dr. Emily Rodriguez',
    status: 'Review Required',
    priority: 'Critical',
    content: 'Patient showing signs of respiratory distress. Oxygen saturation dropped to 88%. Increased respiratory rate to 24 breaths/min. Immediate intervention required.',
    attachments: ['chest_xray.jpg', 'lab_results.pdf']
  },
  {
    id: 'R003',
    patientId: 'P002',
    patientName: 'Maria Garcia',
    type: 'Lab Results',
    title: 'Blood Glucose Monitoring',
    date: '2025-01-15',
    time: '12:00',
    recordedBy: 'Lab Tech Mike Chen',
    status: 'Complete',
    priority: 'High',
    content: 'Fasting glucose: 180 mg/dL (elevated). HbA1c: 8.2% (poor control). Recommend insulin adjustment and dietary consultation.',
    attachments: ['lab_report.pdf']
  },
  {
    id: 'R004',
    patientId: 'P004',
    patientName: 'Lisa Chen',
    type: 'Procedure',
    title: 'Prenatal Ultrasound',
    date: '2025-01-15',
    time: '10:30',
    recordedBy: 'Dr. Priya Patel',
    status: 'Complete',
    priority: 'Normal',
    content: 'Routine prenatal ultrasound at 32 weeks. Fetal development normal. Estimated weight: 4.2 lbs. No abnormalities detected.',
    attachments: ['ultrasound_images.jpg']
  },
  {
    id: 'R005',
    patientId: 'P005',
    patientName: 'David Wilson',
    type: 'Medication',
    title: 'Cardiac Medication Review',
    date: '2025-01-15',
    time: '09:15',
    recordedBy: 'Pharmacist Dr. James Lee',
    status: 'Pending',
    priority: 'High',
    content: 'Post-catheterization medication review. Adjusted beta blocker dosage. Monitor for hypotension. Next review in 48 hours.',
    attachments: ['medication_chart.pdf']
  }
];

export default function MedicalRecordsInterface() {
  const [records, setRecords] = useState<MedicalRecord[]>(mockRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || record.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || record.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Vital Signs': return 'bg-blue-100 text-blue-800';
      case 'Clinical Notes': return 'bg-green-100 text-green-800';
      case 'Lab Results': return 'bg-purple-100 text-purple-800';
      case 'Medication': return 'bg-orange-100 text-orange-800';
      case 'Procedure': return 'bg-teal-100 text-teal-800';
      case 'Discharge Summary': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Review Required': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEmergencyCall = () => {
    setShowEmergencyCall(true);
    // Simulate emergency call
    setTimeout(() => {
      window.open('tel:911', '_self');
      setShowEmergencyCall(false);
    }, 2000);
  };

  if (selectedRecord) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedRecord(null)}
            className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <FileText className="w-5 h-5" />
            <span>Back to Records</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Record Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedRecord.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{selectedRecord.patientName}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedRecord.date} at {selectedRecord.time}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Stethoscope className="w-4 h-4" />
                  <span>{selectedRecord.recordedBy}</span>
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedRecord.type)}`}>
                {selectedRecord.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.status)}`}>
                {selectedRecord.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedRecord.priority)}`}>
                {selectedRecord.priority} Priority
              </span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Record Content</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedRecord.content}</p>
            </div>
          </div>

          {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
              <div className="space-y-2">
                {selectedRecord.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{attachment}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Emergency Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
          <p className="text-gray-600">Access and manage patient medical documentation</p>
        </div>
        
        <button
          onClick={handleEmergencyCall}
          disabled={showEmergencyCall}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records, patients, or staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="All">All Types</option>
              <option value="Vital Signs">Vital Signs</option>
              <option value="Clinical Notes">Clinical Notes</option>
              <option value="Lab Results">Lab Results</option>
              <option value="Medication">Medication</option>
              <option value="Procedure">Procedure</option>
              <option value="Discharge Summary">Discharge Summary</option>
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="All">All Status</option>
              <option value="Complete">Complete</option>
              <option value="Pending">Pending</option>
              <option value="Review Required">Review Required</option>
            </select>
          </div>
          
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="All">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Records ({filteredRecords.length})
            </h3>
            <button className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Record</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{record.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                    {record.priority !== 'Normal' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(record.priority)}`}>
                        {record.priority}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{record.patientName}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{record.date} at {record.time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Stethoscope className="w-4 h-4" />
                      <span>{record.recordedBy}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm line-clamp-2">{record.content}</p>
                  
                  {record.attachments && record.attachments.length > 0 && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span>{record.attachments.length} attachment(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}