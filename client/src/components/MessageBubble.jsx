import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';

/* ── Speech Recognition (STT) hook ── */
function useSpeechRecognition(onResult) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, supported, startListening, stopListening };
}

/* ── Text-to-Speech (TTS) ── */
function speakText(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;
  // Pick a clear voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    || voices.find(v => v.lang.startsWith('en-IN'))
    || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/* ── Message Bubble ── */
const MessageBubble = ({ message, autoSpeak }) => {
  const isBot = message.role === 'assistant';
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (isBot && autoSpeak) {
      setSpeaking(true);
      speakText(message.content, () => setSpeaking(false));
    }
    return () => { if (isBot) stopSpeaking(); };
  }, []);

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakText(message.content, () => setSpeaking(false));
    }
  };

  const formatContent = (text) => {
    if (text.includes('**Safety Disclaimer:**')) {
      const [main, disc] = text.split('**Safety Disclaimer:**');
      return (
        <>
          <span>{main}</span>
          <div className="medical-disclaimer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700 }}>
              <AlertCircle size={14} /> Safety Disclaimer
            </div>
            {disc}
          </div>
        </>
      );
    }
    return text;
  };

  return (
    <div className={`message-row ${isBot ? '' : 'user'}`}>
      <div className={`avatar ${isBot ? 'bot' : 'user-av'}`}>
        {isBot ? 'MB' : '👤'}
      </div>
      <div className={`message-bubble ${isBot ? 'assistant' : 'user'}`}>
        {isBot && <div className="bot-label">MediBot</div>}
        {formatContent(message.content)}
        {isBot && (
          <div>
            <button className={`speak-btn ${speaking ? 'speaking' : ''}`} onClick={toggleSpeak}>
              {speaking ? <><VolumeX size={12} /> Stop</> : <><Volume2 size={12} /> Listen</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
