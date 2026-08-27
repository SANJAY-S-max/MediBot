"use client";
import { useState, useEffect } from "react";

export default function GoogleRouteMap({
  patientCoords = { lat: 12.7236, lng: 80.1872, label: "Patient Location (Thiruporur)" },
  hospital = {
    name: "Chengalpattu Government District Headquarters Hospital",
    tier: "DistrictHospital",
    district: "Chengalpattu",
    latitude: 12.6840,
    longitude: 79.9830,
    contact: "+91 94440 12005",
    address: "Hospital Road, Chengalpattu, Tamil Nadu 603001",
    distance_km: 28.5,
    estimated_travel_time_minutes: 25,
    inventory: {
      available_beds: 45,
      oxygen_cylinders_available: 40,
      available_instruments: ["ICU", "Ventilator", "Major OT", "Blood Bank", "CT Scan"]
    }
  },
  bypassedFacilities = [],
  triagePriority = "P1 Critical",
  ambulanceDispatched = true,
  ambulanceType = "108 ALS (Advanced Life Support)"
}) {
  const [viewMode, setViewMode] = useState("interactive"); // 'interactive' | 'google_embed' | 'turn_by_turn'
  const [ambulanceProgress, setAmbulanceProgress] = useState(35); // 0 - 100%
  const [isCopied, setIsCopied] = useState(false);

  // Safe coordinates fallback
  const pLat = patientCoords?.lat ?? 12.7236;
  const pLng = patientCoords?.lng ?? 80.1872;
  const hLat = hospital?.latitude ?? (hospital?.lat ?? 12.6840);
  const hLng = hospital?.longitude ?? (hospital?.lng ?? 79.9830);
  const hName = hospital?.name || "District Headquarters Hospital";
  const distanceKm = hospital?.distance_km ?? (hospital?.distance ? parseFloat(hospital.distance) : 28.5);
  const etaMinutes = hospital?.estimated_travel_time_minutes ?? Math.round(distanceKm * 1.1 + 5);

  // Google Maps Deep-Links
  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${pLat},${pLng}&destination=${hLat},${hLng}&travelmode=driving`;
  const googleMapsHospitalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hName + " " + (hospital?.district || ""))}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${hLat},${hLng}+(${encodeURIComponent(hName)})&z=13&ie=UTF8&output=embed`;

  // Simulate ambulance movement along route
  useEffect(() => {
    if (!ambulanceDispatched) return;
    const interval = setInterval(() => {
      setAmbulanceProgress((prev) => (prev >= 95 ? 20 : prev + 3));
    }, 2000);
    return () => clearInterval(interval);
  }, [ambulanceDispatched]);

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`Patient: ${pLat}, ${pLng} | Destination Hospital: ${hName} (${hLat}, ${hLng})`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isEmergency = triagePriority?.includes("P1") || triagePriority?.includes("Critical");

  // Step-by-step navigation mock
  const turnByTurnSteps = [
    {
      instruction: "Head north from Patient Location towards Kelambakkam Main Road",
      distance: "1.4 km",
      time: "3 mins",
      icon: "⬆️"
    },
    {
      instruction: `Pass near ${bypassedFacilities[0]?.facility_name || "Thiruporur PHC"} (Bypassed: Lacks critical ICU equipment)`,
      distance: "4.2 km",
      time: "6 mins",
      icon: "⚠️",
      isBypass: true
    },
    {
      instruction: "Merge onto SH-49A / Kelambakkam-Vandalur State Highway",
      distance: "8.5 km",
      time: "9 mins",
      icon: "↗️"
    },
    {
      instruction: "Take the ramp onto Grand Southern Trunk (GST) Road / NH-45",
      distance: "12.1 km",
      time: "11 mins",
      icon: "🛣️"
    },
    {
      instruction: `Turn right onto Hospital Road; arrive at ${hName} Emergency Casualty entrance`,
      distance: "0.8 km",
      time: "2 mins",
      icon: "🏥"
    }
  ];

  return (
    <div className="glass-dark rounded-3xl p-5 sm:p-6 border border-sky-500/30 shadow-2xl space-y-5 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-sky-950/30">
      {/* Header: Route Overview & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-blue text-[10px] font-black uppercase tracking-wider">
              🗺️ Google Maps Live Transit Engine
            </span>
            {isEmergency && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                🚨 Green Corridor Requested
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Patient ➔</span>
            <span className="text-sky-300 truncate max-w-[280px] sm:max-w-md">{hName}</span>
          </h3>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setViewMode("interactive")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === "interactive"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🛰️ Tactical HUD
          </button>
          <button
            onClick={() => setViewMode("google_embed")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === "google_embed"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🗺️ Google Map Tiles
          </button>
          <button
            onClick={() => setViewMode("turn_by_turn")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === "turn_by_turn"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🧭 Directions
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. TACTICAL INTERACTIVE GPS ROUTE HUD */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === "interactive" && (
        <div className="relative w-full h-[340px] sm:h-[380px] rounded-2xl bg-slate-950 border border-sky-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-4">
          {/* Background Map Grid & Topology Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />

          {/* Topological Vector SVG Route Polyline */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 340" preserveAspectRatio="none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Highway Route */}
            <path
              d="M 60 270 Q 220 280 290 190 T 520 60"
              fill="none"
              stroke="#0369a1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
            {/* Active Glow Highway */}
            <path
              d="M 60 270 Q 220 280 290 190 T 520 60"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="8 4"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Bypassed Facility Marker Node on Path */}
            <circle cx="285" cy="195" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* TOP BAR: STATS OVERLAY */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-white">
              <span className="text-sky-400 font-bold">🛣️ Road Distance:</span>
              <span className="font-mono font-black text-emerald-400">~{distanceKm} km</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-white">
              <span className="text-amber-400 font-bold">⏱️ Ambulance ETA:</span>
              <span className="font-mono font-black text-sky-300">~{etaMinutes} Mins</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-white">
              <span className="text-slate-400">Speed:</span>
              <span className="font-mono font-bold text-white">~55 km/h (ALS Emergency)</span>
            </div>
          </div>

          {/* VISUAL PINS (Patient Origin, Bypassed Node, Hospital Destination) */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between">
            {/* DESTINATION HOSPITAL PIN (Top Right) */}
            <div className="self-end mt-4 mr-2 sm:mr-8 bg-slate-900/95 border border-emerald-500/60 p-3 rounded-2xl shadow-xl max-w-[220px] sm:max-w-xs animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 mb-0.5">
                <span className="text-base">🏥</span>
                <span>DESTINATION HOSPITAL</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{hName}</div>
              <div className="text-[10px] text-slate-300 flex items-center justify-between mt-1">
                <span>Tier: <strong>{hospital?.tier || "DistrictHospital"}</strong></span>
                <span className="text-emerald-400 font-bold">✓ ICU / Beds Verified</span>
              </div>
            </div>

            {/* BYPASSED DEFICIENCY WARNING BADGE (Center) */}
            {bypassedFacilities && bypassedFacilities.length > 0 && (
              <div className="self-center bg-rose-950/80 border border-rose-500/60 px-3 py-1.5 rounded-xl text-[11px] text-rose-200 flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span>⚠️</span>
                <span>
                  <strong>{bypassedFacilities[0]?.facility_name || "Nearest PHC"}</strong> Bypassed (Lacks Ventilator/ICU)
                </span>
              </div>
            )}

            {/* PATIENT ORIGIN PIN (Bottom Left) */}
            <div className="self-start mb-2 ml-2 sm:ml-6 bg-slate-900/95 border border-sky-500/60 p-3 rounded-2xl shadow-xl max-w-[200px] sm:max-w-xs">
              <div className="flex items-center gap-2 text-xs font-black text-sky-400 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                <span>PATIENT GPS ORIGIN</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {patientCoords?.label || `Lat: ${pLat.toFixed(4)}°, Lng: ${pLng.toFixed(4)}°`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {pLat.toFixed(4)}° N, {pLng.toFixed(4)}° E
              </div>
            </div>
          </div>

          {/* AMBULANCE PROGRESS BAR & REAL-TIME BEACON */}
          {ambulanceDispatched && (
            <div className="relative z-10 w-full bg-slate-900/90 p-2.5 rounded-xl border border-sky-500/30 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-sky-300 font-bold flex items-center gap-1.5">
                  <span className="animate-bounce">🚑</span> {ambulanceType} in Transit
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Math.round(ambulanceProgress)}% of Route Completed
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${ambulanceProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. GOOGLE MAPS EMBEDDED SATELLITE / ROAD VIEW */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === "google_embed" && (
        <div className="relative w-full h-[340px] sm:h-[380px] rounded-2xl overflow-hidden border border-sky-500/30 bg-slate-950 shadow-inner">
          <iframe
            title="Google Maps Route Destination"
            width="100%"
            height="100%"
            style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={googleMapsEmbedUrl}
          />
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white shadow-lg">
            📍 Centered at <strong>{hName}</strong> ({hLat}, {hLng})
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. STEP-BY-STEP TURN-BY-TURN ROAD DIRECTIONS */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === "turn_by_turn" && (
        <div className="w-full h-[340px] sm:h-[380px] rounded-2xl bg-slate-950/90 border border-sky-500/30 p-4 overflow-y-auto space-y-3">
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Turn-by-Turn Route Navigation Instructions</span>
            <span className="font-mono text-emerald-400">{distanceKm} km total</span>
          </div>

          <div className="space-y-2">
            {turnByTurnSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                  step.isBypass
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                    : "bg-slate-900/80 border-white/5 text-slate-200"
                }`}
              >
                <span className="text-base p-1.5 rounded-lg bg-slate-800/80 border border-white/10">
                  {step.icon}
                </span>
                <div className="flex-1">
                  <p className="font-semibold leading-snug">{step.instruction}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    <span>Segment: <strong>{step.distance}</strong></span>
                    <span>•</span>
                    <span>Est: <strong>{step.time}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* ACTION BAR: 1-CLICK GOOGLE MAPS LAUNCHER & EMERGENCY CONTACTS */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
        {/* Direct Google Maps Navigation Button */}
        <a
          href={googleMapsRouteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
        >
          <span>🚀 Open in Google Maps Live Navigation</span>
          <span className="text-sm">↗</span>
        </a>

        {/* Call Hospital Emergency Reception */}
        <a
          href={`tel:${hospital?.contact || "+919444012005"}`}
          className="py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 glass border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 transition-all"
        >
          <span>📞 Call Hospital Desk ({hospital?.contact || "108"})</span>
        </a>

        {/* Copy Coordinates & Share */}
        <button
          type="button"
          onClick={copyCoordinates}
          className="py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 glass border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all"
        >
          <span>{isCopied ? "✓ GPS Coordinates Copied!" : "📋 Copy GPS Route Coordinates"}</span>
        </button>
      </div>

      {/* Hospital Facility Profile Summary Footer */}
      <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div>
          <span className="text-slate-400">Address: </span>
          <strong className="text-white">{hospital?.address || "District Headquarters Hospital Campus"}</strong>
        </div>
        <div className="flex items-center gap-3">
          <span>Available Beds: <strong className="text-emerald-400">{hospital?.inventory?.available_beds ?? 45}</strong></span>
          <span>•</span>
          <span>O2 Cylinders: <strong className="text-sky-300">{hospital?.inventory?.oxygen_cylinders_available ?? 40}</strong></span>
        </div>
      </div>
    </div>
  );
}
