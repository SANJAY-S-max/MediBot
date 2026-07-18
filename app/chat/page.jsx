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
      setMessages((m) => [...m, { role: "model", content: data.response || "Sorry, I couldn't process that." }]);
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
