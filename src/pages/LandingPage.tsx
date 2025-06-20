import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  Video, 
  MessageCircle,
  Stethoscope,
  Activity,
  ChevronRight,
  Star
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                VirtualDoc
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              
              {/* Bolt.new Logo - Positioned below Get Started button */}
              <a 
                href="https://bolt.new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block transition-transform hover:scale-110 duration-200"
                title="Powered by Bolt.new"
              >
                <img 
                  src="/black_circle_360x360 copy.png" 
                  alt="Powered by Bolt.new" 
                  className="w-10 h-10 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-teal-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Your AI-Driven
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent block">
                Telemedicine
              </span>
              Companion
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              Advanced healthcare platform connecting patients, healthcare workers, and doctors 
              through intelligent AI assistance and seamless video consultations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Your Health Journey
              </Link>
              <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-gray-50">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Healthcare Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of healthcare with our comprehensive platform designed for every healthcare stakeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Patient Features */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Patients</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <MessageCircle className="w-5 h-5 text-blue-600 mr-3" />
                  AI-powered chat assistance
                </li>
                <li className="flex items-center">
                  <Video className="w-5 h-5 text-blue-600 mr-3" />
                  24/7 video consultations
                </li>
                <li className="flex items-center">
                  <Activity className="w-5 h-5 text-blue-600 mr-3" />
                  Voice message support
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-600 mr-3" />
                  Emergency escalation
                </li>
              </ul>
            </div>

            {/* Health Worker Features */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border border-teal-200">
              <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Healthcare Workers</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <Activity className="w-5 h-5 text-teal-600 mr-3" />
                  Vital sign monitoring
                </li>
                <li className="flex items-center">
                  <MessageCircle className="w-5 h-5 text-teal-600 mr-3" />
                  AI analysis & recommendations
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-teal-600 mr-3" />
                  Emergency protocols
                </li>
                <li className="flex items-center">
                  <Users className="w-5 h-5 text-teal-600 mr-3" />
                  Patient care coordination
                </li>
              </ul>
            </div>

            {/* Doctor Features */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Doctors</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-3" />
                  Patient case management
                </li>
                <li className="flex items-center">
                  <Video className="w-5 h-5 text-green-600 mr-3" />
                  Consultation scheduling
                </li>
                <li className="flex items-center">
                  <Activity className="w-5 h-5 text-green-600 mr-3" />
                  Medical review workflow
                </li>
                <li className="flex items-center">
                  <Clock className="w-5 h-5 text-green-600 mr-3" />
                  Follow-up management
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100 text-lg">Available Support</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">AI</div>
              <div className="text-blue-100 text-lg">Powered Assistance</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
              <div className="text-blue-100 text-lg">User Roles</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-blue-100 text-lg">Secure Platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Join thousands of healthcare professionals and patients already using VirtualDoc 
            for better health outcomes.
          </p>
          <Link 
            to="/login" 
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-12 py-5 rounded-xl font-semibold text-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">VirtualDoc</span>
            </div>
            <div className="text-gray-400 flex items-center space-x-4">
              <span>© 2025 VirtualDoc. Transforming healthcare through AI.</span>
              <a 
                href="https://bolt.new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <img 
                  src="/black_circle_360x360 copy.png" 
                  alt="Built with Bolt.new" 
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm">Built with Bolt.new</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}