import React, { useState } from 'react';
import { X, FileText, Clock, AlertTriangle, User, Calendar, CheckCircle, Eye, MessageCircle } from 'lucide-react';

interface PendingCase {
  id: string;
  patientName: string;
  patientAge: number;
  submittedBy: string;
  submittedDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  caseType: 'AI Consultation' | 'Health Worker Review' | 'Emergency Triage' | 'Follow-up Required';
  symptoms: string;
  aiAnalysis?: string;
  vitalSigns?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  status: 'Pending' | 'In Review' | 'Completed';
}

interface ReviewCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockPendingCases: PendingCase[] = [
  {
    id: 'RC001',
    patientName: 'Sarah Johnson',
    patientAge: 34,
    submittedBy: 'Dr. Ava (AI)',
    submittedDate: '2025-01-15T14:30:00Z',
    priority: 'High',
    caseType: 'AI Consultation',
    symptoms: 'Patient reports severe headache, nausea, and sensitivity to light for the past 6 hours. No fever. History of migraines but this feels different according to patient.',
    aiAnalysis: 'Based on symptoms presentation, this could indicate migraine exacerbation or potentially more serious conditions requiring immediate evaluation. Recommend urgent medical assessment to rule out secondary headache causes.',
    status: 'Pending'
  },
  {
    id: 'RC002',
    patientName: 'Michael Chen',
    patientAge: 67,
    submittedBy: 'Nurse Williams',
    submittedDate: '2025-01-15T13:15:00Z',
    priority: 'Critical',
    caseType: 'Health Worker Review',
    symptoms: 'Patient experiencing chest pain and shortness of breath. Appears anxious and diaphoretic.',
    vitalSigns: {
      bloodPressure: '160/95',
      heartRate: 110,
      temperature: 98.8,
      oxygenSaturation: 94
    },
    status: 'In Review'
  },
  {
    id: 'RC003',
    patientName: 'Emma Rodriguez',
    patientAge: 28,
    submittedBy: 'Dr. Ava (AI)',
    submittedDate: '2025-01-15T12:45:00Z',
    priority: 'Medium',
    caseType: 'Follow-up Required',
    symptoms: 'Follow-up on antibiotic treatment for UTI. Patient reports improvement but still has mild symptoms.',
    aiAnalysis: 'Patient showing improvement on current antibiotic regimen. Recommend completion of full course and follow-up if symptoms persist beyond treatment completion.',
    status: 'Pending'
  },
  {
    id: 'RC004',
    patientName: 'Robert Kim',
    patientAge: 45,
    submittedBy: 'Nurse Thompson',
    submittedDate: '2025-01-15T11:20:00Z',
    priority: 'Low',
    caseType: 'Health Worker Review',
    symptoms: 'Patient requesting medication refill and routine check-up. No acute symptoms reported.',
    vitalSigns: {
      bloodPressure: '125/80',
      heartRate: 72,
      temperature: 98.6,
      oxygenSaturation: 98
    },
    status: 'Pending'
  }
];

export default function ReviewCasesModal({ isOpen, onClose }: ReviewCasesModalProps) {
  const [selectedCase, setSelectedCase] = useState<PendingCase | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  if (!isOpen) return null;

  const filteredCases = mockPendingCases.filter(case_ => {
    const matchesStatus = filterStatus === 'All' || case_.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || case_.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Review': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCaseTypeIcon = (type: string) => {
    switch (type) {
      case 'AI Consultation': return <MessageCircle className="w-4 h-4" />;
      case 'Health Worker Review': return <User className="w-4 h-4" />;
      case 'Emergency Triage': return <AlertTriangle className="w-4 h-4" />;
      case 'Follow-up Required': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleCaseAction = (caseId: string, action: 'approve' | 'request_more_info' | 'escalate') => {
    // Handle case actions
    console.log(`Action ${action} for case ${caseId}`);
    // In a real app, this would make an API call
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (selectedCase) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedCase(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <FileText className="w-5 h-5" />
              <span>Back to Cases</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Case Details */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCase.patientName}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{selectedCase.patientAge} years old</span>
                    <span>•</span>
                    <span>Case ID: {selectedCase.id}</span>
                    <span>•</span>
                    <span>Submitted: {formatDate(selectedCase.submittedDate)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedCase.priority)}`}>
                    {selectedCase.priority} Priority
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getCaseTypeIcon(selectedCase.caseType)}
                  <span className="text-sm font-medium text-gray-700">{selectedCase.caseType}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">Submitted by: {selectedCase.submittedBy}</span>
              </div>
            </div>

            {/* Symptoms */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Symptoms & Presentation</h3>
              <p className="text-gray-700 leading-relaxed">{selectedCase.symptoms}</p>
            </div>

            {/* Vital Signs */}
            {selectedCase.vitalSigns && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-900">{selectedCase.vitalSigns.bloodPressure}</div>
                    <div className="text-sm text-red-700">Blood Pressure</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{selectedCase.vitalSigns.heartRate}</div>
                    <div className="text-sm text-blue-700">Heart Rate (bpm)</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">{selectedCase.vitalSigns.temperature}°F</div>
                    <div className="text-sm text-orange-700">Temperature</div>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-900">{selectedCase.vitalSigns.oxygenSaturation}%</div>
                    <div className="text-sm text-teal-700">O2 Saturation</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {selectedCase.aiAnalysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">AI Analysis & Recommendations</h3>
                <p className="text-purple-800 leading-relaxed">{selectedCase.aiAnalysis}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleCaseAction(selectedCase.id, 'approve')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Close Case</span>
              </button>
              <button
                onClick={() => handleCaseAction(selectedCase.id, 'request_more_info')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Request More Info</span>
              </button>
              <button
                onClick={() => handleCaseAction(selectedCase.id, 'escalate')}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Escalate Case</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Review Pending Cases</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="All">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.map((case_) => (
            <div
              key={case_.id}
              onClick={() => setSelectedCase(case_)}
              className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{case_.patientName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(case_.priority)}`}>
                      {case_.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                      {case_.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>{case_.patientAge} years old</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      {getCaseTypeIcon(case_.caseType)}
                      <span>{case_.caseType}</span>
                    </div>
                    <span>•</span>
                    <span>Submitted: {formatDate(case_.submittedDate)}</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm line-clamp-2">{case_.symptoms}</p>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Submitted by: {case_.submittedBy}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600">Try adjusting your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}