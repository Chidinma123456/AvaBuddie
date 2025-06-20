import { useState, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  User, 
  Heart, 
  Thermometer, 
  Activity, 
  Droplets,
  Wind,
  AlertTriangle,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Stethoscope
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';

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

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  respiratoryRate: string;
  painLevel: string;
  bloodGlucose: string;
}

interface PatientAnalysisInterfaceProps {
  patient: Patient;
  onBack: () => void;
}

export default function PatientAnalysisInterface({ patient, onBack }: PatientAnalysisInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'symptoms' | 'analysis'>('overview');
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: patient.lastVitals.bloodPressure,
    heartRate: patient.lastVitals.heartRate.toString(),
    temperature: patient.lastVitals.temperature.toString(),
    oxygenSaturation: patient.lastVitals.oxygenSaturation.toString(),
    respiratoryRate: patient.lastVitals.respiratoryRate.toString(),
    painLevel: '',
    bloodGlucose: ''
  });
  
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [observations, setObservations] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleVitalChange = (field: keyof VitalSigns, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const addSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms(prev => [...prev, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSymptom();
    }
  };

  const generateAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysisPrompt = `
As a healthcare AI assistant, please analyze the following patient data and provide clinical insights:

Patient Information:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Current Condition: ${patient.condition}
- Status: ${patient.status}

Current Vital Signs:
- Blood Pressure: ${vitals.bloodPressure}
- Heart Rate: ${vitals.heartRate} bpm
- Temperature: ${vitals.temperature}°F
- Oxygen Saturation: ${vitals.oxygenSaturation}%
- Respiratory Rate: ${vitals.respiratoryRate} breaths/min
${vitals.painLevel ? `- Pain Level: ${vitals.painLevel}/10` : ''}
${vitals.bloodGlucose ? `- Blood Glucose: ${vitals.bloodGlucose} mg/dL` : ''}

Reported Symptoms:
${symptoms.length > 0 ? symptoms.map(s => `- ${s}`).join('\n') : 'No specific symptoms reported'}

Healthcare Worker Observations:
${observations || 'No additional observations'}

Current Medications:
${patient.medications.map(m => `- ${m}`).join('\n')}

Allergies:
${patient.allergies.map(a => `- ${a}`).join('\n')}

Please provide:
1. Assessment of current vital signs and any concerns
2. Analysis of symptoms and their potential significance
3. Recommendations for continued care or monitoring
4. Any red flags or urgent concerns that need immediate attention
5. Suggested interventions or treatments to consider

Format your response in a clear, professional manner suitable for healthcare workers.
      `;

      const analysis = await geminiService.generateResponse(analysisPrompt, [], false, false);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setAiAnalysis('Unable to generate analysis at this time. Please ensure all patient data is accurate and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const savePatientData = async () => {
    setIsSaving(true);
    // Simulate saving data
    setTimeout(() => {
      setIsSaving(false);
      alert('Patient data saved successfully!');
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Monitoring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Improving': return 'bg-green-100 text-green-800 border-green-200';
      case 'Stable': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'vitals', label: 'Vital Signs', icon: Activity },
    { id: 'symptoms', label: 'Symptoms & Observations', icon: Stethoscope },
    { id: 'analysis', label: 'AI Analysis', icon: FileText }
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Patients</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>Room {patient.roomNumber}</span>
                <span>•</span>
                <span>{patient.age}y {patient.gender}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={savePatientData}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-teal-500 text-teal-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium text-gray-900">{patient.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Date:</span>
                    <span className="font-medium text-gray-900">{new Date(patient.admissionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Doctor:</span>
                    <span className="font-medium text-gray-900">{patient.primaryDoctor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Vitals:</span>
                    <span className="font-medium text-gray-900">{patient.lastVitals.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Current Vitals Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Vitals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="text-sm text-gray-600">Heart Rate</div>
                      <div className="font-semibold">{patient.lastVitals.heartRate} bpm</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="text-sm text-gray-600">Temperature</div>
                      <div className="font-semibold">{patient.lastVitals.temperature}°F</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-gray-600">O2 Saturation</div>
                      <div className="font-semibold">{patient.lastVitals.oxygenSaturation}%</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="text-sm text-gray-600">Blood Pressure</div>
                      <div className="font-semibold">{patient.lastVitals.bloodPressure}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications and Allergies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Medications</h3>
                <div className="space-y-2">
                  {patient.medications.map((medication, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{medication}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergies</h3>
                <div className="space-y-2">
                  {patient.allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-gray-700">{allergy}</span>
                    </div>
                  ))}
                  {patient.allergies.length === 0 && (
                    <span className="text-gray-500 italic">No known allergies</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h3>
              <p className="text-gray-700">{patient.notes}</p>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Update Vital Signs</h3>
              </div>
              <p className="text-blue-700 text-sm mt-1">Enter current vital sign measurements for the patient.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Heart className="w-4 h-4 inline mr-2 text-red-500" />
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="72"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Activity className="w-4 h-4 inline mr-2 text-purple-500" />
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="120/80"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Thermometer className="w-4 h-4 inline mr-2 text-orange-500" />
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => handleVitalChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="98.6"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Droplets className="w-4 h-4 inline mr-2 text-blue-500" />
                  Oxygen Saturation (%)
                </label>
                <input
                  type="number"
                  value={vitals.oxygenSaturation}
                  onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="98"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Wind className="w-4 h-4 inline mr-2 text-green-500" />
                  Respiratory Rate (breaths/min)
                </label>
                <input
                  type="number"
                  value={vitals.respiratoryRate}
                  onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="16"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-500" />
                  Pain Level (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={vitals.painLevel}
                  onChange={(e) => handleVitalChange('painLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  <Droplets className="w-4 h-4 inline mr-2 text-red-500" />
                  Blood Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  value={vitals.bloodGlucose}
                  onChange={(e) => handleVitalChange('bloodGlucose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        {activeTab === 'symptoms' && (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Symptoms & Clinical Observations</h3>
              </div>
              <p className="text-orange-700 text-sm mt-1">Document patient symptoms and your clinical observations.</p>
            </div>

            {/* Symptoms */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Symptoms</h3>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a symptom (e.g., headache, nausea, fatigue)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={addSymptom}
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
                  >
                    <span>{symptom}</span>
                    <button
                      onClick={() => removeSymptom(symptom)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {symptoms.length === 0 && (
                <p className="text-gray-500 italic">No symptoms recorded yet.</p>
              )}
            </div>

            {/* Clinical Observations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Clinical Observations</h3>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Record your clinical observations, patient behavior, physical examination findings, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                rows={6}
              />
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">AI-Powered Clinical Analysis</h3>
              </div>
              <p className="text-purple-700 text-sm mt-1">Generate comprehensive analysis based on patient data, vitals, and symptoms.</p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={generateAIAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Analyzing Patient Data...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Generate AI Analysis</span>
                  </>
                )}
              </button>
            </div>

            {aiAnalysis && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Analysis Report</h3>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {aiAnalysis}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Generated on {new Date().toLocaleString()} • This analysis is for informational purposes and should be reviewed by qualified medical professionals.
                </div>
              </div>
            )}

            {!aiAnalysis && !isAnalyzing && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Generated</h3>
                <p className="text-gray-600">Click the button above to generate an AI-powered clinical analysis based on the patient's current data.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}