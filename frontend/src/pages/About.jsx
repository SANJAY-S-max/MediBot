import React from 'react';
import { HeartPulse, Database, Bot, PhoneCall, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh] slide-up">
      
      <div className="flex items-center space-x-2 mb-6">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">About MediBot AI Platform</h1>
      </div>

      {/* Clinical Disclaimer Box */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex items-start space-x-3 mb-8 shadow-sm">
        <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="font-bold text-red-900 text-sm">Regulatory Notice & Disclaimer</h4>
          <p className="text-xs text-red-700 leading-relaxed font-medium">
            MediBot is a clinical dispatcher prototype. This system provides preliminary health guidance only and is NOT a substitute for professional medical diagnosis, treatment, or advice. Patients should always verify AI recommendations with qualified physicians.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-slate-700">
        
        {/* Core Architecture */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary-500" />
            <span>Retrieval-Augmented Generation (RAG) Architecture</span>
          </h2>
          <p className="text-sm leading-relaxed">
            MediBot utilizes a local vector search database index (compiled using <b>FAISS</b> and <b>Sentence Transformers</b> embeddings) to retrieve medical documents prior to querying Google Gemini.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2 text-xs">
            <p className="font-bold text-slate-800">Guideline Databases Indexed:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>World Health Organization (WHO) protocols for acute cardiac warnings, stroke diagnostics, and respiratory infections.</li>
              <li>Ministry of Health & Family Welfare manuals on Type 2 Diabetes, essential hypertension, and maternal health immunization.</li>
              <li>Community health awareness pamphlets detailing triggers and preventions for vector-borne diseases (Dengue/Malaria) and GERD.</li>
            </ul>
          </div>
        </div>

        {/* Telephony Dispatcher */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <PhoneCall className="h-5 w-5 text-success-500" />
            <span>Twilio IVR Voice Webhook Routing</span>
          </h2>
          <p className="text-sm leading-relaxed">
            For individuals in remote settings lacking data access, MediBot integrates a voice dispatcher. When a caller dials the system hotline:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
              <span className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center font-bold mx-auto mb-2 text-slate-700">1</span>
              <p className="font-bold text-slate-800">Press Language</p>
              <p className="text-slate-500 mt-1">Caller presses 1 for Tamil, 2 for English, 3 for Hindi.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
              <span className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center font-bold mx-auto mb-2 text-slate-700">2</span>
              <p className="font-bold text-slate-800">Describe Symptoms</p>
              <p className="text-slate-500 mt-1">Twilio Speech-to-Text transcribes caller speech input in real-time.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
              <span className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center font-bold mx-auto mb-2 text-slate-700">3</span>
              <p className="font-bold text-slate-800">Voice Readback</p>
              <p className="text-slate-500 mt-1">Gemini returns risk status and recommendations spoken back by Polly TTS.</p>
            </div>
          </div>
        </div>

        {/* Developer Credits */}
        <div className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary-500" />
            <span>Developer and Tech Stack Summary</span>
          </h2>
          <p className="text-sm leading-relaxed">
            MediBot is engineered as a decoupled application. The backend runs FastAPI (Python) serving REST APIs, database queries (SQLAlchemy), and ReportLab report generations. The frontend runs React.js (Vite) styled with Tailwind CSS utility modules.
          </p>
        </div>

      </div>
      
    </div>
  );
};

export default About;
