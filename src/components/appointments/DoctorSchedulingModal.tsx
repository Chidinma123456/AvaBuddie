import React, { useState } from 'react';
import { Clock, X, MapPin, Video, Phone, CheckCircle, Star } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  location: string;
  avatar: string;
  consultationTypes: ('video' | 'phone' | 'in-person')[];
  nextAvailable: string;
  languages: string[];
}

interface DoctorSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Müller',
    specialty: 'General Medicine',
    rating: 4.9,
    experience: '12 years',
    location: 'Berlin-Mitte',
    avatar: 'SM',
    consultationTypes: ['video', 'phone', 'in-person'],
    nextAvailable: 'Today at 3:00 PM',
    languages: ['German', 'English']
  },
  {
    id: '2',
    name: 'Dr. Michael Schmidt',
    specialty: 'Internal Medicine',
    rating: 4.8,
    experience: '15 years',
    location: 'Berlin-Charlottenburg',
    avatar: 'MS',
    consultationTypes: ['video', 'phone'],
    nextAvailable: 'Tomorrow at 10:00 AM',
    languages: ['German', 'English']
  },
  {
    id: '3',
    name: 'Dr. Elena Rodriguez',
    specialty: 'Family Medicine',
    rating: 4.9,
    experience: '8 years',
    location: 'Berlin-Kreuzberg',
    avatar: 'ER',
    consultationTypes: ['video', 'in-person'],
    nextAvailable: 'Today at 5:30 PM',
    languages: ['German', 'Spanish', 'English']
  },
  {
    id: '4',
    name: 'Dr. Thomas Weber',
    specialty: 'Cardiology',
    rating: 4.7,
    experience: '20 years',
    location: 'Berlin-Prenzlauer Berg',
    avatar: 'TW',
    consultationTypes: ['video', 'phone', 'in-person'],
    nextAvailable: 'Tomorrow at 2:00 PM',
    languages: ['German', 'English']
  },
  {
    id: '5',
    name: 'Dr. Priya Patel',
    specialty: 'Dermatology',
    rating: 4.8,
    experience: '10 years',
    location: 'Berlin-Friedrichshain',
    avatar: 'PP',
    consultationTypes: ['video', 'in-person'],
    nextAvailable: 'Today at 4:15 PM',
    languages: ['German', 'English', 'Hindi']
  },
  {
    id: '6',
    name: 'Dr. Robert Kim',
    specialty: 'Psychiatry',
    rating: 4.9,
    experience: '14 years',
    location: 'Berlin-Schöneberg',
    avatar: 'RK',
    consultationTypes: ['video', 'phone'],
    nextAvailable: 'Tomorrow at 11:30 AM',
    languages: ['German', 'English', 'Korean']
  }
];

export default function DoctorSchedulingModal({ isOpen, onClose }: DoctorSchedulingModalProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState<'select-doctor' | 'schedule'>('select-doctor');

  if (!isOpen) return null;

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setConsultationType(doctor.consultationTypes[0]);
    setStep('schedule');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        // Reset form
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        setSymptoms('');
        setStep('select-doctor');
      }, 2000);
    }, 1500);
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getConsultationIcon = (type: 'video' | 'phone' | 'in-person') => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
    }
  };

  const getConsultationLabel = (type: 'video' | 'phone' | 'in-person') => {
    switch (type) {
      case 'video': return 'Video Call';
      case 'phone': return 'Phone Call';
      case 'in-person': return 'In-Person';
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Appointment Scheduled!</h2>
          <p className="text-gray-600 mb-2">
            Your appointment with {selectedDoctor?.name} has been confirmed.
          </p>
          <p className="text-sm text-gray-500">
            You'll receive a confirmation email shortly.
          </p>
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
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'select-doctor' ? 'Select Doctor' : 'Schedule Appointment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'select-doctor' ? (
          <div>
            <p className="text-gray-600 mb-6">Choose a doctor for your consultation</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => handleDoctorSelect(doctor)}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {doctor.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                      <p className="text-blue-600 text-sm font-medium mb-1">{doctor.specialty}</p>
                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{doctor.rating} • {doctor.experience}</span>
                      </div>
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{doctor.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        {doctor.consultationTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {getConsultationIcon(type)}
                            <span>{getConsultationLabel(type)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-green-600 font-medium">Next available: {doctor.nextAvailable}</p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Languages: {doctor.languages.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setStep('select-doctor')}
              className="text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
            >
              ← Back to doctor selection
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedDoctor?.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedDoctor?.name}</h3>
                  <p className="text-blue-600 text-sm">{selectedDoctor?.specialty}</p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{selectedDoctor?.rating} • {selectedDoctor?.experience}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Consultation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Consultation Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {selectedDoctor?.consultationTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setConsultationType(type)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                        consultationType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {getConsultationIcon(type)}
                      <span>{getConsultationLabel(type)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms Description */}
              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit
                </label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Please describe your symptoms, concerns, or questions for the doctor..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('select-doctor')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTime || !symptoms.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Schedule Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                💡 <strong>Note:</strong> You'll receive a confirmation email with video call details or location information based on your consultation type.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}