import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, AlertTriangle, ShieldCheck, HeartPulse, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const MOCK_HOSPITALS = [
  { name: "City Cardiology Center & Emergency Care", distance: "1.2 km", phone: "+91 99999 11111", address: "Sector 5, Main Metro Rd" },
  { name: "Metro Super-Specialty Medical Clinic", distance: "2.8 km", phone: "+91 99999 22222", address: "Avenue 12, Civic Center" },
  { name: "Government General Trauma Hospital", distance: "4.5 km", phone: "+91 99999 33333", address: "Link Road, Block C" }
];

const ChatbotPage = () => {
  const { user, API_URL } = useAuth();
  const { lang, t } = useLanguage();

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: lang === 'ta' 
        ? "வணக்கம்! நான் மெடிபாட். இன்று உங்களுக்கு என்ன அறிகுறிகள் உள்ளன? தயவுசெய்து விவரிக்கவும்."
        : (lang === 'hi' 
            ? "नमस्ते! मैं मेडिबॉट हूँ। आज आपको क्या लक्षण महसूस हो रहे हैं? कृपया वर्णन करें।" 
            : "Hello! I am MediBot, your clinical assistant. What symptoms are you experiencing today? Please describe them in detail.")
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [diagnosis, setDiagnosis] = useState(null);
  const [isFinal, setIsFinal] = useState(false);
  const [assessmentSaved, setAssessmentSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Setup Web Speech API for Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Select recognition language based on active context
      if (lang === 'ta') recognition.lang = 'ta-IN';
      else if (lang === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (err) => {
        console.error("Speech Recognition Error:", err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  // Toggle mic recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech-to-text is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Browser SpeechSynthesis for Text-to-Speech
  const speakText = (text) => {
    if (!ttsEnabled) return;
    
    // Cancel any ongoing speaking first
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice/language tag
    if (lang === 'ta') utterance.lang = 'ta-IN';
    else if (lang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg = inputText.trim();
    setInputText('');
    
    // Add User Message to thread
    const updatedMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Compile context history excluding the first bot greeting
      const chatHistory = updatedMessages.slice(1, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      // Call API Endpoint
      const res = await axios.post(`${API_URL}/assessments/chat`, {
        symptoms: userMsg,
        conversation_history: chatHistory,
        source: 'web',
        language: lang
      });

      const data = res.data;
      setLoading(false);

      if (data.is_final) {
        setIsFinal(true);
        const diag = data.diagnosis;
        setDiagnosis(diag);
        
        // Add finalized diagnostic summary to chat
        const botReply = lang === 'ta'
          ? `அறிகுறி பகுப்பாய்வு முடிந்தது. உங்கள் ஆபத்து நிலை: ${diag.severity_level}. எங்களின் பரிந்துரைகள்: ${diag.recommendations}`
          : (lang === 'hi'
              ? `लक्षण विश्लेषण पूरा हो गया है। आपका जोखिम स्तर: ${diag.severity_level} है। हमारी सिफारिशें: ${diag.recommendations}`
              : `Symptom analysis completed. Your severity rating is ${diag.severity_level}. Recommendations: ${diag.recommendations}`);
              
        setMessages(prev => [...prev, { role: 'bot', content: botReply }]);
        speakText(botReply);

        // Auto-save finalized assessment in database
        saveFinalReport(userMsg, updatedMessages, diag);
      } else {
        // Follow-up question
        const botReply = data.follow_up_question;
        setMessages(prev => [...prev, { role: 'bot', content: botReply }]);
        speakText(botReply);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setLoading(false);
      const fallbackReply = "I encountered a minor network error. Could you describe your symptoms again?";
      setMessages(prev => [...prev, { role: 'bot', content: fallbackReply }]);
      speakText(fallbackReply);
    }
  };

  const saveFinalReport = async (lastSymptom, allMsgs, diag) => {
    try {
      const chatHistory = allMsgs.map(m => ({ role: m.role, content: m.content }));
      
      const payload = {
        symptoms: lastSymptom,
        conversation_history: chatHistory,
        predicted_diseases: diag.predicted_diseases,
        confidence_scores: diag.confidence_scores,
        severity_level: diag.severity_level,
        risk_score: diag.risk_score,
        recommendations: diag.recommendations,
        source: 'web'
      };

      const res = await axios.post(`${API_URL}/assessments/save`, payload);
      setAssessmentSaved(true);
      setSavedId(res.data.id);
    } catch (err) {
      console.error("Error auto-saving report:", err);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'bot',
        content: lang === 'ta'
          ? "வணக்கம்! நான் மெடிபாட். இன்று உங்களுக்கு என்ன அறிகுறிகள் உள்ளன? தயவுசெய்து விவரிக்கவும்."
          : (lang === 'hi'
              ? "नमस्ते! मैं मेडिबॉट हूँ। आज आपको क्या लक्षण महसूस हो रहे हैं? कृपया वर्णन करें।"
              : "Hello! I am MediBot, your clinical assistant. What symptoms are you experiencing today? Please describe them in detail.")
      }
    ]);
    setInputText('');
    setDiagnosis(null);
    setIsFinal(false);
    setAssessmentSaved(false);
    setSavedId(null);
    window.speechSynthesis.cancel();
  };

  const getSeverityBadgeClass = (sev) => {
    const s = sev?.toLowerCase() || '';
    if (s.includes('low')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('medium')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-red-50 text-red-700 border-red-100 animate-pulse';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh]">
      
      <div className="flex items-center space-x-2 mb-6">
        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Symptom Assessment Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Chat Canvas (Col 7) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[600px]">
          {/* Header Controls */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MediBot Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-2 rounded-lg transition-colors border ${
                  ttsEnabled 
                    ? 'bg-primary-50 text-primary-600 border-primary-100' 
                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
                }`}
                title={ttsEnabled ? "Mute Bot Speech" : "Enable Bot Speech"}
              >
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button 
                onClick={resetChat}
                className="px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg bg-white"
              >
                Restart Chat
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white border-primary-500 rounded-br-none'
                      : 'bg-slate-50 text-slate-800 border-slate-100 rounded-bl-none'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <form onSubmit={handleSend} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl border transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
                title="Speak Symptoms (STT)"
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isFinal || loading}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                placeholder={isRecording ? "Listening, speak now..." : t('symptomPlaceholder')}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Diagnosis / Reports Panel (Col 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          <AnimatePresence mode="wait">
            {!diagnosis ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[300px]"
              >
                <HeartPulse className="h-14 w-14 text-slate-300 mb-4 clinical-pulse" />
                <h3 className="font-bold text-slate-800 text-base">Real-time Diagnostics Sidebar</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2">
                  Describe symptoms to the bot. Once analysis is complete, condition percentages, severity scores, and actions will display here.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* 1. Severity Indicators */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Evaluation Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border text-center ${getSeverityBadgeClass(diagnosis.severity_level)}`}>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Risk Level</span>
                      <span className="text-sm font-black">{diagnosis.severity_level.toUpperCase()}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Risk Score</span>
                      <span className="text-lg font-black text-slate-800">{diagnosis.risk_score} / 100</span>
                    </div>
                  </div>
                </div>

                {/* 2. Disease Probabilities */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Top 5 Predicted Conditions</h3>
                  
                  <div className="space-y-3">
                    {diagnosis.predicted_diseases.map((disease) => {
                      const score = diagnosis.confidence_scores[disease] || 0.1;
                      const pct = Math.round(score * 100);
                      return (
                        <div key={disease} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{disease}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary-600 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Actions / Emergency Checklist */}
                {diagnosis.severity_level.toLowerCase().includes('high') ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 text-red-600">
                      <ShieldAlert className="h-6 w-6 animate-bounce" />
                      <h3 className="font-bold text-sm uppercase tracking-wider">{t('emergencyAlert')}</h3>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      {t('emergencyDescription')}
                    </p>
                    
                    <div className="border-t border-red-150 pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-red-800">{t('nearestHospitals')}:</h4>
                      {MOCK_HOSPITALS.map((hosp, idx) => (
                        <div key={idx} className="p-3 bg-white border border-red-100 rounded-xl space-y-1 text-xs">
                          <p className="font-bold text-slate-800">{hosp.name} ({hosp.distance})</p>
                          <p className="text-slate-500 font-medium">Phone: {hosp.phone}</p>
                          <p className="text-slate-500">Addr: {hosp.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Lifestyle Recommendations</h3>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                      {diagnosis.recommendations}
                    </p>
                  </div>
                )}

                {/* 4. Report saved confirmation */}
                {assessmentSaved && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center text-center space-y-3 shadow-sm">
                    <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Assessment Logged</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Report saved successfully. You can download the PDF summary or email it to your doctor from your reports page.
                    </p>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/reports?id=${savedId}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                      >
                        View Report File
                      </Link>
                      <button 
                        onClick={resetChat}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors hover:bg-slate-50"
                      >
                        New Check
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      
    </div>
  );
};

export default ChatbotPage;
