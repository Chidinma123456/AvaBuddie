import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Users, 
  Activity, 
  AlertTriangle,
  Heart,
  Thermometer,
  Droplets,
  Clock,
  Download,
  Filter,
  Phone
} from 'lucide-react';

interface AnalyticsData {
  patientOutcomes: {
    improved: number;
    stable: number;
    declined: number;
    critical: number;
  };
  vitalTrends: {
    date: string;
    avgHeartRate: number;
    avgBloodPressure: number;
    avgTemperature: number;
    avgOxygenSat: number;
  }[];
  careMetrics: {
    responseTime: number;
    patientSatisfaction: number;
    medicationCompliance: number;
    readmissionRate: number;
  };
  workloadStats: {
    totalPatients: number;
    criticalCases: number;
    completedAssessments: number;
    pendingTasks: number;
  };
}

const mockAnalyticsData: AnalyticsData = {
  patientOutcomes: {
    improved: 45,
    stable: 35,
    declined: 15,
    critical: 5
  },
  vitalTrends: [
    { date: '2025-01-10', avgHeartRate: 75, avgBloodPressure: 125, avgTemperature: 98.6, avgOxygenSat: 97 },
    { date: '2025-01-11', avgHeartRate: 73, avgBloodPressure: 122, avgTemperature: 98.4, avgOxygenSat: 98 },
    { date: '2025-01-12', avgHeartRate: 76, avgBloodPressure: 128, avgTemperature: 98.8, avgOxygenSat: 96 },
    { date: '2025-01-13', avgHeartRate: 74, avgBloodPressure: 124, avgTemperature: 98.5, avgOxygenSat: 97 },
    { date: '2025-01-14', avgHeartRate: 72, avgBloodPressure: 120, avgTemperature: 98.3, avgOxygenSat: 98 },
    { date: '2025-01-15', avgHeartRate: 71, avgBloodPressure: 118, avgTemperature: 98.2, avgOxygenSat: 98 }
  ],
  careMetrics: {
    responseTime: 8.5,
    patientSatisfaction: 94,
    medicationCompliance: 87,
    readmissionRate: 12
  },
  workloadStats: {
    totalPatients: 24,
    criticalCases: 3,
    completedAssessments: 18,
    pendingTasks: 7
  }
};

export default function AnalyticsInterface() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);

  const handleEmergencyCall = () => {
    setShowEmergencyCall(true);
    // Simulate emergency call
    setTimeout(() => {
      window.open('tel:911', '_self');
      setShowEmergencyCall(false);
    }, 2000);
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'improved': return 'bg-green-500';
      case 'stable': return 'bg-blue-500';
      case 'declined': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <div className="w-4 h-4"></div>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Emergency Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Care Analytics</h2>
          <p className="text-gray-600">Monitor patient outcomes and care quality metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
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
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{mockAnalyticsData.workloadStats.totalPatients}</span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Patients</h3>
          <p className="text-gray-600 text-sm">Under your care</p>
          <div className="mt-2 flex items-center space-x-1">
            {getTrendIcon(24, 22)}
            <span className="text-sm text-gray-600">+2 from last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{mockAnalyticsData.careMetrics.patientSatisfaction}%</span>
          </div>
          <h3 className="font-semibold text-gray-900">Patient Satisfaction</h3>
          <p className="text-gray-600 text-sm">Care quality rating</p>
          <div className="mt-2 flex items-center space-x-1">
            {getTrendIcon(94, 91)}
            <span className="text-sm text-gray-600">+3% improvement</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{mockAnalyticsData.careMetrics.responseTime}m</span>
          </div>
          <h3 className="font-semibold text-gray-900">Avg Response Time</h3>
          <p className="text-gray-600 text-sm">To patient calls</p>
          <div className="mt-2 flex items-center space-x-1">
            {getTrendIcon(8.5, 9.2)}
            <span className="text-sm text-gray-600">-0.7m faster</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{mockAnalyticsData.workloadStats.criticalCases}</span>
          </div>
          <h3 className="font-semibold text-gray-900">Critical Cases</h3>
          <p className="text-gray-600 text-sm">Requiring immediate attention</p>
          <div className="mt-2 flex items-center space-x-1">
            {getTrendIcon(3, 5)}
            <span className="text-sm text-gray-600">-2 from yesterday</span>
          </div>
        </div>
      </div>

      {/* Patient Outcomes Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Patient Outcomes</h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(mockAnalyticsData.patientOutcomes).map(([outcome, count]) => {
              const total = Object.values(mockAnalyticsData.patientOutcomes).reduce((a, b) => a + b, 0);
              const percentage = Math.round((count / total) * 100);
              
              return (
                <div key={outcome} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${getOutcomeColor(outcome)}`}></div>
                    <span className="text-gray-700 capitalize">{outcome}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-semibold">{count}</span>
                    <span className="text-gray-500 text-sm">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(mockAnalyticsData.patientOutcomes).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Patients Assessed</div>
            </div>
          </div>
        </div>

        {/* Vital Signs Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Vital Signs Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Heart Rate</span>
                </div>
                <div className="text-xl font-bold text-red-900">71 bpm</div>
                <div className="text-xs text-red-700">Avg last 7 days</div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Blood Pressure</span>
                </div>
                <div className="text-xl font-bold text-blue-900">118 mmHg</div>
                <div className="text-xs text-blue-700">Avg systolic</div>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Thermometer className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Temperature</span>
                </div>
                <div className="text-xl font-bold text-orange-900">98.2°F</div>
                <div className="text-xs text-orange-700">Avg last 7 days</div>
              </div>
              
              <div className="p-4 bg-teal-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Droplets className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-900">O2 Saturation</span>
                </div>
                <div className="text-xl font-bold text-teal-900">98%</div>
                <div className="text-xs text-teal-700">Avg last 7 days</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Care Quality Metrics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Care Quality Metrics</h3>
          <button className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockAnalyticsData.careMetrics.patientSatisfaction}%
            </div>
            <div className="text-sm text-gray-600">Patient Satisfaction</div>
            <div className="mt-2 text-xs text-green-600">+3% from last month</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockAnalyticsData.careMetrics.medicationCompliance}%
            </div>
            <div className="text-sm text-gray-600">Medication Compliance</div>
            <div className="mt-2 text-xs text-blue-600">+5% improvement</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockAnalyticsData.careMetrics.responseTime}m
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="mt-2 text-xs text-orange-600">-0.7m faster</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockAnalyticsData.careMetrics.readmissionRate}%
            </div>
            <div className="text-sm text-gray-600">Readmission Rate</div>
            <div className="mt-2 text-xs text-red-600">-2% reduction</div>
          </div>
        </div>
      </div>

      {/* Workload Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Workload Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">
                {mockAnalyticsData.workloadStats.totalPatients}
              </span>
            </div>
            <div className="text-sm font-medium text-blue-900">Total Patients</div>
            <div className="text-xs text-blue-700">Currently assigned</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-900">
                {mockAnalyticsData.workloadStats.criticalCases}
              </span>
            </div>
            <div className="text-sm font-medium text-red-900">Critical Cases</div>
            <div className="text-xs text-red-700">Immediate attention</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">
                {mockAnalyticsData.workloadStats.completedAssessments}
              </span>
            </div>
            <div className="text-sm font-medium text-green-900">Completed</div>
            <div className="text-xs text-green-700">Assessments today</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-900">
                {mockAnalyticsData.workloadStats.pendingTasks}
              </span>
            </div>
            <div className="text-sm font-medium text-orange-900">Pending Tasks</div>
            <div className="text-xs text-orange-700">To be completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}