import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Download, Mail, QrCode, Search, CheckCircle, AlertCircle, Clock, X, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReportsPage = () => {
  const { user, API_URL } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ loading: false, msg: '', error: '' });

  // Read URL query params (e.g., ?id=X) to auto-open a report
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/assessments`);
      setReports(res.data);
      
      // Auto open if ID parameter is provided in route
      const params = new URLSearchParams(location.search);
      const reportId = params.get('id');
      if (reportId) {
        const matching = res.data.find(r => r.id === parseInt(reportId));
        if (matching) setSelectedReport(matching);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (id) => {
    // Standard file stream download link
    window.open(`${API_URL}/assessments/${id}/pdf`, '_blank');
  };

  const handleEmailReport = async (id) => {
    setEmailStatus({ loading: true, msg: '', error: '' });
    try {
      const res = await axios.post(`${API_URL}/assessments/${id}/email`);
      setEmailStatus({ loading: false, msg: res.data.message || 'Report sent successfully to your email!', error: '' });
    } catch (err) {
      setEmailStatus({
        loading: false,
        msg: '',
        error: err.response?.data?.detail || 'Failed to dispatch email. Please check SMTP settings.'
      });
    }
  };

  const filteredReports = reports.filter(r => 
    r.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.predicted_diseases.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSeverityBadgeClass = (sev) => {
    const s = sev.toLowerCase();
    if (s.includes('low')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('medium')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Clinical Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh]">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Reports List (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{t('reports')}</h1>
              <p className="text-xs text-slate-500 mt-1">Review diagnostic summaries and export certified PDF documents.</p>
            </div>
            
            {/* Search Box */}
            <div className="relative rounded-lg shadow-sm max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Search symptoms, diseases..."
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center space-y-3">
              <FileText className="h-14 w-14 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Clinical Reports Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching reports were found. If you haven't taken a symptom analysis, head over to the chatbot.
              </p>
              <Link to="/chat" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold shadow-sm inline-block">
                Start Symptoms Check
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div 
                  key={report.id}
                  onClick={() => { setSelectedReport(report); setEmailStatus({ loading: false, msg: '', error: '' }); }}
                  className={`p-5 bg-white rounded-2xl border transition-all cursor-pointer flex items-center justify-between hover:shadow-md ${
                    selectedReport?.id === report.id ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Assessment MB-#{report.id}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">Symptoms: {report.symptoms}</p>
                    <p className="text-xs text-slate-500">Conditions: {report.predicted_diseases.slice(0, 3).join(', ')}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getSeverityBadgeClass(report.severity_level)}`}>
                      {report.severity_level}
                    </span>
                    {report.is_approved_by_doctor ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" title="Reviewed by doctor" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" title="Awaiting doctor review" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Detailed View (Col 5) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {!selectedReport ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[450px]">
                <FileText className="h-16 w-16 text-slate-200 mb-4 clinical-pulse" />
                <h3 className="font-bold text-slate-700 text-base">Select a Report to View</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2">
                  Click on any assessment item in the list to view diagnostic scores, doctor comments, QR verification, and download reports.
                </p>
              </div>
            ) : (
              <motion.div 
                key={selectedReport.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6"
              >
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Report MB-#{selectedReport.id}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getSeverityBadgeClass(selectedReport.severity_level)}`}>
                    {selectedReport.severity_level}
                  </span>
                </div>

                {/* Patient / Symptoms details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Reported Symptoms</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">{selectedReport.symptoms}</p>
                  </div>

                  {/* Conditions List */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Predicted Diseases</span>
                    <div className="space-y-2">
                      {selectedReport.predicted_diseases.map(disease => {
                        const score = selectedReport.confidence_scores[disease] || 0.1;
                        const pct = Math.round(score * 100);
                        return (
                          <div key={disease} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 font-medium">
                            <span className="text-slate-800">{disease}</span>
                            <span className="text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-bold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Reviews */}
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-primary-800">
                      <span>{t('approvedByDoctor')}</span>
                      <span className={selectedReport.is_approved_by_doctor ? 'text-emerald-700' : 'text-amber-700'}>
                        {selectedReport.is_approved_by_doctor ? t('approved') : t('pendingReview')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      <span className="font-bold text-slate-700 block">Doctor Notes:</span>
                      {selectedReport.doctor_notes || "Awaiting consultation feedback and clinician sign-off."}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Clinical Recommendations</span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-success-50/30 p-3 rounded-xl border border-success-100/50 italic">
                      {selectedReport.recommendations}
                    </p>
                  </div>

                  {/* Export Options */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownloadPdf(selectedReport.id)}
                        className="flex items-center justify-center space-x-1.5 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all bg-white"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                      <button
                        onClick={() => handleEmailReport(selectedReport.id)}
                        disabled={emailStatus.loading}
                        className="flex items-center justify-center space-x-1.5 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{emailStatus.loading ? 'Sending...' : 'Email Report'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowQrModal(true)}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold bg-white transition-all"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>View Verification QR Code</span>
                    </button>
                  </div>
                  
                  {/* Email Success/Error Indicator */}
                  {emailStatus.msg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{emailStatus.msg}</span>
                    </div>
                  )}
                  {emailStatus.error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-1.5 text-xs text-red-700 font-medium">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{emailStatus.error}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Code Verification Modal */}
      {showQrModal && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center relative border border-slate-100 shadow-xl space-y-4"
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg hover:text-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <QrCode className="h-10 w-10 text-primary-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">QR-Based Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scan this code to verify the authenticity of assessment report MB-#{selectedReport.id} on the MediBot secure network.
            </p>

            {/* Render dynamically using public API QR Code Generator */}
            <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-100 mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://medibot.local/assessment/${selectedReport.id}`}
                alt="Verification QR Code"
                className="w-36 h-36 mx-auto"
              />
            </div>
            
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Secure SHA-256 Validated</p>
          </motion.div>
        </div>
      )}
      
    </div>
  );
};

export default ReportsPage;
