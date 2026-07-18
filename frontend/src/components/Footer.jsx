import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, HeartPulse } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto border-t border-slate-900">
      {/* Disclaimer Banner */}
      <div className="bg-red-950/40 border-b border-red-900/50 py-3 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-xs md:text-sm text-red-400">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 animate-pulse text-red-500" />
          <span className="font-semibold leading-relaxed">
            {t('disclaimer')}
          </span>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 text-white mb-3">
              <HeartPulse className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-bold">MediBot System</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              A multilingual clinical assistant providing RAG-supported preliminary symptom analyses and telehealth integrations.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>World Health Organization (WHO) Guidelines</li>
              <li>Ministry of Health and Family Welfare Guidelines</li>
              <li>Jitsi Meet Video Communications</li>
              <li>Twilio Programmable Voice Engines</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Compliance & Scope</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              This application operates as a hackathon demonstration. Clinical database suggestions are computed using Google Gemini Large Language models and should not be used as official diagnostic orders.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600">
          <p>&copy; {currentYear} MediBot Inc. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span className="hover:text-slate-500 transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-500 transition-colors">Terms of Service</span>
            <span className="hover:text-slate-500 transition-colors">HIPAA Notice</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
