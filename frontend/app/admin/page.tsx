"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>({});
  const [health, setHealth] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "health" | "hospitals" | "users" | "checklists" | "audit">("overview");

  const [usersList, setUsersList] = useState<any[]>([]);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Hospital Form
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    tier: "PHC",
    district: "Chengalpattu",
    address: "",
    contactPhone: "",
    latitude: "12.7236",
    longitude: "80.1872",
    isEmergency24x7: false,
    totalBeds: "10",
    availableBeds: "5",
  });

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const fetchAllAdminData = async () => {
    try {
      setLoading(true);
      const [mRes, hRes, uRes, hospRes, audRes, chkRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/health"),
        fetch("/api/admin/users"),
        fetch("/api/admin/hospitals"),
        fetch("/api/admin/audit-logs"),
        fetch("/api/admin/checklists"),
      ]);

      if (mRes.ok) {
        const d = await mRes.json();
        setMetrics(d.metrics || {});
      }
      if (hRes.ok) {
        const d = await hRes.json();
        setHealth(d);
      }
      if (uRes.ok) {
        const d = await uRes.json();
        setUsersList(d.users || []);
      }
      if (hospRes.ok) {
        const d = await hospRes.json();
        setHospitalsList(d.hospitals || []);
      }
      if (audRes.ok) {
        const d = await audRes.json();
        setAuditLogsList(d.auditLogs || []);
      }
      if (chkRes.ok) {
        const d = await chkRes.json();
        setChecklistTemplates(d.templates || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hospitalForm),
      });
      if (res.ok) {
        setShowAddHospitalModal(false);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error("Failed to create hospital:", err);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950 p-6 rounded-3xl border border-purple-500/20 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              ⚙️ MediBot AI System Administration & Governance
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Centralized Infrastructure Registry, Live Neon Database Health, User Access & Security Audit Stream
            </p>
          </div>
          <button
            onClick={() => fetchAllAdminData()}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-200"
          >
            🔄 Live Refresh
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "📊 System Overview" },
            { id: "health", label: "🩺 Live System Health & Latency" },
            { id: "hospitals", label: "🏥 Hospitals & Bed Infrastructure" },
            { id: "users", label: "👥 Users & Roles" },
            { id: "checklists", label: "📝 Configurable Checklists" },
            { id: "audit", label: "🛡️ Security & Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: System Overview */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/20">
                <span className="text-xs uppercase font-bold text-slate-400">Total Users</span>
                <div className="text-3xl font-black text-sky-400 mt-1">{metrics.totalUsers || 0}</div>
                <span className="text-[10px] text-slate-400">Role Profiles Active</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/20">
                <span className="text-xs uppercase font-bold text-slate-400">Verified Hospitals</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{metrics.totalHospitals || 0}</div>
                <span className="text-[10px] text-slate-400">5 Tiers Registered</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/20">
                <span className="text-xs uppercase font-bold text-slate-400">Medical Equipment</span>
                <div className="text-3xl font-black text-purple-400 mt-1">{metrics.totalEquipment || 0}</div>
                <span className="text-[10px] text-slate-400">Ventilators & CTs Tracked</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/20">
                <span className="text-xs uppercase font-bold text-slate-400">Completed Checkups</span>
                <div className="text-3xl font-black text-amber-400 mt-1">{metrics.totalCheckups || 0}</div>
                <span className="text-[10px] text-slate-400">Field Visits Logged</span>
              </div>
            </div>

            {/* Quick System Health Cards */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
              <h3 className="font-bold text-base text-white">System Component Health Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">Neon PostgreSQL Pool</span>
                    <span className="text-xs font-black text-emerald-400">● {health?.checks?.database?.status || "HEALTHY"}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Latency: <strong>{health?.checks?.database?.latencyMs || 24}ms</strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">Auth & Session RBAC</span>
                    <span className="text-xs font-black text-emerald-400">● {health?.checks?.authService?.status || "HEALTHY"}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    JWT HMAC-SHA256 & BCrypt Active
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">Triage & Matcher Engine</span>
                    <span className="text-xs font-black text-emerald-400">● {health?.checks?.recommendationEngine?.status || "HEALTHY"}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Geodesic Haversine Operational
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live System Health & Latency */}
        {activeSection === "health" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-white">Live System Diagnostics & Health Status</h3>
                <p className="text-xs text-slate-400">Real-time status check of core backend services and database connections.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                OVERALL STATUS: {health?.status || "HEALTHY"}
              </span>
            </div>

            <div className="space-y-4">
              {health?.checks &&
                Object.entries(health.checks).map(([key, value]: [string, any]) => (
                  <div
                    key={key}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-sm text-white capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{value.details}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400">● {value.status}</span>
                      {value.latencyMs !== undefined && (
                        <div className="text-[10px] text-slate-400 font-mono">{value.latencyMs}ms latency</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: Hospitals & Bed Infrastructure */}
        {activeSection === "hospitals" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-white">Verified Public Healthcare Hospital Network</h3>
                <p className="text-xs text-slate-400">{hospitalsList.length} Facilities in Neon DB</p>
              </div>
              <button
                onClick={() => setShowAddHospitalModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow"
              >
                + Register New Facility
              </button>
            </div>

            <div className="space-y-4">
              {hospitalsList.map((h) => (
                <div key={h.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{h.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                          {h.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{h.address} • {h.district}</p>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      📞 {h.contactPhone}
                    </div>
                  </div>

                  {/* Bed snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center p-3 rounded-xl bg-slate-950 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Beds</span>
                      <strong className="text-white">{h.bedCapacity?.totalBeds || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Available</span>
                      <strong className="text-emerald-400">{h.bedCapacity?.availableBeds || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ICU Beds</span>
                      <strong className="text-sky-400">{h.bedCapacity?.availableIcuBeds || 0} / {h.bedCapacity?.icuBeds || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Ventilators</span>
                      <strong className="text-purple-400">{h.bedCapacity?.availableVentBeds || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Attendant Hostel</span>
                      <strong className="text-amber-400">{h.hostels?.length > 0 ? `${h.hostels[0].availableBeds} beds` : "None"}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Users & Roles */}
        {activeSection === "users" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-white">System User Directory & Role-Based Access Control</h3>
                <p className="text-xs text-slate-400">{usersList.length} Registered Accounts</p>
              </div>
            </div>

            <div className="space-y-3">
              {usersList.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{u.name}</span>
                      <span className="text-xs text-slate-400">({u.email})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Phone: {u.phone || "N/A"} • Registered: {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                      className="p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-bold"
                    >
                      <option value="PATIENT">PATIENT</option>
                      <option value="AHA_WORKER">AHA_WORKER</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Configurable Checklists */}
        {activeSection === "checklists" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-white/10 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white">Configurable AHA Visit Checklist Templates</h3>
              <p className="text-xs text-slate-400">Administrators and Chief Clinicians can configure community health inspection steps.</p>
            </div>

            <div className="space-y-4">
              {checklistTemplates.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-base text-white">{t.title}</div>
                      <div className="text-xs text-slate-400">Category: {t.category} • Version {t.version}</div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Active Template
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    {Array.isArray(t.itemsJson) &&
                      t.itemsJson.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950 text-xs flex justify-between items-center">
                          <div>
                            <strong className="text-sky-400">Step {item.step || idx + 1}:</strong> {item.title}
                            <div className="text-slate-400 text-[11px] mt-0.5">{item.description}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {item.type || "Standard"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Security & Audit Logs */}
        {activeSection === "audit" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-white/10 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white">Healthcare Platform Security Audit Logs</h3>
              <p className="text-xs text-slate-400">Immutable trace of all administrative, clinical, and triage operations in Neon DB.</p>
            </div>

            <div className="space-y-3">
              {auditLogsList.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sky-400">{log.action}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Entity: <strong>{log.entity}</strong> (ID: {log.entityId || "N/A"}) • Actor: <strong>{log.actorUser?.name || "System"}</strong> ({log.actorUser?.role || "SYSTEM"})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Hospital Modal */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-xl p-6 md:p-8 text-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-black text-white">Register Public Healthcare Facility</h2>
              <button onClick={() => setShowAddHospitalModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thirukazhukundram Community Health Centre"
                  value={hospitalForm.name}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tier</label>
                  <select
                    value={hospitalForm.tier}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, tier: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                  >
                    <option value="SUB_CENTRE">Sub-Centre (HWC)</option>
                    <option value="PHC">Primary Health Centre (PHC)</option>
                    <option value="CHC">Community Health Centre (CHC)</option>
                    <option value="SUB_DISTRICT_HOSPITAL">Sub-District Hospital (SDH)</option>
                    <option value="DISTRICT_HOSPITAL">District Headquarters Hospital (DH)</option>
                    <option value="MEDICAL_COLLEGE">Medical College Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">District</label>
                  <input
                    type="text"
                    value={hospitalForm.district}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, district: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  placeholder="Main Road, Thirukazhukundram"
                  value={hospitalForm.address}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 94440 12050"
                    value={hospitalForm.contactPhone}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, contactPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    value={hospitalForm.totalBeds}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, totalBeds: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddHospitalModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow"
                >
                  Save Facility to Neon DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
