"use client";
import { useState } from "react";

const COMMON_SYMPTOM_OPTIONS = [
  { id: "chest_pain", label: "Acute Retrosternal Chest Pain / Pressure", category: "emergency" },
  { id: "shortness_of_breath", label: "Severe Shortness of Breath / Wheezing", category: "emergency" },
  { id: "snakebite", label: "Snakebite / Poisonous Insect Sting", category: "emergency" },
  { id: "high_fever", label: "High Fever (>102°F) with Chills / Shivering", category: "urgent" },
  { id: "polytrauma", label: "Road Traffic Accident / Fracture / Heavy Bleeding", category: "emergency" },
  { id: "pregnancy_labor", label: "Pregnancy / Active Labor Pain / Bleeding", category: "urgent" },
  { id: "severe_headache", label: "Sudden Severe Headache / Neurological Weakness", category: "emergency" },
  { id: "dehydration_diarrhea", label: "Severe Diarrhea & Vomiting / Extreme Dehydration", category: "urgent" },
  { id: "fever_cold", label: "Mild Fever, Cough & Nasal Congestion", category: "routine" },
  { id: "joint_pain", label: "Chronic Knee / Back Joint Pain", category: "routine" },
];

export default function PatientTroubleModal({
  isOpen,
  onClose,
  patientData,
  onTriageCompleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  patientData?: any;
  onTriageCompleted?: (result: any) => void;
}) {
  const [step, setStep] = useState<"intake" | "submitting" | "result">("intake");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["chest_pain"]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MODERATE" | "HIGH" | "CRITICAL">("HIGH");
  const [durationHours, setDurationHours] = useState("2");

  // Vitals
  const [spo2, setSpo2] = useState("88");
  const [heartRate, setHeartRate] = useState("110");
  const [systolicBp, setSystolicBp] = useState("105");
  const [respiratoryRate, setRespiratoryRate] = useState("28");
  const [temperature, setTemperature] = useState("99.4");
  const [consciousness, setConsciousness] = useState("Alert");

  // Location & Mobility
  const [patientLat, setPatientLat] = useState(patientData?.latitude || 12.7236);
  const [patientLng, setPatientLng] = useState(patientData?.longitude || 80.1872);
  const [patientAddress, setPatientAddress] = useState(
    patientData?.address || "Thiruporur Rural Block, Chengalpattu"
  );
  const [hasPersonalTransport, setHasPersonalTransport] = useState(false);
  const [mobilityAssistanceNeeded, setMobilityAssistanceNeeded] = useState(false);

  // Result state
  const [triageResult, setTriageResult] = useState<any>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const toggleSymptom = (symId: string) => {
    if (selectedSymptoms.includes(symId)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symId]);
    }
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPatientLat(pos.coords.latitude);
          setPatientLng(pos.coords.longitude);
          setPatientAddress(`Lat: ${pos.coords.latitude.toFixed(4)}°, Lng: ${pos.coords.longitude.toFixed(4)}° (GPS Auto-Acquired)`);
        },
        () => {
          alert("Location access denied. Using saved profile location.");
        }
      );
    }
  };

  const handleSubmitAssistance = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("submitting");
    setError("");

    try {
      const activeLabels = selectedSymptoms
        .map((sId) => COMMON_SYMPTOM_OPTIONS.find((cs) => cs.id === sId)?.label)
        .filter(Boolean) as string[];

      if (customSymptom.trim()) {
        activeLabels.push(customSymptom.trim());
      }

      if (activeLabels.length === 0) {
        setError("Please select at least one symptom or describe your problem.");
        setStep("intake");
        return;
      }

      const payload = {
        symptoms: activeLabels,
        symptomDescription: activeLabels.join(", "),
        severity,
        durationHours: parseInt(durationHours) || 2,
        vitals: {
          spo2: spo2 ? parseFloat(spo2) : null,
          heartRate: heartRate ? parseInt(heartRate) : null,
          systolicBp: systolicBp ? parseInt(systolicBp) : null,
          respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          consciousnessLevel: consciousness,
        },
        patientLatitude: patientLat,
        patientLongitude: patientLng,
        patientAddress,
        hasPersonalTransport,
        mobilityAssistanceNeeded,
      };

      const res = await fetch("/api/assistance/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to calculate triage recommendations.");
        setStep("intake");
        return;
      }

      setTriageResult(data);
      setStep("result");
      if (onTriageCompleted) onTriageCompleted(data);
    } catch (err: any) {
      setError("Network connection error. Please try again.");
      setStep("intake");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 p-6 md:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl p-2 rounded-full hover:bg-white/10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-2xl animate-pulse">
            🚨
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Patient Medical Assistance & Capability Triage
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">
              Enter current symptoms and vital signs to match nearby capable healthcare facilities.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Intake Form */}
        {step === "intake" && (
          <form onSubmit={handleSubmitAssistance} className="space-y-6">
            {/* Symptoms Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Current Symptoms / Concerns
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_SYMPTOM_OPTIONS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => toggleSymptom(sym.id)}
                      className={`text-left p-3 rounded-xl border text-xs md:text-sm font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10"
                          : "bg-slate-950/50 border-white/10 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <span>{sym.label}</span>
                      <span className="text-xs">{isSelected ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Or describe additional symptoms / sensations in your own words..."
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Vitals Input Grid */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                2. Real-Time Physiological Vitals
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="e.g. 88"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500">&lt;90% triggers P1 Critical</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g. 110"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500">&gt;135 or &lt;45 = Arrhythmia</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value)}
                    placeholder="e.g. 105"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500">&ge;190 or &lt;90 = Shock</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Respiratory Rate (/min)</label>
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Body Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g. 99.4"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Consciousness (AVPU)</label>
                  <select
                    value={consciousness}
                    onChange={(e) => setConsciousness(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm font-bold"
                  >
                    <option value="Alert">Alert (Normal)</option>
                    <option value="Voice">Responsive to Voice</option>
                    <option value="Pain">Responsive to Pain (Urgent)</option>
                    <option value="Unresponsive">Unresponsive (Emergency)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Transport Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3. Current Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 text-xs font-bold whitespace-nowrap hover:bg-sky-500/30"
                  >
                    📍 GPS
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4. Transport & Mobility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPersonalTransport}
                      onChange={(e) => setHasPersonalTransport(e.target.checked)}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>I have personal transport (car/bike)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobilityAssistanceNeeded}
                      onChange={(e) => setMobilityAssistanceNeeded(e.target.checked)}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>Stretcher / Wheelchair assistance needed</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Disclaimer & Submit */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
              ⚠️ <strong>Clinical Notice:</strong> MediBot AI provides automated facility capability matching and clinical triage support. It does not replace emergency medical diagnosis. For life-threatening emergencies, dial <strong>108</strong> immediately.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
              >
                <span>⚡</span> Run Capability Match & Triage
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Submitting Spinner */}
        {step === "submitting" && (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Analyzing Clinical Parameters...</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Evaluating vitals against Indian public health clinical protocols, scanning nearest verified hospitals in Neon DB, and matching ICU / OT / equipment availability.
            </p>
          </div>
        )}

        {/* Step 3: Triage Result & Hospital Recommendations */}
        {step === "result" && triageResult && (
          <div className="space-y-6">
            {/* Triage Priority Banner */}
            <div
              className={`p-5 rounded-2xl border ${
                triageResult.triage.priority === "P1_EMERGENCY"
                  ? "bg-red-950/60 border-red-500/50 text-red-100"
                  : triageResult.triage.priority === "P2_URGENT"
                  ? "bg-amber-950/60 border-amber-500/50 text-amber-100"
                  : "bg-emerald-950/60 border-emerald-500/50 text-emerald-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <span className="text-xs uppercase tracking-widest font-black px-3 py-1 rounded-full bg-white/10">
                  {triageResult.triage.priorityLabel}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Ref Code: <strong className="text-white">{triageResult.referralCode}</strong>
                </span>
              </div>
              <ul className="text-xs space-y-1 list-disc list-inside mt-2 text-slate-200">
                {triageResult.triage.triageReasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Ambulance Dispatch Alert if P1 */}
            {triageResult.ambulanceDispatch && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shadow-xl shadow-red-600/30">
                <div className="flex items-center gap-3">
                  <div className="text-3xl animate-bounce">🚑</div>
                  <div>
                    <div className="font-black text-sm">{triageResult.ambulanceDispatch.service} Dispatch Authorized</div>
                    <div className="text-xs opacity-90">
                      Estimated Arrival (ETA): <strong>{triageResult.ambulanceDispatch.etaMinutes} minutes</strong>
                    </div>
                  </div>
                </div>
                <a
                  href="tel:108"
                  className="px-4 py-2 bg-white text-red-600 rounded-xl font-black text-xs hover:bg-slate-100 shadow"
                >
                  📞 Call 108
                </a>
              </div>
            )}

            {/* Recommended Hospitals Grid */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <span>🏥</span> Capability-Matched Hospital Recommendations
              </h3>

              <div className="space-y-4">
                {triageResult.rankedHospitals.map((r: any, idx: number) => {
                  const h = r.hospital;
                  const isTop = idx === 0;
                  return (
                    <div
                      key={h.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isTop
                          ? "bg-slate-900 border-sky-500/50 shadow-xl shadow-sky-500/10"
                          : "bg-slate-950/60 border-white/10"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-white">{h.name}</span>
                            {isTop && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500 text-white font-bold">
                                ★ Best Match
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                              {h.tier}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{h.address}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-sky-400">{r.distanceKm} km away</div>
                          <div className="text-[11px] text-slate-400">~{r.estimatedTimeMin} mins transit</div>
                        </div>
                      </div>

                      {/* Capabilities matched badge */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {r.matchedCapabilities.map((cap: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-medium"
                          >
                            ✓ {cap}
                          </span>
                        ))}
                        {r.missingCapabilities?.map((cap: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/20 font-medium"
                          >
                            ✕ Lacks {cap}
                          </span>
                        ))}
                      </div>

                      {/* Bed & Hostel Availability */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-xl bg-white/5 text-xs mb-3">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Available Beds</span>
                          <strong className="text-emerald-400 text-sm">
                            {h.bedCapacity?.availableBeds || 0} / {h.bedCapacity?.totalBeds || 0}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">ICU Beds</span>
                          <strong className="text-sky-400 text-sm">
                            {h.bedCapacity?.availableIcuBeds || 0}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Ventilator Beds</span>
                          <strong className="text-purple-400 text-sm">
                            {h.bedCapacity?.availableVentBeds || 0}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Attendant Hostel</span>
                          <strong className="text-amber-400 text-sm">
                            {h.hostels?.length > 0
                              ? `${h.hostels[0].availableBeds} beds available`
                              : "Near GH"}
                          </strong>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 justify-end items-center pt-2">
                        <a
                          href={`tel:${h.contactPhone}`}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200"
                        >
                          📞 {h.contactPhone}
                        </a>
                        <a
                          href={r.navigationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-black text-white flex items-center gap-1 shadow"
                        >
                          <span>🗺️</span> Start Live Navigation
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Referral QR Slip Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center gap-6">
              <div
                className="w-48 h-48 shrink-0"
                dangerouslySetInnerHTML={{ __html: triageResult.qrVerificationSvg }}
              />
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white">Digital Referral Slip & Transit Instructions</h4>
                <p className="text-xs text-slate-400">
                  This referral slip contains your digital triage assessment code (<strong>{triageResult.referralCode}</strong>). Present this at the hospital triage counter for expedited emergency admission.
                </p>
                <div className="text-xs text-slate-300 space-y-1">
                  <div><strong>Mandatory Transit Checklist:</strong></div>
                  <ul className="list-disc list-inside text-slate-400">
                    {triageResult.transitSafetyChecklist?.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep("intake")}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/20"
              >
                Re-assess Symptoms
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
