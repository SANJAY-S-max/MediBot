"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

export default function AHAWorkerDashboard() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalAssigned: 0,
    dueTodayCount: 0,
    missedCount: 0,
    highPriorityCount: 0,
  });
  const [activeChecklistTemplate, setActiveChecklistTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Checkup Modal state
  const [selectedPatientForCheckup, setSelectedPatientForCheckup] = useState<any>(null);
  const [isCheckupModalOpen, setIsCheckupModalOpen] = useState(false);

  // Checkup Form state
  const [checkupStep, setCheckupStep] = useState(1);
  const [vitals, setVitals] = useState({
    spo2: "97",
    heartRate: "78",
    systolicBp: "125",
    diastolicBp: "82",
    bloodGlucoseMgDl: "110",
    temperature: "98.4",
  });
  const [medicationAdherence, setMedicationAdherence] = useState(true);
  const [followUpDone, setFollowUpDone] = useState(true);
  const [symptomsReported, setSymptomsReported] = useState<string[]>([]);
  const [newSymptomText, setNewSymptomText] = useState("");
  const [observations, setObservations] = useState("");
  const [isEscalatedToDoctor, setIsEscalatedToDoctor] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationPriority, setEscalationPriority] = useState<"LOW" | "MODERATE" | "HIGH" | "CRITICAL">("MODERATE");
  const [submittingCheckup, setSubmittingCheckup] = useState(false);

  useEffect(() => {
    fetchAhaData();
  }, []);

  const fetchAhaData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/aha/patients");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setMetrics(data.metrics || {});
        setActiveChecklistTemplate(data.activeChecklistTemplate);
      }
    } catch (err) {
      console.error("Failed to fetch AHA data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckup = (assignment: any) => {
    setSelectedPatientForCheckup(assignment.patient);
    setCheckupStep(1);
    setVitals({
      spo2: "97",
      heartRate: "78",
      systolicBp: "125",
      diastolicBp: "82",
      bloodGlucoseMgDl: "110",
      temperature: "98.4",
    });
    setMedicationAdherence(true);
    setFollowUpDone(true);
    setSymptomsReported([]);
    setObservations("");
    setIsEscalatedToDoctor(false);
    setEscalationReason("");
    setIsCheckupModalOpen(true);
  };

  const handleSubmitCheckup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForCheckup) return;

    setSubmittingCheckup(true);
    try {
      const scheduleId = selectedPatientForCheckup.checkupSchedules?.[0]?.id;

      const checklistResponses = {
        step_1: { verified: true },
        step_2: { vitals },
        step_3: { medicationAdherence },
        step_4: { followUpDone },
        step_5: { symptomsReported, newSymptomText },
        step_6: { observations },
        step_7: { isEscalatedToDoctor, escalationReason, escalationPriority },
      };

      const res = await fetch("/api/aha/checkups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientProfileId: selectedPatientForCheckup.id,
          scheduleId,
          vitals: {
            spo2: parseFloat(vitals.spo2),
            heartRate: parseInt(vitals.heartRate),
            systolicBp: parseInt(vitals.systolicBp),
            diastolicBp: parseInt(vitals.diastolicBp),
            bloodGlucoseMgDl: parseFloat(vitals.bloodGlucoseMgDl),
            temperature: parseFloat(vitals.temperature),
          },
          checklistResponses,
          medicationAdherence,
          symptomsReported: symptomsReported.concat(newSymptomText ? [newSymptomText] : []),
          observations,
          isEscalatedToDoctor,
          escalationReason,
          escalationPriority,
        }),
      });

      if (res.ok) {
        setIsCheckupModalOpen(false);
        fetchAhaData();
      }
    } catch (err) {
      console.error("Checkup submission failed:", err);
    } finally {
      setSubmittingCheckup(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 p-6 rounded-3xl border border-amber-500/20 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              👩‍⚕️ AHA / ASHA Community Health Dashboard
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Field Patient Visit Management, Configurable Checkup Checklists & Doctor Escalation
            </p>
          </div>
          <button
            onClick={() => fetchAhaData()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-200"
          >
            🔄 Refresh List
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Assigned Patients</span>
            <div className="text-3xl font-black text-white mt-1">{metrics.totalAssigned}</div>
            <span className="text-[10px] text-slate-400">Village Sector Active</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Due Today</span>
            <div className="text-3xl font-black text-amber-400 mt-1">{metrics.dueTodayCount}</div>
            <span className="text-[10px] text-amber-300">Scheduled Home Visits</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-red-500/30">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Missed / Overdue</span>
            <div className="text-3xl font-black text-red-400 mt-1">{metrics.missedCount}</div>
            <span className="text-[10px] text-red-300 font-bold">Needs Immediate Action</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">High Priority Cases</span>
            <div className="text-3xl font-black text-purple-400 mt-1">{metrics.highPriorityCount}</div>
            <span className="text-[10px] text-purple-300">Hypertension / Maternal</span>
          </div>
        </div>

        {/* Assigned Patients Table */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white">Assigned Village Patient Registry</h3>
            <span className="text-xs text-slate-400">{assignments.length} Patients Active</span>
          </div>

          <div className="space-y-3">
            {assignments.map((a) => {
              const p = a.patient;
              const isHigh = a.priority === "HIGH" || a.priority === "CRITICAL";
              return (
                <div
                  key={a.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    isHigh
                      ? "bg-slate-950 border-red-500/30 shadow-lg shadow-red-500/5"
                      : "bg-slate-950/60 border-white/10"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{p.user?.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isHigh
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {a.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ABHA: {p.abhaId}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      📍 {p.address || "Thiruporur Village"} • Blood: <strong>{p.bloodGroup || "O+"}</strong> • Phone: <strong>{p.user?.phone}</strong>
                    </div>

                    {/* Chronic conditions tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.medicalHistory?.chronicConditions?.map((c: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleStartCheckup(a)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
                    >
                      <span>📋</span> Start 7-Step Checkup
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7-Step Checkup Modal */}
      {isCheckupModalOpen && selectedPatientForCheckup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 text-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  National Health Mission Protocol
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  AHA Home Visit Checkup: {selectedPatientForCheckup.user?.name}
                </h2>
                <p className="text-xs text-slate-400">
                  ABHA: {selectedPatientForCheckup.abhaId} • {selectedPatientForCheckup.address}
                </p>
              </div>
              <button
                onClick={() => setIsCheckupModalOpen(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex justify-between border-b border-white/10 pb-3 text-[11px] font-bold text-slate-400">
              <span className={checkupStep >= 1 ? "text-amber-400" : ""}>1. Vitals</span>
              <span className={checkupStep >= 2 ? "text-amber-400" : ""}>2. Medication</span>
              <span className={checkupStep >= 3 ? "text-amber-400" : ""}>3. Symptoms</span>
              <span className={checkupStep >= 4 ? "text-amber-400" : ""}>4. Escalation</span>
            </div>

            <form onSubmit={handleSubmitCheckup} className="space-y-4">
              {/* Step 1: Vitals */}
              {checkupStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-white">Record Measured Vital Signs:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">SpO2 (%)</label>
                      <input
                        type="number"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Heart Rate (bpm)</label>
                      <input
                        type="number"
                        value={vitals.heartRate}
                        onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={vitals.systolicBp}
                        onChange={(e) => setVitals({ ...vitals, systolicBp: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={vitals.diastolicBp}
                        onChange={(e) => setVitals({ ...vitals, diastolicBp: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Blood Sugar (mg/dL)</label>
                      <input
                        type="number"
                        value={vitals.bloodGlucoseMgDl}
                        onChange={(e) => setVitals({ ...vitals, bloodGlucoseMgDl: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Body Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckupStep(2)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold"
                    >
                      Next: Medication & Follow-Up →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Medication Adherence & Follow Up */}
              {checkupStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-white">Medication Adherence & Follow-Up:</h3>
                  <div className="space-y-3 p-4 rounded-2xl bg-white/5">
                    <label className="flex items-center gap-3 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={medicationAdherence}
                        onChange={(e) => setMedicationAdherence(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Patient is taking all prescribed daily medications on schedule</span>
                    </label>

                    <label className="flex items-center gap-3 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={followUpDone}
                        onChange={(e) => setFollowUpDone(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Previous lab tests / hospital referral visits completed</span>
                    </label>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckupStep(1)}
                      className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckupStep(3)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold"
                    >
                      Next: Symptoms & Observations →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Symptoms & Observations */}
              {checkupStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-white">Symptom Inquiries & Field Observations:</h3>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Symptoms / Complaints</label>
                    <input
                      type="text"
                      placeholder="e.g. Mild evening leg swelling, fatigue..."
                      value={newSymptomText}
                      onChange={(e) => setNewSymptomText(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Field Observations & Living Condition Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Note hydration, diet adherence, family support..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckupStep(2)}
                      className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckupStep(4)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold"
                    >
                      Next: Escalation Trigger →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Escalation & Final Submit */}
              {checkupStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-white">Doctor Escalation & Visit Completion:</h3>
                  <div className="p-4 rounded-2xl bg-white/5 space-y-3">
                    <label className="flex items-center gap-3 text-xs font-bold text-red-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEscalatedToDoctor}
                        onChange={(e) => setIsEscalatedToDoctor(e.target.checked)}
                        className="w-4 h-4 accent-red-500 rounded"
                      />
                      <span>🚨 Escalate this case immediately to Doctor / Medical Officer</span>
                    </label>

                    {isEscalatedToDoctor && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Escalation Priority</label>
                          <select
                            value={escalationPriority}
                            onChange={(e) => setEscalationPriority(e.target.value as any)}
                            className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs font-bold"
                          >
                            <option value="LOW">Low - Routine Notification</option>
                            <option value="MODERATE">Moderate - Next Day Review</option>
                            <option value="HIGH">High - Urgent Medical Attention</option>
                            <option value="CRITICAL">Critical - Immediate Emergency Referral</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Reason for Escalation</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Elevated BP (160/100) and reported chest discomfort..."
                            value={escalationReason}
                            onChange={(e) => setEscalationReason(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckupStep(3)}
                      className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCheckup}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl text-xs font-black shadow-lg"
                    >
                      {submittingCheckup ? "Saving to Neon DB..." : "✓ Submit Completed Visit Record"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
