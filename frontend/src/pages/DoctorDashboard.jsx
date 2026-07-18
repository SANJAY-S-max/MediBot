import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Calendar, Clock, FileText, CheckCircle, AlertCircle, PlusCircle, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorDashboard = () => {
  const { user, API_URL } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback review state
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetchDoctorDashboardData();
  }, []);

  const fetchDoctorDashboardData = async () => {
    try {
      setLoading(true);
      const [apptRes, astRes] = await Promise.all([
        axios.get(`${API_URL}/appointments`),
        axios.get(`${API_URL}/assessments`)
      ]);
      setAppointments(apptRes.data);
      setAssessments(astRes.data);
    } catch (err) {
      console.error("Error loading doctor dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (id, status) => {
    try {
      await axios.put(`${API_URL}/appointments/${id}`, { status });
      // Reload lists
      fetchDoctorDashboardData();
    } catch (err) {
      console.error("Error updating appointment:", err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) return;

    try {
      const res = await axios.put(`${API_URL}/doctors/feedback/${selectedAssessment.id}`, {
        doctor_notes: doctorNotes,
        is_approved_by_doctor: isApproved
      });
      
      // Update assessment in state list
      setAssessments(prev => prev.map(a => a.id === selectedAssessment.id ? res.data : a));
      setSelectedAssessment(res.data);
      setFeedbackSuccess('Clinical notes and recommendations approval saved successfully!');
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err) {
      console.error("Error saving doctor feedback:", err);
    }
  };

  const getSeverityBadgeClass = (sev) => {
    const s = sev.toLowerCase();
    if (s.includes('low')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('medium')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-red-50 text-red-700 border-red-100 animate-pulse';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh]">
      
      {/* Clinician Title Card */}
      <div className="bg-gradient-to-r from-success-800 to-success-950 rounded-3xl p-6 md:p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">Authorized Practitioner</span>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{user?.name}</h1>
          <p className="text-sm text-success-200 mt-1">Specialization: {user?.doctor_profile?.specialization} | License: {user?.doctor_profile?.license_number}</p>
        </div>
        <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-xs space-y-1">
          <p>Consultation Fee: <b>${user?.doctor_profile?.consultation_fee}</b></p>
          <p>Weekly Slots: <b>{user?.doctor_profile?.availability_slots?.join(', ')}</b></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Appointments Queue & Assessments Queue (Col 7) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Appointments Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-success-600" />
              <span>Assigned Patient Consultations</span>
            </h2>
            
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No patient consultation bookings found.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <div key={appt.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">Patient: {appt.patient?.name || 'Jane Doe'}</p>
                      <p className="text-xs text-slate-500">Scheduled: {new Date(appt.appointment_time).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Medical History: {appt.patient?.medical_history || 'None reported'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {appt.status.toLowerCase() === 'requested' ? (
                        <>
                          <button
                            onClick={() => handleUpdateAppointment(appt.id, 'accepted')}
                            className="p-1.5 bg-success-600 hover:bg-success-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleUpdateAppointment(appt.id, 'rejected')}
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center space-x-1"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          appt.status.toLowerCase() === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {appt.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessments Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <FileText className="h-5 w-5 text-success-600" />
              <span>Symptom Assessment Audits Queue</span>
            </h2>

            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No symptom assessments submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {assessments.map(ast => (
                  <div 
                    key={ast.id}
                    onClick={() => {
                      setSelectedAssessment(ast);
                      setDoctorNotes(ast.doctor_notes || '');
                      setIsApproved(ast.is_approved_by_doctor);
                      setFeedbackSuccess('');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center bg-slate-50 hover:bg-white hover:shadow-md ${
                      selectedAssessment?.id === ast.id ? 'border-success-500 ring-2 ring-success-500/10 bg-white shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">MB-#{ast.id} • {new Date(ast.created_at).toLocaleDateString()}</p>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">Symptoms: {ast.symptoms}</p>
                      <p className="text-xs text-slate-500">Conditions: {ast.predicted_diseases.slice(0, 2).join(', ')}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getSeverityBadgeClass(ast.severity_level)}`}>
                        {ast.severity_level}
                      </span>
                      {ast.is_approved_by_doctor ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Feedback Editor & Transcript (Col 5) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {!selectedAssessment ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
                <FileText className="h-16 w-16 text-slate-200 mb-4 clinical-pulse" />
                <h3 className="font-bold text-slate-700 text-base">Select Assessment to Review</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2">
                  Click on any patient assessment in the ledger to read the chat log transcript, sign-off recommendations, and insert notes.
                </p>
              </div>
            ) : (
              <motion.div
                key={selectedAssessment.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Assessment MB-#{selectedAssessment.id}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Submitted: {new Date(selectedAssessment.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getSeverityBadgeClass(selectedAssessment.severity_level)}`}>
                    {selectedAssessment.severity_level}
                  </span>
                </div>

                {/* 1. Chat Logs */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Conversation Transcript</span>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl max-h-48 overflow-y-auto space-y-2 text-xs">
                    {selectedAssessment.conversation_history ? (
                      selectedAssessment.conversation_history.map((msg, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className={`font-bold ${msg.role === 'user' ? 'text-primary-700' : 'text-success-700'}`}>
                            {msg.role === 'user' ? 'Patient' : 'MediBot'}:
                          </span>
                          <p className="text-slate-600 pl-2">{msg.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">No chat log recorded (IVR single-turn call).</p>
                    )}
                  </div>
                </div>

                {/* 2. Predicted Conditions */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">AI Disease Projections</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAssessment.predicted_diseases.map(disease => (
                      <span key={disease} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Notes Submission Form */}
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Clinician Sign-off</h3>
                  
                  {feedbackSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle className="h-4 w-4" />
                      <span>{feedbackSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Physician Notes</label>
                    <textarea
                      required
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-success-500"
                      rows="3"
                      placeholder="Enter patient diagnosis feedback, prescription adjustments, or instructions..."
                    ></textarea>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="approve-chk"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="h-4 w-4 text-success-600 focus:ring-success-500 border-slate-300 rounded"
                    />
                    <label htmlFor="approve-chk" className="text-xs font-bold text-slate-700">
                      Approve Preliminary Recommendations
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 bg-success-600 hover:bg-success-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                  >
                    Save Clinical Signature
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      
    </div>
  );
};

export default DoctorDashboard;
