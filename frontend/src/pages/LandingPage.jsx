import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeartPulse, Bot, Stethoscope, PhoneCall, ShieldCheck, ArrowRight, Activity, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-slate-50 min-h-screen">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl"></div>
      <div className="absolute bottom-10 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-emerald-100/30 blur-3xl"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
              <Bot className="h-4 w-4" />
              <span>Next-Gen Healthcare Dispatcher</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Your AI-Powered <br />
              <span className="bg-gradient-to-r from-primary-600 to-success-600 bg-clip-text text-transparent">
                Multilingual Health
              </span> Companion
            </h1>
            
            <p className="text-lg text-slate-600 max-w-xl">
              Describe symptoms in English, Hindi, or Tamil. Get immediate preliminary condition risk assessments, RAG-guided wellness suggestions, schedule telemedicine consultations, and set medicine reminders.
            </p>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
              {user ? (
                <Link
                  to={user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/dashboard'}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-primary-200 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-primary-200 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                  >
                    {t('login')}
                  </Link>
                </>
              )}
            </div>

            {/* Disclaimer Box */}
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl max-w-xl text-left">
              <p className="text-xs text-red-600 leading-relaxed font-medium">
                <strong>{t('emergencyAlert').toUpperCase()}:</strong> {t('disclaimer')}
              </p>
            </div>
          </div>

          {/* Interactive UI Cards / Images Mockup */}
          <div className="md:col-span-5 hidden md:block">
            <div className="relative">
              {/* Outer floating assessment block */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[180px] flex items-center space-x-3">
                <div className="p-2.5 bg-success-50 text-success-500 rounded-xl">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Severity Match</p>
                  <p className="text-sm font-bold text-success-700">Low Risk</p>
                </div>
              </div>

              {/* Doctor Slot */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[200px] flex items-center space-x-3">
                <div className="p-2.5 bg-primary-50 text-primary-500 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Telehealth Slot</p>
                  <p className="text-sm font-bold text-primary-700">Video Link Active</p>
                </div>
              </div>

              {/* Main Illustration Panel */}
              <div className="w-full h-80 bg-gradient-to-br from-primary-500 to-success-600 rounded-3xl p-8 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <HeartPulse className="h-10 w-10 text-white" />
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">Gemini AI Active</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/80">MediBot Vector Search</p>
                  <p className="text-2xl font-bold leading-tight">Retrieval-Augmented Guidance (RAG) System</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">Comprehensive AI Health Dispatcher</h2>
            <p className="text-slate-600">MediBot features complete patients, doctors, and administrative modules to support integrated primary health checks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-white transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Symptom Chatbot</h3>
              <p className="text-sm text-slate-600">Dynamic clinical dialogue checks. Converts verbal or text feedback in EN, HI, or TA into parsed conditions.</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-white transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-success-100 text-success-600 flex items-center justify-center font-bold">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Doctor Portals</h3>
              <p className="text-sm text-slate-600">Approved practitioners review patient logs, append manual clinical notes, and authorize system reports.</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-white transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <PhoneCall className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Twilio IVR Dial-In</h3>
              <p className="text-sm text-slate-600">No internet? Place a phone call to MediBot, speak symptoms, and receive voice analysis recommendations.</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-white transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Secure Audit Logs</h3>
              <p className="text-sm text-slate-600">Encrypted JWT tokens protect data paths. Complete administrative tracking logs record actions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bonus / IVR details */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute bottom-0 right-0 h-64 w-64 bg-primary-600/10 rounded-full blur-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <h2 className="text-2xl md:text-4xl font-bold">Demo Twilio Voice IVR</h2>
              <p className="text-slate-400 max-w-xl">
                Simulate a patient dialing the health line. Call our endpoint, choose language, speak symptoms, and listen to the diagnosis. Easily testable locally using an ngrok tunnel.
              </p>
              <div className="flex flex-wrap gap-4 text-sm pt-2">
                <div className="flex items-center space-x-2 text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Clock className="h-4 w-4 text-primary-400" />
                  <span>24/7 Voice Support</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Globe className="h-4 w-4 text-success-400" />
                  <span>Tamil, Hindi, English</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-4 flex justify-center">
              <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700 w-full max-w-[280px]">
                <PhoneCall className="h-10 w-10 text-success-400 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Demo Hotline</p>
                <p className="text-lg font-bold text-white mt-1">+1 (Twilio Number)</p>
                <p className="text-[10px] text-slate-500 mt-2">See README for local testing configuration</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
