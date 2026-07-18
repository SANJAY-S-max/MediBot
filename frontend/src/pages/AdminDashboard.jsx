import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, FileText, Check, Trash2, ShieldAlert, Sparkles, BarChart3, ListFilter, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { API_URL } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, approvals, users, audits

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [anlRes, usersRes, docsRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics`),
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/doctors/pending`),
        axios.get(`${API_URL}/admin/audit-logs`)
      ]);
      setAnalytics(anlRes.data);
      setUsersList(usersRes.data);
      setPendingDoctors(docsRes.data);
      setAuditLogs(logsRes.data);
    } catch (err) {
      console.error("Error loading admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (id) => {
    try {
      await axios.put(`${API_URL}/admin/doctors/${id}/approve`);
      // Reload admin panels
      fetchAdminData();
    } catch (err) {
      console.error("Error approving doctor profile:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`);
      fetchAdminData();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Administrative Portal...</p>
        </div>
      </div>
    );
  }

  // Get matching user name for audit logs
  const getUserName = (userId) => {
    const matched = usersList.find(u => u.id === userId);
    return matched ? matched.name : `User #${userId}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh]">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Administrative Operations & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Configure credentials, review doctor registrations, audit logs, and monitor epidemiological trends.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 gap-6 mb-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 transition-colors ${activeTab === 'metrics' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Overview & Trends
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 transition-colors flex items-center space-x-1.5 ${activeTab === 'approvals' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <span>Practitioner Approvals</span>
          {pendingDoctors.length > 0 && (
            <span className="h-4 w-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {pendingDoctors.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors ${activeTab === 'users' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          User Ledger
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-3 transition-colors ${activeTab === 'audits' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          System Audit Logs
        </button>
      </div>

      {/* Tab 1: Metrics & Trends */}
      {activeTab === 'metrics' && analytics && (
        <div className="space-y-8 slide-up">
          {/* Statistical Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Total Users</span>
                <span className="text-xl font-bold text-slate-800">{analytics.total_users}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Patients</span>
                <span className="text-xl font-bold text-slate-800">{analytics.total_patients}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-success-50 text-success-600 rounded-xl">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Doctors</span>
                <span className="text-xl font-bold text-slate-800">{analytics.total_doctors}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Assessments</span>
                <span className="text-xl font-bold text-slate-800">{analytics.total_assessments}</span>
              </div>
            </div>
          </div>

          {/* Graphs Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Disease trends */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                <span>Epidemiological Disease Trends</span>
              </h3>
              
              <div className="space-y-4">
                {Object.entries(analytics.disease_trends).map(([disease, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.disease_trends), 1);
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={disease} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{disease}</span>
                        <span>{count} occurrences</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-600 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Common symptoms */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-2">
                <ListFilter className="h-5 w-5 text-success-500" />
                <span>Most Common Symptoms Logged</span>
              </h3>

              <div className="space-y-4">
                {analytics.most_common_symptoms.map((symp, idx) => {
                  const maxCount = Math.max(...analytics.most_common_symptoms.map(s => s.count), 1);
                  const pct = Math.round((symp.count / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{symp.name}</span>
                        <span>{symp.count} mentions</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-success-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Doctor Approvals */}
      {activeTab === 'approvals' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 slide-up">
          <h2 className="font-bold text-slate-800 text-base">Practitioner Credentials Approval Queue</h2>
          
          {pendingDoctors.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending practitioner approvals in queue.</p>
          ) : (
            <div className="space-y-4">
              {pendingDoctors.map(doc => {
                // Find matching user info
                const matchedUser = usersList.find(u => u.id === doc.user_id);
                return (
                  <div key={doc.id} className="p-5 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">License Verification Request: {matchedUser?.name || 'Practitioner'}</p>
                      <p className="text-xs text-slate-500">License Number: <span className="font-mono bg-white px-2 py-0.5 border border-slate-200 rounded font-semibold text-slate-700">{doc.license_number}</span></p>
                      <p className="text-xs text-slate-500">Specialization: <b>{doc.specialization}</b> | Fee: <b>${doc.consultation_fee}</b></p>
                      <p className="text-[10px] text-slate-400">Weekly availability slots: {doc.availability_slots?.join(', ')}</p>
                    </div>

                    <button
                      onClick={() => handleApproveDoctor(doc.id)}
                      className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1 self-start sm:self-center"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve Credentials</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users List */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 slide-up">
          <h2 className="font-bold text-slate-800 text-base">MediBot Network Directory</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Phone</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {usersList.map(usr => (
                  <tr key={usr.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-mono">#{usr.id}</td>
                    <td className="py-3 px-2 font-bold text-slate-800">{usr.name}</td>
                    <td className="py-3 px-2">{usr.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                        usr.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' : (usr.role === 'doctor' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-primary-50 text-primary-700 border-primary-100')
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">{usr.phone || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleDeleteUser(usr.id)}
                        className="p-1 text-slate-400 hover:text-danger-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audits' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 slide-up">
          <h2 className="font-bold text-slate-800 text-base">Security Audit Logs Ledger</h2>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4 text-[11px]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                    <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded">#{log.id}</span>
                    <span className="text-slate-800">{getUserName(log.user_id)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-primary-700 uppercase tracking-wide bg-primary-50 px-1.5 py-0.5 border border-primary-100 rounded">{log.action}</span>
                  </div>
                  <p className="text-slate-500 font-medium">Timestamp: {new Date(log.timestamp).toLocaleString()} UTC</p>
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  IP: {log.ip_address || '127.0.0.1'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
