"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function DoctorDashboard() {
  const [assistanceQueue, setAssistanceQueue] = useState<any[]>([]);
  const [ahaEscalations, setAhaEscalations] = useState<any[]>([]);
  const [hospitalsWithBeds, setHospitalsWithBeds] = useState<any[]>([]);
  const [counts, setCounts] = useState({ totalPending: 0, highEmergency: 0, ahaEscalated: 0 });
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosisName, setDiagnosisName] = useState("");
  const [prescriptionName, setPrescriptionName] = useState("");
  const [prescriptionDosage, setPrescriptionDosage] = useState("1 tablet");
  const [prescriptionFrequency, setPrescriptionFrequency] = useState("Once daily after food");
  const [prescriptionDuration, setPrescriptionDuration] = useState("14 days");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchDoctorQueue();
  }, []);

  const fetchDoctorQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/queue");
      if (res.ok) {
        const data = await res.json();
        setAssistanceQueue(data.assistanceQueue || []);
        setAhaEscalations(data.ahaEscalations || []);
        setHospitalsWithBeds(data.hospitalsWithBeds || []);
        setCounts(data.counts || { totalPending: 0, highEmergency: 0, ahaEscalated: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch doctor queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (item: any, type: "assistance" | "aha") => {
    setSelectedCase({ ...item, reviewType: type });
    setClinicalNotes(item.doctorReviewNotes || "");
    setDiagnosisName("");
    setPrescriptionName("");
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmittingReview(true);
    try {
      const patientProfileId = selectedCase.patient?.id || selectedCase.patientProfileId;
      const assistanceRequestId = selectedCase.reviewType === "assistance" ? selectedCase.id : null;
      const ahaCheckupId = selectedCase.reviewType === "aha" ? selectedCase.id : null;

      const res = await fetch("/api/doctor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientProfileId,
          assistanceRequestId,
          ahaCheckupId,
          clinicalNotes,
          diagnosisName,
          prescriptionName,
          prescriptionDosage,
          prescriptionFrequency,
          prescriptionDuration,
        }),
      });

      if (res.ok) {
        setIsReviewModalOpen(false);
        fetchDoctorQueue();
      }
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-emerald-500/20 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              👨‍⚕️ Clinical Triage & Referral Queue
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Review AI patient triage assessments, field AHA worker escalations, and issue prescriptions & verified diagnoses.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/telemedicine"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <span>📹</span> Start Telemedicine
            </Link>
            <button
              onClick={() => fetchDoctorQueue()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-200"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/20 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pending Triage</span>
              <div className="text-3xl font-black text-sky-400 mt-1">{counts.totalPending}</div>
              <span className="text-[10px] text-slate-400">Active Patient Requests</span>
            </div>
            <div className="text-3xl">👨‍⚕️</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-red-500/20 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">P1 Critical Emergencies</span>
              <div className="text-3xl font-black text-red-400 mt-1">{counts.highEmergency}</div>
              <span className="text-[10px] text-red-300">ICU / Ventilator Escalate</span>
            </div>
            <div className="text-3xl animate-pulse">🚨</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AHA Field Escalations</span>
              <div className="text-3xl font-black text-amber-400 mt-1">{counts.ahaEscalated}</div>
              <span className="text-[10px] text-amber-300">Requires Clinical Note</span>
            </div>
            <div className="text-3xl">👩‍⚕️</div>
          </div>
        </div>

        {/* Section 1: Patient AI Triage & Emergency Referral Queue */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>🚨</span> Patient AI Triage & Emergency Referral Queue
            </h3>
            <span className="text-xs text-slate-400">{assistanceQueue.length} Active Records</span>
          </div>

          <div className="space-y-3">
            {assistanceQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No pending emergency triage records.</div>
            ) : (
              assistanceQueue.map((item) => {
                const isEmergency = item.triagePriority === "P1_EMERGENCY";
                const isUrgent = item.triagePriority === "P2_URGENT";
                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      isEmergency
                        ? "bg-slate-950 border-red-500/40 shadow-lg shadow-red-500/5"
                        : isUrgent
                        ? "bg-slate-950 border-amber-500/30"
                        : "bg-slate-950/60 border-white/10"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{item.patient?.user?.name || "Patient"}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                            isEmergency
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : isUrgent
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {item.triagePriority.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {item.referralCode}</span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <strong>Symptoms:</strong> {item.symptomDescription}
                      </div>

                      {/* Vitals Snapshot */}
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span>SpO2: <strong className={item.spo2 < 90 ? "text-red-400" : "text-white"}>{item.spo2 || "N/A"}%</strong></span>
                        <span>• Heart Rate: <strong className="text-white">{item.heartRate || "N/A"} bpm</strong></span>
                        <span>• BP: <strong className="text-white">{item.systolicBp || "N/A"} mmHg</strong></span>
                        <span>• Consciousness: <strong className="text-white">{item.consciousnessLevel || "Alert"}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Matched Facility: <strong className="text-sky-400">{item.recommendations?.[0]?.hospital?.name || "Chengalpattu GH"}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReview(item, "assistance")}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold shadow"
                      >
                        ✍️ Clinical Review & Prescribe
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: AHA Worker Field Escalations */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>👩‍⚕️</span> AHA Worker Field Escalations (Community Visits)
            </h3>
            <span className="text-xs text-slate-400">{ahaEscalations.length} Escalations</span>
          </div>

          <div className="space-y-3">
            {ahaEscalations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No active AHA escalations.</div>
            ) : (
              ahaEscalations.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{item.patient?.user?.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        AHA Escalated: {item.escalationPriority}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong>Escalation Reason:</strong> {item.escalationReason}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Escalated by: <strong>{item.ahaWorker?.user?.name}</strong> • Vitals: SpO2 {item.spo2}%, BP {item.systolicBp}/{item.diastolicBp}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenReview(item, "aha")}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold shadow"
                  >
                    ✍️ Review & Note
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Hospital Live Bed Availability Monitor */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>🏥</span> Hospital Bed & ICU Live Availability Monitor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hospitalsWithBeds.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="font-bold text-sm text-white truncate">{h.name}</div>
                <div className="text-[10px] text-slate-400">{h.tier} • {h.district}</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">General</span>
                    <strong className="text-emerald-400">{h.bedCapacity?.availableBeds || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ICU</span>
                    <strong className="text-sky-400">{h.bedCapacity?.availableIcuBeds || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ventilator</span>
                    <strong className="text-purple-400">{h.bedCapacity?.availableVentBeds || 0}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Review Modal */}
      {isReviewModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 text-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
                  Verified Clinical Review
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Patient: {selectedCase.patient?.user?.name || "Patient"}
                </h2>
                <p className="text-xs text-slate-400">
                  Symptoms: {selectedCase.symptomDescription || selectedCase.observations || "Clinical review"}
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Doctor Clinical Assessment Notes
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record clinical observations, triage verification, and care instructions..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>

              {/* Diagnosis Entry */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Add Diagnosis (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Coronary Syndrome, Uncontrolled Stage 2 HTN..."
                  value={diagnosisName}
                  onChange={(e) => setDiagnosisName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>

              {/* Prescription Entry */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Issue Prescription (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Medication name (e.g. Amlodipine 5mg, Sorbitrate 5mg)..."
                      value={prescriptionName}
                      onChange={(e) => setPrescriptionName(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1 tablet)"
                      value={prescriptionDosage}
                      onChange={(e) => setPrescriptionDosage(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 1-0-0 after food)"
                      value={prescriptionFrequency}
                      onChange={(e) => setPrescriptionFrequency(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-lg"
                >
                  {submittingReview ? "Saving..." : "✓ Save Verified Clinical Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
