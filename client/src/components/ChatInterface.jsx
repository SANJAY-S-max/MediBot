import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { Download } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const ChatInterface = ({ profile }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${profile.name}! 👋 I am MediBot, your AI health assistant. I see you are from ${profile.location}.\n\nPlease describe your symptoms or any health concerns. You can also tap the 🎙️ microphone button to speak instead of typing.`,
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPdfBtn, setShowPdfBtn] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  /* Save profile session on mount */
  useEffect(() => {
    axios.post(`${API_URL}/session`, { profile })
      .then(() => console.log('Session saved to DB'))
      .catch(err => console.warn('Could not save session:', err.message));
  }, []);

  /* Check if TTS is available */
  useEffect(() => {
    if (window.speechSynthesis) {
      // Pre-load voices
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, { profile, messages: updated });
      const reply = res.data.reply || 'I am sorry, I could not generate a response.';
      setMessages([...updated, { role: 'assistant', content: reply }]);

      const userCount = updated.filter(m => m.role === 'user').length;
      if (userCount >= 2) setShowPdfBtn(true);

    } catch (err) {
      const errMsg = err.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      setMessages([...updated, { role: 'assistant', content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await axios.post(`${API_URL}/report`, { profile, messages }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `MediBot_Report_${profile.name}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to generate PDF. Please ensure the backend is running.');
    }
  };

  return (
    <div className="chat-wrapper">
      {/* ── Floating PDF Button ── */}
      {showPdfBtn && (
        <div className="pdf-fab">
          <button onClick={handleGenerateReport} title="Download PDF Report">
            <Download size={20} />
          </button>
          <span className="pdf-fab-label">PDF</span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="chat-area">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            autoSpeak={autoSpeak && msg.role === 'assistant' && i === messages.length - 1}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="message-row">
            <div className="avatar bot">MB</div>
            <div className="message-bubble assistant">
              <div className="bot-label">MediBot</div>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input ── */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatInterface;
