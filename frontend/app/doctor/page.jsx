"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import GoogleRouteMap from "@/components/GoogleRouteMap";

const INITIAL_PATIENTS = [
  { 
    id: 1, 
    name: "John Patient", 
    age: 45, 
    symptoms: "Severe chest pain, shortness of breath, SpO2 88%", 
    risk: "High", 
    date: "Today, 10:30 AM", 
    status: "Pending",
    vitals: { spo2: "88%", hr: "110 bpm", bp: "105/70", rr: "28/min", temp: "99.4°F" },
    facility: "Chengalpattu District Headquarters Hospital (ICU/Ventilator Escalate)",
    notes: ""
  },
  { 
    id: 2, 
    name: "Mary Smith", 
    age: 32, 
    symptoms: "High fever (102.5°F), dry cough for 3 days, body ache", 
    risk: "Moderate", 
    date: "Today, 09:15 AM", 
    status: "Reviewed",
    vitals: { spo2: "97%", hr: "98 bpm", bp: "118/76", rr: "18/min", temp: "102.5°F" },
    facility: "Thiruporur Primary Health Centre (PHC)",
    notes: "Ordered Malaria RDT and complete blood count. Prescribed Paracetamol 650mg."
  },
  { 
    id: 3, 
    name: "Ahmed Ali", 
    age: 28, 
    symptoms: "Mild headache and nasal congestion", 
    risk: "Low", 
    date: "Yesterday", 
    status: "Reviewed",
    vitals: { spo2: "99%", hr: "72 bpm", bp: "120/80", rr: "16/min", temp: "98.4°F" },
    facility: "Kelambakkam Health Sub-Centre",
    notes: "Advised hydration and rest. Steam inhalation twice daily."
  },
];

export default function DoctorDashboard() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState("");

  const handleOpenReview = (patient) => {
    setSelectedPatient(patient);
    setClinicalNotes(patient.notes || "");
  };

  const handleSaveReview = () => {
    if (!selectedPatient) return;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? { ...p, status: "Reviewed", notes: clinicalNotes }
          : p
      )
    );
    setSelectedPatient(null);
  };

  const pendingCount = patients.filter((p) => p.status === "Pending").length;
  const highRiskCount = patients.filter((p) => p.risk === "High").length;
  const reviewedCount = patients.filter((p) => p.status === "Reviewed").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">🏥 Clinical Queue & Triage Management</h1>
          <p className="text-slate-400 text-sm">Review patient AI triage assessments, emergency escalations, and add verified clinical notes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-dark rounded-2xl p-5 border border-sky-500/20">
            <h2 className="text-xl mb-1">👨‍⚕️</h2>
            <h3 className="font-bold">Pending Reviews</h3>
            <p className="text-2xl font-black text-sky-400">{pendingCount}</p>
          </div>
          <div className="glass-dark rounded-2xl p-5 border border-red-500/20">
            <h2 className="text-xl mb-1">🚨</h2>
            <h3 className="font-bold">High Risk / Emergency</h3>
            <p className="text-2xl font-black text-red-400">{highRiskCount}</p>
          </div>
          <div className="glass-dark rounded-2xl p-5 border border-emerald-500/20">
            <h2 className="text-xl mb-1">✅</h2>
            <h3 className="font-bold">Cases Reviewed</h3>
            <p className="text-2xl font-black text-emerald-400">{reviewedCount}</p>
          </div>
        </div>

        <div className="glass-dark rounded-2xl overflow-hidden border border-white/10">
          <div className="p-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
            <h2 className="font-bold">Patient Assessments & Escalation Queue</h2>
            <span className="text-xs text-slate-400">{patients.length} Active Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/30 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="p-4 font-medium">Patient</th>
                  <th className="p-4 font-medium">Symptoms & Vitals</th>
                  <th className="p-4 font-medium">Assigned Facility</th>
                  <th className="p-4 font-medium">Triage Risk</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.age} yrs • {p.date}</p>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-200 truncate">{p.symptoms}</p>
                      <p className="text-[11px] text-slate-500">SpO2: {p.vitals.spo2} | HR: {p.vitals.hr} | BP: {p.vitals.bp}</p>
                    </td>
                    <td className="p-4 text-xs text-slate-300 max-w-[200px] truncate">
                      {p.facility}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${p.risk === "High" ? "badge-red" : p.risk === "Moderate" ? "badge-yellow" : "badge-green"}`}>
                        {p.risk} Priority
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Pending" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleOpenReview(p)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          p.status === "Pending"
                            ? "btn-primary bg-sky-500 hover:bg-sky-600 text-white"
                            : "btn-secondary text-slate-300 hover:text-white"
                        }`}
                      >
                        {p.status === "Pending" ? "Review Case" : "View Notes"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal / Dialog for Reviewing Case */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-dark border border-sky-500/30 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-bold text-lg text-white">Clinical Assessment Review</h3>
                  <p className="text-xs text-slate-400">Patient: <strong className="text-white">{selectedPatient.name}</strong> ({selectedPatient.age} yrs)</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Reported Symptoms & Clinical Context</p>
                  <p className="text-slate-200">{selectedPatient.symptoms}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">SpO2</span>
                    <span className="font-bold text-sky-400">{selectedPatient.vitals.spo2}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Heart Rate</span>
                    <span className="font-bold text-emerald-400">{selectedPatient.vitals.hr}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                    <span className="font-bold text-purple-400">{selectedPatient.vitals.bp}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Routed Healthcare Facility</p>
                  <p className="text-slate-200 text-xs">{selectedPatient.facility}</p>
                </div>

                {/* Embedded Live Google Maps Route */}
                <div className="pt-1">
                  <p className="text-xs font-semibold text-sky-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🗺️</span> Patient Transit Route & Hospital Navigation
                  </p>
                  <GoogleRouteMap
                    patientCoords={{
                      lat: 12.7236,
                      lng: 80.1872,
                      label: `${selectedPatient.name} Location`
                    }}
                    hospital={{
                      name: selectedPatient.facility,
                      tier: selectedPatient.risk === "High" ? "DistrictHospital" : "PHC",
                      district: "Chengalpattu",
                      latitude: selectedPatient.risk === "High" ? 12.6840 : 12.7500,
                      longitude: selectedPatient.risk === "High" ? 79.9830 : 80.1950,
                      contact: "+91 94440 12005",
                      address: "Hospital Road, Chengalpattu District",
                      distance_km: selectedPatient.risk === "High" ? 28.5 : 4.5,
                      estimated_travel_time_minutes: selectedPatient.risk === "High" ? 25 : 8
                    }}
                    triagePriority={selectedPatient.risk === "High" ? "P1 Critical" : "P2 Moderate"}
                    ambulanceDispatched={selectedPatient.risk === "High"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Doctor Clinical Notes & Prescription:
                  </label>
                  <textarea
                    rows={3}
                    className="input-field w-full text-xs p-2.5"
                    placeholder="Enter diagnosis, prescribed medications, or referral orders..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReview}
                  className="btn-primary text-xs px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold"
                >
                  Save & Sign Case
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
