import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { Download } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const ChatInterface = ({ profile }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${profile.name}! I am MediBot. I see you are from ${profile.location}. Please describe your symptoms or health concerns.`, type: 'text' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportBtn, setShowReportBtn] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save profile to NeonDB when chat starts
  useEffect(() => {
    axios.post(`${API_URL}/session`, { profile }).catch(err => {
      console.warn('Could not save session to DB:', err.message);
    });
  }, []);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text, type: 'text' };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        profile,
        messages: updatedMessages
      });

      // Backend returns { reply: "..." }
      const replyText = response.data.reply || 'I am sorry, I could not generate a response.';
      setMessages([...updatedMessages, { role: 'assistant', content: replyText, type: 'text' }]);
      
      // Show PDF button after 2 user messages
      const userCount = updatedMessages.filter(m => m.role === 'user').length;
      if (userCount >= 2) {
        setShowReportBtn(true);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errMsg = error.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      setMessages([...updatedMessages, { role: 'assistant', content: errMsg, type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await axios.post(`${API_URL}/report`, {
        profile,
        messages
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'MediBot_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate PDF. Please ensure backend is running.");
    }
  };

  const handleImageUpload = (file) => {
    alert("Image upload is currently disabled in MediBot.");
  };

  return (
    <>
      <div className="chat-area">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="message-bubble assistant">
            <span style={{ color: 'var(--text-muted)' }}>Thinking...</span>
          </div>
        )}
        
        {showReportBtn && !isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 16 }}>
            <button onClick={handleGenerateReport} className="btn btn-primary" style={{ width: 'auto', padding: '0 24px', borderRadius: 8, display: 'flex', gap: 8 }}>
              <Download size={18} />
              Generate PDF Report
            </button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <InputArea onSendMessage={handleSendMessage} onImageUpload={handleImageUpload} isLoading={isLoading} />
    </>
  );
};

export default ChatInterface;
