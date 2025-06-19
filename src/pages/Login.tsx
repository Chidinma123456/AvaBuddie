import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, User, Stethoscope, Users } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';

export default function Login() {
  const [step, setStep] = useState<'role' | 'credentials'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: 'patient' as UserRole,
      title: 'Patient',
      description: 'Access AI-powered healthcare assistance, consultations, and medical support.',
      icon: User,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'health-worker' as UserRole,
      title: 'Healthcare Worker',
      description: 'Monitor patient vitals, provide care coordination, and access clinical tools.',
      icon: Stethoscope,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      id: 'doctor' as UserRole,
      title: 'Doctor',
      description: 'Manage patient cases, conduct consultations, and oversee medical care.',
      icon: Users,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { role } = await login(email, password);
        
        // Navigate based on the user's actual role from the database
        switch (role) {
          case 'patient':
            navigate('/patient');
            break;
          case 'health-worker':
            navigate('/health-worker');
            break;
          case 'doctor':
            navigate('/doctor');
            break;
          default:
            navigate('/');
        }
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        await signup(email, password, { name: name.trim(), role: selectedRole });
        
        // Navigate based on selected role for new signups
        switch (selectedRole) {
          case 'patient':
            navigate('/patient');
            break;
          case 'health-worker':
            navigate('/health-worker');
            break;
          case 'doctor':
            navigate('/doctor');
            break;
        }
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before signing in.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.message?.includes('Login timeout') || error.message?.includes('Signup timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3 text-white mb-16">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold">VirtualDoc</span>
          </Link>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Advanced Healthcare Platform
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Connecting patients, healthcare workers, and doctors through intelligent AI assistance 
              and seamless communication.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-3 gap-6 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-blue-200 text-sm">Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">AI</div>
            <div className="text-blue-200 text-sm">Powered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">Secure</div>
            <div className="text-blue-200 text-sm">Platform</div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {step === 'role' ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
                <p className="text-gray-600">Select how you'll be using VirtualDoc</p>
              </div>

              <div className="space-y-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${role.gradient} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{role.title}</h3>
                          <p className="text-gray-600 text-sm">{role.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <button 
                onClick={() => {
                  setStep('role');
                  setError('');
                }}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change role
              </button>

              <div className="text-center mb-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${roles.find(r => r.id === selectedRole)?.gradient} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  {selectedRole && React.createElement(roles.find(r => r.id === selectedRole)?.icon || User, {
                    className: "w-8 h-8 text-white"
                  })}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600">
                  {isLogin ? 'Sign in' : 'Sign up'} as a {roles.find(r => r.id === selectedRole)?.title}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}