import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Activity, ShieldAlert, HeartPulse, Clock, Sparkles, Plus, FileText, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DAILY_TIPS = [
  "Stay hydrated: Drink at least 3 liters of water daily to support metabolic function.",
  "Sodium restriction: Limit salt intake to less than 5 grams per day to protect cardiovascular health.",
  "Physical activity: Aim for 150 minutes of moderate exercise, like brisk walking, per week.",
  "Dietary fiber: Increase consumption of whole grains, fresh vegetables, and fruits.",
  "Sleep hygiene: Secure 7-8 hours of sound sleep to regulate immune responses and stress levels."
];

const PatientDashboard = () => {
  const { user, API_URL } = useAuth();
  const { t } = useLanguage();

  const [assessments, setAssessments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(100);
  const [dailyTip, setDailyTip] = useState('');

  useEffect(() => {
    fetchDashboardData();
    // Set a random daily tip
    setDailyTip(DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)]);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [astRes, remRes] = await Promise.all([
        axios.get(`${API_URL}/assessments`),
        axios.get(`${API_URL}/reminders`)
      ]);
      
      setAssessments(astRes.data);
      setReminders(astRes.data.length ? remRes.data : []);
      
      // Calculate dynamic Health Score
      // Starts at 100, drops by 5 for low risk, 20 for medium risk, 45 for high risk
      let score = 100;
      astRes.data.forEach(ast => {
        const sev = ast.severity_level.toLowerCase();
        if (sev.includes('high')) score -= 40;
        else if (sev.includes('medium')) score -= 15;
        else score -= 5;
      });
      setHealthScore(Math.max(30, score)); // Baseline floor is 30
      
    } catch (err) {
      console.error("Error fetching dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get color configurations based on score range
  const getScoreColor = (score) => {
    if (score >= 80) return { stroke: '#10b981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' }; // Green
    if (score >= 50) return { stroke: '#f59e0b', bg: 'bg-amber-50 text-amber-700 border-amber-100' };    // Yellow
    return { stroke: '#ef4444', bg: 'bg-red-50 text-red-700 border-red-100' };                         // Red
  };

  const scoreTheme = getScoreColor(healthScore);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Clinical Dashboard...</p>
        </div>
      </div>
    );
  }

  // Get recent severity tags colors
  const getSeverityStyle = (sev) => {
    const s = sev.toLowerCase();
    if (s.includes('low')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('medium')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50">
      
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-800 to-primary-950 rounded-3xl p-6 md:p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('welcome')}, {user?.name}!</h1>
          <p className="text-sm text-primary-200 mt-1">Check your symptom records, schedules, or start a new virtual assessment.</p>
        </div>
        <Link 
          to="/chat" 
          className="px-5 py-3 bg-white text-primary-900 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Symptom Check</span>
        </Link>
      </motion.div>

      {/* Grid: Health Score Circular Indicator + Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        
        {/* Circular Health Score Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center"
        >
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">{t('healthScore')}</h2>
          
          <div className="relative h-40 w-40 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="absolute transform -rotate-90 w-full h-full">
              <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                stroke={scoreTheme.stroke} 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * healthScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-extrabold text-slate-800">{healthScore}</span>
              <span className="text-sm text-slate-400 block">/ 100</span>
            </div>
          </div>
          
          <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold border ${scoreTheme.bg}`}>
            {healthScore >= 80 ? 'Optimal Condition' : (healthScore >= 50 ? 'Mild Risk Factors' : 'Action Required')}
          </div>
        </motion.div>

        {/* Chronic Monitoring & Health Tips */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
          
          {/* Daily Health Tips */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-success-600">
                <Sparkles className="h-5 w-5" />
                <h2 className="font-bold text-sm uppercase tracking-wider">{t('dailyTips')}</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{dailyTip}"
              </p>
            </div>
            <div className="pt-4 border-t border-slate-50 text-xs text-slate-400">
              Tips generated using clinical guidelines databases.
            </div>
          </motion.div>

          {/* Chronic Monitoring Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-primary-600">
                <HeartPulse className="h-5 w-5" />
                <h2 className="font-bold text-sm uppercase tracking-wider">{t('chronicMonitoring')}</h2>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Registered Medical History Context:</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-700 max-h-20 overflow-y-auto">
                  {user?.medical_history || "No pre-existing conditions reported."}
                </div>
              </div>
            </div>
            <Link to="/settings" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1 mt-2">
              <span>Update Medical History</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Grid: Recent Assessments & Pill Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Assessments History */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-slate-800">{t('recentAssessments')}</h2>
            <Link to="/reports" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1">
              <span>View All Reports</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <FileText className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">No symptom checks found yet. Use our chatbot to check symptoms.</p>
              <Link to="/chat" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold inline-block shadow-sm">
                Start Symptoms Check
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.slice(0, 3).map((ast) => (
                <div key={ast.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">{new Date(ast.created_at).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">Symptoms: {ast.symptoms}</p>
                    <p className="text-xs text-slate-500">Predicted: {ast.predicted_diseases.slice(0, 3).join(', ')}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getSeverityStyle(ast.severity_level)}`}>
                      {ast.severity_level}
                    </span>
                    <Link 
                      to={`/reports?id=${ast.id}`}
                      className="p-1.5 bg-white text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-slate-200 transition-colors"
                      title="View detailed report"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Medication Pill Reminders */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-slate-800">{t('reminderAlert')}</h2>
            <Link to="/reminders" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1">
              <span>Manage Pills</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Clock className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No active pill reminders configured.</p>
              <Link to="/reminders" className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold inline-block border border-slate-200">
                Configure Pill
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.slice(0, 4).map((rem) => (
                <div key={rem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800">{rem.medicine_name}</p>
                    <p className="text-xs text-slate-500">Dosage: {rem.dosage}</p>
                    <p className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded inline-block font-semibold mt-1">{rem.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
};

export default PatientDashboard;
