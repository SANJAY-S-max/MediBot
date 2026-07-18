import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Calendar, Clock, Video, CheckCircle2, XCircle, Clock4, ShieldCheck, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TelemedicinePage = () => {
  const { API_URL } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking states
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Active Jitsi Call Frame
  const [activeCallUrl, setActiveCallUrl] = useState(null);

  useEffect(() => {
    fetchTelehealthData();
  }, []);

  const fetchTelehealthData = async () => {
    try {
      setLoading(true);
      const [docRes, apptRes] = await Promise.all([
        axios.get(`${API_URL}/doctors`),
        axios.get(`${API_URL}/appointments`)
      ]);
      setDoctors(docRes.data);
      setAppointments(apptRes.data);
      if (docRes.data.length) setSelectedDoctorId(docRes.data[0].id.toString());
    } catch (err) {
      console.error("Error loading telehealth records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookingTime) return;

    try {
      const payload = {
        doctor_id: parseInt(selectedDoctorId),
        appointment_time: new Date(bookingTime).toISOString()
      };
      
      const res = await axios.post(`${API_URL}/appointments`, payload);
      setAppointments(prev => [...prev, res.data]);
      setSuccessMsg('Consultation requested successfully! The doctor will review your slot shortly.');
      setBookingTime('');
      // Reload lists
      fetchTelehealthData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error("Booking error:", err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'rescheduled':
        return <Clock4 className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock4 className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'rescheduled':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Telehealth Clinic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh]">
      
      <div className="flex items-center space-x-2 mb-6">
        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Telemedicine Consultation Clinic</h1>
          <p className="text-xs text-slate-500 mt-0.5">Request web appointments and join encrypted high-definition webcam consultations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Book Appointment Form (Col 5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            <span>Request Consultation</span>
          </h2>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {doctors.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-500">
              No doctors are approved and active right now. Pending profiles must be approved by the admin.
            </div>
          ) : (
            <form onSubmit={handleBookConsultation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization}) - ${doc.consultation_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Select Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
              >
                Book Appointment Slot
              </button>
            </form>
          )}

          {/* List of active doctors and their slots */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Clinical Team</h3>
            <div className="space-y-3">
              {doctors.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{doc.name}</p>
                    <p className="text-slate-500 font-medium">{doc.specialization} • Fee: ${doc.consultation_fee}</p>
                    <p className="text-slate-400 mt-1">Slots: {doc.availability_slots.join(', ')}</p>
                  </div>
                  <Stethoscope className="h-5 w-5 text-primary-500 pl-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Queue (Col 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 text-base">My Booking Ledger ({appointments.length})</h2>

          {appointments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar className="h-14 w-14 text-slate-200 mx-auto animate-pulse" />
              <p className="text-sm text-slate-500">No appointments scheduled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl mt-0.5">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">
                        {appt.doctor ? appt.doctor.name : 'Medical Doctor'} ({appt.doctor ? appt.doctor.specialization : 'General Clinic'})
                      </p>
                      <p className="text-xs text-slate-500">
                        Scheduled: {new Date(appt.appointment_time).toLocaleString()}
                      </p>
                      {appt.status.toLowerCase() === 'accepted' && (
                        <div className="flex items-center space-x-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1 border border-emerald-100">
                          <ShieldCheck className="h-3 w-3 inline" />
                          <span>Video Call Room Activated</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusBadge(appt.status)}`}>
                      {appt.status.toUpperCase()}
                    </span>

                    {appt.status.toLowerCase() === 'accepted' && appt.meeting_link && (
                      <button
                        onClick={() => setActiveCallUrl(appt.meeting_link)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center space-x-1"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Start Video Call</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Embedded Jitsi Meeting Portal Modal */}
      {activeCallUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden shadow-2xl border border-slate-800"
          >
            {/* Header controls */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Video className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wider">MediBot Encrypted Videocall Portal</span>
              </div>
              <button
                onClick={() => setActiveCallUrl(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-colors"
                title="Hang up call"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Call Iframe */}
            <div className="flex-1 w-full bg-black">
              <iframe
                src={`${activeCallUrl}#config.prejoinPageEnabled=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","chat","tileview","hangup"]`}
                title="Telehealth consultation video stream"
                className="w-full h-full border-0"
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
              ></iframe>
            </div>
            
            <div className="py-2.5 px-6 bg-slate-950 text-[10px] text-slate-500 text-center font-bold tracking-widest uppercase">
              WebRTC Powered • Secure Clinical Link
            </div>
          </motion.div>
        </div>
      )}
      
    </div>
  );
};

export default TelemedicinePage;
