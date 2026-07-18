import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, Trash2, Mail, Phone, ToggleLeft, ToggleRight, Sparkles, CheckCircle, Bell, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MedicationReminders = () => {
  const { API_URL } = useAuth();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [emailReminder, setEmailReminder] = useState(true);
  const [smsReminder, setSmsReminder] = useState(false);
  const [pushNotification, setPushNotification] = useState(true);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [simMsg, setSimMsg] = useState('');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/reminders`);
      setReminders(res.data);
    } catch (err) {
      console.error("Error loading reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!medicineName || !dosage) return;

    try {
      const payload = {
        medicine_name: medicineName,
        dosage,
        frequency,
        email_reminder: emailReminder,
        sms_reminder: smsReminder,
        push_notification: pushNotification
      };

      const res = await axios.post(`${API_URL}/reminders`, payload);
      setReminders(prev => [...prev, res.data]);
      setSuccessMsg('Medication reminder scheduled successfully!');
      
      // Reset form
      setMedicineName('');
      setDosage('');
      setFrequency('Once daily');
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error saving reminder:", err);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await axios.delete(`${API_URL}/reminders/${id}`);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  };

  const handleTriggerSim = async () => {
    setSimulating(true);
    setSimMsg('');
    try {
      const res = await axios.post(`${API_URL}/reminders/trigger-sim`);
      setSimMsg(res.data.message || 'Pill alerts triggered successfully!');
      setTimeout(() => setSimMsg(''), 5000);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Reminder Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh]">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Pill & Medication Reminders</h1>
            <p className="text-xs text-slate-500 mt-0.5">Configure automated SMS and email alerts for your drug schedule.</p>
          </div>
        </div>

        {/* Simulation trigger */}
        <button
          onClick={handleTriggerSim}
          disabled={simulating || reminders.length === 0}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
        >
          <Sparkles className="h-4 w-4 text-warning-500 animate-spin" style={{ animationDuration: '3s' }} />
          <span>{simulating ? 'Simulating...' : 'Trigger Alerts Now'}</span>
        </button>
      </div>

      {simMsg && (
        <div className="p-4 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl mb-6 text-sm flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <span>{simMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form to Add Reminder (Col 5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary-500" />
            <span>Add New Schedule</span>
          </h2>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Medicine Name</label>
              <input
                type="text"
                required
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="E.g., Metformin 500mg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Dosage</label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="E.g., 1 tablet, 2 puffs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="As needed">As needed</option>
              </select>
            </div>

            {/* Notification channels */}
            <div className="pt-2 space-y-3">
              <span className="block text-xs font-semibold text-slate-600 uppercase">Alert Channels</span>
              
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>Email Notifications</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailReminder(!emailReminder)}
                  className="text-primary-600 focus:outline-none"
                >
                  {emailReminder ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>SMS Alerts (Twilio)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsReminder(!smsReminder)}
                  className="text-primary-600 focus:outline-none"
                >
                  {smsReminder ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span>Push Alert (Browser)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPushNotification(!pushNotification)}
                  className="text-primary-600 focus:outline-none"
                >
                  {pushNotification ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
            >
              Schedule Reminder
            </button>
          </form>
        </div>

        {/* Reminders List (Col 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 text-base">Active Medications ({reminders.length})</h2>

          {reminders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Clock className="h-14 w-14 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-500">No active medications scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((rem) => (
                <div key={rem.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl mt-0.5">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">{rem.medicine_name}</p>
                      <p className="text-xs text-slate-500">Dosage: {rem.dosage}</p>
                      <p className="text-[10px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-bold inline-block">{rem.frequency}</p>
                      
                      {/* Active channels summary */}
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-1">
                        {rem.email_reminder && <span className="flex items-center space-x-0.5"><Mail className="h-3 w-3" /> <span>Email</span></span>}
                        {rem.sms_reminder && <span className="flex items-center space-x-0.5"><Phone className="h-3 w-3" /> <span>SMS</span></span>}
                        {rem.push_notification && <span className="flex items-center space-x-0.5"><Bell className="h-3 w-3" /> <span>Push</span></span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-2 bg-white text-slate-400 hover:text-danger-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors"
                    title="Remove Reminder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
};

export default MedicationReminders;
