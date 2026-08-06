"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";

const SAMPLE_MESSAGES = [
  { role: "model", content: "👋 Hello! I'm MediBot, your AI health assistant. Please describe your symptoms or ask me a health question. I support **English**, **Hindi (हिंदी)**, and **Tamil (தமிழ்)**.\n\n⚠️ I provide preliminary guidance only — always consult a doctor for proper diagnosis." },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setLang(localStorage.getItem("medibot_lang") || "en");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, language: lang }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { 
        role: "model", 
        content: data.response || "Sorry, I couldn't process that.",
        sources: data.sources || []
      }]);
      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem("medibot_chats") || "[]");
      saved.push({ date: new Date().toISOString(), symptoms: text, response: data.response });
      localStorage.setItem("medibot_chats", JSON.stringify(saved.slice(-20)));
    } catch {
      setMessages((m) => [...m, { role: "model", content: "⚠️ Connection error. Please try again." }]);
    } finally { setLoading(false); }
  };

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Please use Chrome.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    const langMap = { en: "en-US", hi: "hi-IN", ta: "ta-IN" };
    recognition.lang = langMap[lang] || "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => { setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^#{1,3}\s(.+)$/gm, "<h4 class='font-bold text-sky-400 mt-3 mb-1'>$1</h4>")
      .replace(/\n/g, "<br/>");
  };

  const quickSymptoms = ["Fever and headache", "Chest pain", "Sore throat", "Stomach ache", "I feel dizzy"];

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black">🤖 AI Symptom Checker</h1>
            <p className="text-slate-400 text-sm">Powered by Google Gemini</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMessages(SAMPLE_MESSAGES)} className="glass px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-all">Clear Chat</button>
          </div>
        </div>

        {/* Quick symptoms */}
        <div className="flex gap-2 flex-wrap mb-4">
          {quickSymptoms.map((s) => (
            <button key={s} onClick={() => sendMessage(s)}
              className="glass px-3 py-1.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-sky-500/20 hover:border-sky-500/30 border border-transparent transition-all">
              {s}
            </button>
          ))}
        </div>

        {/* Chat messages */}
        <div className="flex-1 glass-dark rounded-2xl p-4 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user"
                ? "bg-gradient-to-r from-sky-600 to-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 text-white text-sm"
                : "glass rounded-2xl rounded-tl-sm px-4 py-3 text-slate-200 text-sm"}`}>
                {msg.role === "model" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-xs">M</div>
                    <span className="text-xs text-sky-400 font-semibold">MediBot</span>
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                
                {/* Explainable AI: Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <p className="text-xs font-semibold text-sky-400 mb-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified Medical Sources
                    </p>
                    <div className="flex flex-col gap-2">
                      {msg.sources.map((src, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-2 text-[11px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-300 font-medium truncate">{src.source}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${src.relevance_score > 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              Confidence: {src.relevance_score.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-slate-500 line-clamp-2 italic">"{src.content}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">MediBot is analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <button onClick={listening ? stopVoice : startVoice}
            className={`glass p-3 rounded-xl transition-all ${listening ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse" : "text-slate-400 hover:text-sky-400 hover:border-sky-500/30"} border border-transparent`}
            title={listening ? "Stop listening" : "Voice input"}>
            🎙️
          </button>
          <input
            className="input-field flex-1"
            placeholder={listening ? "🎙️ Listening..." : lang === "hi" ? "अपने लक्षण यहाँ लिखें..." : lang === "ta" ? "உங்கள் அறிகுறிகளை இங்கே தட்டச்சு செய்யவும்..." : "Describe your symptoms here..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="btn-primary px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            Send
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
