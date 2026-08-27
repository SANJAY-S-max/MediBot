"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import GoogleRouteMap from "@/components/GoogleRouteMap";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState("chat"); // 'chat' | 'telemedicine' | 'pdf_viewer'
  const [lang, setLang] = useState("en");

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: "model",
      content: "👋 Namaste! I am your **MediBot AI Assistant** with verified public health knowledge and clinical triage capabilities. How can I help you today?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [roleDescription, setRoleDescription] = useState("Public Health & Medical Triage Assistant");
  const [listening, setListening] = useState(false);
  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Telemedicine State
  const [meetingId, setMeetingId] = useState("");
  const [isMeetingJoined, setIsMeetingJoined] = useState(false);

  // PDF / Document Viewer State
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    setLang(localStorage.getItem("medibot_lang") || "en");
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });

    // Load reports from API or localStorage
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => {
        if (d.assessments && Array.isArray(d.assessments)) {
          setReports(d.assessments);
          if (d.assessments.length > 0) setSelectedReport(d.assessments[0]);
        }
      })
      .catch(() => {
        const savedChats = JSON.parse(localStorage.getItem("medibot_chats") || "[]");
        if (savedChats.length > 0) {
          const formatted = savedChats.map((c, i) => ({
            id: `REP-${1000 + i}`,
            symptoms: c.symptoms || "Clinical Inquiry",
            severity_level: "Routine",
            created_at: c.date || new Date().toISOString(),
            recommendations: c.response || "Standard medical triage completed."
          }));
          setReports(formatted);
          setSelectedReport(formatted[0]);
        }
      });
  }, [activeTool]);

  // AI Chat Handlers
  const sendChatMessage = async (text = chatInput) => {
    if (!text.trim() || chatLoading) return;
    const userMsg = { role: "user", content: text };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = chatMessages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          query: text,
          history,
          language: lang,
          roleDescription
        })
      });
      const data = await res.json();
      setChatMessages((m) => [
        ...m,
        {
          role: "model",
          content: data.response || "No response received from medical model.",
          sources: data.sources || [],
          referral_slip: data.referral_slip,
          referral_qr_code: data.referral_qr_code,
          matching_facility: data.matching_facility
        }
      ]);
    } catch {
      setChatMessages((m) => [...m, { role: "model", content: "⚠️ Connection error to MediBot backend." }]);
    } finally {
      setChatLoading(false);
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    const langMap = { en: "en-IN", hi: "hi-IN", ta: "ta-IN" };
    recognition.lang = langMap[lang] || "en-IN";
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setChatInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const formatMarkdown = (text = "") => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^#{1,3}\s(.+)$/gm, "<h4 class='font-bold text-sky-400 mt-2 mb-1'>$1</h4>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Tool Selector Tabs */}
        <div className="glass-dark rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-blue text-[11px] font-bold uppercase tracking-wider">Unified Workspace</span>
              <span className="badge-green text-[11px]">Legacy & Advanced Tools</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              🌐 Telemedicine & AI Clinical Tools
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Integrated suite: Multilingual AI Chat, Jitsi WebRTC Consultations, and Digital Health Document Viewer.
            </p>
          </div>

          {/* Tool Switcher Tabs */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTool("chat")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === "chat"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🤖</span>
              <span>AI Chat Assistant</span>
            </button>

            <button
              onClick={() => setActiveTool("telemedicine")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === "telemedicine"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📹</span>
              <span>Jitsi Video Call</span>
            </button>

            <button
              onClick={() => setActiveTool("pdf_viewer")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === "pdf_viewer"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📄</span>
              <span>PDF / Report Viewer</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 1: MULTILINGUAL AI CHAT & CLINICAL ASSISTANT */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
            {/* Main Chat Conversation (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col glass-dark rounded-2xl border border-white/10 overflow-hidden h-full">
              {/* Chat Sub-Header */}
              <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xs font-black">
                    AI
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">MediBot AI Medical Assistant</h2>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Online • Grounded with Indian PHC Registry
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Role:</span>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="input-field text-xs py-1 px-2.5 max-w-[180px] sm:max-w-xs"
                    placeholder="Assistant Role..."
                  />
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-sm shadow-md"
                          : "glass-dark border border-white/10 text-slate-200 rounded-tl-sm"
                      }`}
                    >
                      {msg.role === "model" && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-sky-400">🤖 MediBot Clinical AI</span>
                        </div>
                      )}

                      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />

                      {/* Scannable QR & Referral Slip Embedded in Chat */}
                      {msg.referral_qr_code && (
                        <div className="mt-4 p-3.5 bg-slate-900/90 rounded-xl border border-sky-500/30 flex flex-col sm:flex-row items-center gap-4">
                          <div
                            dangerouslySetInnerHTML={{ __html: msg.referral_qr_code }}
                            className="bg-slate-950 p-1.5 rounded-lg border border-sky-500/40 shadow-inner"
                          />
                          <div className="text-xs space-y-1 text-slate-300">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="badge-blue text-[10px]">Verified Digital Referral</span>
                            </div>
                            <div>
                              ID: <span className="font-mono text-sky-300 font-bold">{msg.referral_slip?.referral_id}</span>
                            </div>
                            <div>
                              Routed Facility: <span className="text-emerald-400 font-bold">{msg.referral_slip?.assigned_facility}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Scan this QR at the hospital admission desk for instant registration.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Embedded Google Route Map in AI Chat */}
                      {msg.referral_slip && (
                        <div className="mt-3">
                          <GoogleRouteMap
                            patientCoords={{
                              lat: 12.7236,
                              lng: 80.1872,
                              label: "Patient Location"
                            }}
                            hospital={{
                              name: msg.referral_slip?.assigned_facility || "Chengalpattu District Headquarters Hospital",
                              tier: msg.referral_slip?.facility_tier || "DistrictHospital",
                              district: "Chengalpattu",
                              latitude: 12.6840,
                              longitude: 79.9830,
                              contact: msg.referral_slip?.facility_contact || "+91 94440 12005",
                              address: "Hospital Road, Chengalpattu District",
                              distance_km: 28.5,
                              estimated_travel_time_minutes: 25
                            }}
                            triagePriority={msg.referral_slip?.triage_priority || "P1 Critical"}
                            ambulanceDispatched={msg.referral_slip?.ambulance_dispatched}
                          />
                        </div>
                      )}

                      {/* Sources Citation */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-400">
                          <span className="font-bold text-sky-400">Sources: </span>
                          {msg.sources.map((s, idx) => (
                            <span key={idx} className="mr-2">
                              • {s.source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="glass-dark border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span>MediBot is verifying medical guidelines and facility inventory...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-white/10 bg-slate-900/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={listening ? stopVoiceInput : startVoiceInput}
                  className={`p-3 rounded-xl border transition-all ${
                    listening
                      ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                      : "glass border-white/10 text-slate-400 hover:text-sky-400"
                  }`}
                  title="Voice Input (English, Hindi, Tamil)"
                >
                  🎙️
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                  placeholder={
                    listening
                      ? "🎙️ Listening... Speak now"
                      : lang === "hi"
                      ? "लक्षण या चिकित्सा प्रश्न यहाँ लिखें..."
                      : lang === "ta"
                      ? "அறிகுறிகள் அல்லது கேள்விகளை தட்டச்சு செய்யவும்..."
                      : "Describe symptoms, query facility equipment, or ask medical questions..."
                  }
                  className="input-field flex-1 text-sm py-2.5"
                />

                <button
                  type="button"
                  onClick={() => sendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-primary py-2.5 px-5 font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send →
                </button>
              </div>
            </div>

            {/* Right Sidebar: Quick Clinical Prompts & Knowledge (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-dark rounded-2xl p-5 border border-sky-500/20">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  ⚡ Quick Clinical Queries
                </h3>
                <p className="text-xs text-slate-400 mb-3">Click to trigger instant triage & equipment verification:</p>
                <div className="space-y-2">
                  {[
                    "Patient in Gadchiroli has severe chest pain and breathlessness. Locate nearest ICU hospital.",
                    "What are the emergency first-aid protocols for snakebite before reaching hospital?",
                    "Where is the nearest Primary Health Centre with cold chain vaccine storage?",
                    "Patient in rural Chengalpattu with suspected malaria fever. Verify RDT test kits."
                  ].map((promptText, i) => (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(promptText)}
                      className="w-full text-left p-2.5 rounded-xl glass border border-white/5 hover:border-sky-500/40 hover:bg-sky-500/10 text-xs text-slate-300 hover:text-white transition-all line-clamp-2"
                    >
                      💡 {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supported Languages Card */}
              <div className="glass-dark rounded-2xl p-5 border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-slate-200">🌐 Multilingual Voice & Text Supported:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge-blue text-[11px]">English</span>
                  <span className="badge-green text-[11px]">हिन्दी (Hindi)</span>
                  <span className="badge-purple text-[11px]">தமிழ் (Tamil)</span>
                </div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Automatic translation and transcription pipeline with local clinical dialect awareness.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 2: TELEMEDICINE VIDEO CONSULTATION (JITSI WEBRTC) */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === "telemedicine" && (
          <div className="glass-dark rounded-2xl p-6 border border-white/10 space-y-6">
            {!isMeetingJoined ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 border border-sky-500/30 bg-gradient-to-br from-sky-950/20 to-slate-900/40">
                  <h2 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                    📹 Join Video Consultation
                  </h2>
                  <p className="text-slate-400 text-xs mb-4">
                    Enter the secure room code provided by your Primary Health Centre or attending doctor.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="e.g. medibot-phc-triage-room"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                    />
                    <button
                      onClick={() => meetingId.trim() && setIsMeetingJoined(true)}
                      disabled={!meetingId.trim()}
                      className="btn-primary w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      🚀 Connect to Consultation Room
                    </button>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                      ✨ Create Instant Room
                    </h2>
                    <p className="text-slate-400 text-xs mb-4">
                      Generates an encrypted WebRTC room link for instant doctor-patient video triage.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newId = `medibot-${Math.random().toString(36).substring(2, 9)}`;
                      setMeetingId(newId);
                      setIsMeetingJoined(true);
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 transition-all"
                  >
                    + Generate New Doctor Room Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-xl border border-sky-500/30">
                  <div>
                    <div className="text-xs text-sky-400 font-bold uppercase tracking-wider">Live Video Session</div>
                    <div className="text-sm font-bold text-white">Room: <span className="font-mono text-emerald-400">{meetingId}</span></div>
                  </div>
                  <button
                    onClick={() => setIsMeetingJoined(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
                  >
                    ✕ Leave Consultation
                  </button>
                </div>

                <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                  <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={meetingId}
                    configOverwrite={{
                      startWithAudioMuted: false,
                      disableModeratorIndicator: true,
                      startScreenSharing: false,
                      enableEmailInStats: false
                    }}
                    interfaceConfigOverwrite={{
                      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                    }}
                    userInfo={{
                      displayName: "MediBot Patient"
                    }}
                    getIFrameRef={(iframeRef) => {
                      iframeRef.style.height = "100%";
                      iframeRef.style.width = "100%";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 3: PDF HEALTH REPORT & CLINICAL DOCUMENT VIEWER */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === "pdf_viewer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List of Reports (4 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                📋 Patient Assessment Logs ({reports.length})
              </h3>
              <div className="space-y-2">
                {reports.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedReport(r)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedReport?.id === r.id
                        ? "glass-dark border-sky-400 bg-sky-950/30 text-white"
                        : "glass border-white/5 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-sky-300">{r.id || `ASSESS-${idx+1}`}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.severity_level === "Critical" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {r.severity_level || "Routine"}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{r.symptoms}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Details & PDF Preview (8 Cols) */}
            <div className="lg:col-span-8 glass-dark rounded-2xl p-6 border border-white/10 space-y-6">
              {selectedReport ? (
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div>
                      <div className="text-xs text-sky-400 font-bold uppercase">Digital Clinical Summary</div>
                      <h2 className="text-lg font-black text-white">{selectedReport.id}</h2>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="btn-secondary text-xs px-4 py-2 font-bold"
                    >
                      🖨️ Print / Save as PDF
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-slate-900/90 rounded-xl border border-white/5 space-y-2">
                      <div className="font-bold text-slate-200">Patient Symptoms:</div>
                      <p className="text-slate-300">{selectedReport.symptoms}</p>
                    </div>

                    <div className="p-4 bg-slate-900/90 rounded-xl border border-white/5 space-y-2">
                      <div className="font-bold text-slate-200">AI Triage Recommendations & Pathway:</div>
                      <p className="text-slate-300 leading-relaxed">{selectedReport.recommendations}</p>
                    </div>

                    <div className="p-4 bg-slate-900/90 rounded-xl border border-white/5 flex items-center justify-between text-slate-400">
                      <span>Certified by: <strong className="text-white">MediBot AI Diagnostic Core</strong></span>
                      <span>Recorded on: <strong className="text-white">{new Date(selectedReport.created_at).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-slate-400 text-sm">
                  Select an assessment from the left panel to inspect the clinical record.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
