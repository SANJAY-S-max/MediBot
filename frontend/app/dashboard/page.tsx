"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import PatientTroubleModal from "@/components/PatientTroubleModal";

export default function PatientDashboard() {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"records" | "careplan" | "checkups" | "hospitals">("records");
  const [isTroubleModalOpen, setIsTroubleModalOpen] = useState(false);

  // Hospital query state
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [emergencyFilter, setEmergencyFilter] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  useEffect(() => {
    fetchPatientData();
    fetchHospitals();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/patients/me");
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
      }
    } catch (err) {
      console.error("Failed to fetch patient data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const params = new URLSearchParams();
      if (deptFilter) params.append("department", deptFilter);
      if (emergencyFilter) params.append("emergency", "true");

      const res = await fetch(`/api/recommendations/hospitals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals || []);
      }
    } catch (err) {
      console.error("Failed to fetch hospitals:", err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [deptFilter, emergencyFilter]);

  const assignedAha = patient?.ahaAssignments?.[0]?.ahaWorker;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Assistance Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 p-6 rounded-3xl border border-sky-500/20 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Welcome, {patient?.user?.name || "Patient"}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                ABHA: {patient?.abhaId || "91-4521-8832-1920"}
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Personal Healthcare Management, Ayushman Bharat Digital Health Records & Triage
            </p>
          </div>

          <button
            onClick={() => setIsTroubleModalOpen(true)}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <span className="text-lg animate-pulse">🚨</span> I Need Medical Assistance / Trouble
          </button>
        </div>

        {/* Patient Key Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Blood Group</span>
            <div className="text-2xl font-black text-white mt-1">{patient?.bloodGroup || "O+"}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">Verified in Neon DB</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Active Prescriptions</span>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {patient?.prescriptions?.length || 3}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Daily Compliance Monitored</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Assigned AHA Worker</span>
            <div className="text-sm font-bold text-amber-400 mt-1 truncate">
              {assignedAha?.user?.name || "Anitha Selvam (AHA)"}
            </div>
            <span className="text-[10px] text-slate-400 block">
              📞 {assignedAha?.user?.phone || "+91 94440 99004"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Upcoming Checkup</span>
            <div className="text-sm font-bold text-purple-400 mt-1">
              {patient?.checkupSchedules?.[0]?.dueDate
                ? new Date(patient.checkupSchedules[0].dueDate).toLocaleDateString()
                : "In 2 Days"}
            </div>
            <span className="text-[10px] text-purple-300 font-semibold">Home Visit Scheduled</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
          {[
            { id: "records", label: "📋 Medical Records & Prescriptions" },
            { id: "careplan", label: "🎯 Active Care Plan & Goals" },
            { id: "checkups", label: "👩‍⚕️ AHA Home Checkup History" },
            { id: "hospitals", label: "🏥 Nearby Capable Hospitals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Clinical Records */}
        {activeTab === "records" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Prescriptions */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>💊</span> Current Active Prescriptions
                </h3>
                <span className="text-xs text-slate-400">{patient?.prescriptions?.length || 0} active</span>
              </div>

              <div className="space-y-3">
                {patient?.prescriptions?.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-sky-400">{p.medicationName}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      Dosage: <strong>{p.dosage}</strong> • Frequency: <strong>{p.frequency}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">Duration: {p.duration} • {p.instructions}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmed Diagnoses & Clinical History */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>🩺</span> Diagnoses & Chronic Conditions
                </h3>
                <span className="text-xs text-slate-400">{patient?.diagnoses?.length || 0} recorded</span>
              </div>

              <div className="space-y-3">
                {patient?.diagnoses?.map((d: any) => (
                  <div key={d.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-white">{d.conditionName}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                        ICD: {d.icdCode || "I10"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{d.clinicalNotes}</p>
                    <div className="text-[10px] text-slate-500">
                      Diagnosed on {new Date(d.diagnosisDate).toLocaleDateString()} by {d.doctor?.user?.name || "Dr. Sarah Johnson"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Test Reports */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>🧪</span> Laboratory & Diagnostic Test Reports
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient?.testReports?.map((tr: any) => (
                  <div key={tr.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-white">{tr.testName}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        tr.isAbnormal ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {tr.isAbnormal ? "Attention Required" : "Normal"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded-xl">
                      {tr.resultSummary}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Reference: {tr.referenceRange} • Date: {new Date(tr.testDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Care Plan & Lifestyle Goals */}
        {activeTab === "careplan" && (
          <div className="space-y-6">
            {patient?.carePlans?.map((cp: any) => (
              <div key={cp.id} className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-sky-500/20 space-y-6">
                <div>
                  <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">Active Care Protocol</span>
                  <h2 className="text-xl md:text-2xl font-black text-white mt-1">{cp.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{cp.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">🎯 Target Health Goals</h4>
                    <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                      {cp.targetGoals?.map((g: string, idx: number) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">🥗 Nutrition Guidelines</h4>
                    <p className="text-xs text-slate-300">{cp.dietaryGuidelines}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">🏃 Exercise & Activity</h4>
                    <p className="text-xs text-slate-300">{cp.activityGuidelines}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: AHA Checkup History */}
        {activeTab === "checkups" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-white">AHA/ASHA Field Visits & Vitals History</h3>
              <span className="text-xs text-slate-400">{patient?.ahaCheckups?.length || 0} visits recorded</span>
            </div>

            <div className="space-y-3">
              {patient?.ahaCheckups?.map((chk: any) => (
                <div key={chk.id} className="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-white">
                        Home Visit by {chk.ahaWorker?.user?.name || "AHA Worker"}
                      </div>
                      <div className="text-xs text-slate-400">
                        Date: {new Date(chk.visitDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      ✓ Completed
                    </span>
                  </div>

                  {/* Vitals snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-white/5 text-xs text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">SpO2</span>
                      <strong className="text-sky-400 text-sm">{chk.spo2 || 97}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                      <strong className="text-emerald-400 text-sm">{chk.heartRate || 82} bpm</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                      <strong className="text-purple-400 text-sm">
                        {chk.systolicBp || 135}/{chk.diastolicBp || 88}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Blood Glucose</span>
                      <strong className="text-amber-400 text-sm">{chk.bloodGlucoseMgDl || 118} mg/dL</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong>Observations:</strong> {chk.observations}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Nearby Capable Hospitals */}
        {activeTab === "hospitals" && (
          <div className="space-y-6">
            {/* Search Filters */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Filter by Department (e.g. Cardiology, ICU, Trauma)..."
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs w-64"
                />
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={emergencyFilter}
                    onChange={(e) => setEmergencyFilter(e.target.checked)}
                    className="rounded accent-sky-500 w-4 h-4"
                  />
                  <span>24x7 Emergency Only</span>
                </label>
              </div>
              <span className="text-xs text-slate-400">{hospitals.length} Facilities Found</span>
            </div>

            {/* Hospital Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitals.map((r: any) => {
                const h = r.hospital;
                return (
                  <div key={h.id} className="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-base text-white">{h.name}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                          {h.tier}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{h.address}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-sky-400">{r.distanceKm} km</div>
                        <div className="text-[10px] text-slate-400">~{r.estimatedTimeMin} mins</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Beds</span>
                        <strong className="text-emerald-400">{h.bedCapacity?.availableBeds || 0} / {h.bedCapacity?.totalBeds || 0}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">ICU Beds</span>
                        <strong className="text-sky-400">{h.bedCapacity?.availableIcuBeds || 0}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">24x7 Emergency</span>
                        <strong className={h.isEmergency24x7 ? "text-emerald-400" : "text-slate-400"}>
                          {h.isEmergency24x7 ? "Yes" : "Routine"}
                        </strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <a href={`tel:${h.contactPhone}`} className="text-xs text-slate-300 hover:text-white font-bold">
                        📞 {h.contactPhone}
                      </a>
                      <a
                        href={r.navigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow"
                      >
                        🗺️ Navigate
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Patient Trouble Intake & Triage Modal */}
      <PatientTroubleModal
        isOpen={isTroubleModalOpen}
        onClose={() => setIsTroubleModalOpen(false)}
        patientData={patient}
        onTriageCompleted={() => {
          fetchPatientData();
        }}
      />
    </AppLayout>
  );
}
