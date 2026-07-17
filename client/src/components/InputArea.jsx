import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, Square } from 'lucide-react';

const InputArea = ({ onSendMessage, onImageUpload, isLoading }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      // Auto-detect if it's a medical question based on keywords (mock implementation)
      const medicalKeywords = ['test', 'blood', 'report', 'pain', 'doctor', 'symptom'];
      const isMedical = medicalKeywords.some(kw => text.toLowerCase().includes(kw));
      
      onSendMessage(text, isMedical);
      setText('');
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      // Mock sending voice transcript
      onSendMessage("I recorded a voice message asking about my symptoms.", true);
    } else {
      setIsRecording(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <form className="input-area" onSubmit={handleSubmit}>
      <button 
        type="button" 
        className="btn btn-secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        <Paperclip size={20} />
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <input
        type="text"
        className="input-field"
        placeholder={isRecording ? "Listening..." : "Ask a medical question or upload a report..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading || isRecording}
      />
      
      <button 
        type="button" 
        className={`btn btn-secondary btn-record ${isRecording ? 'recording' : ''}`}
        onClick={handleMicClick}
        disabled={isLoading}
      >
        {isRecording ? <Square size={20} /> : <Mic size={20} />}
      </button>

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={!text.trim() || isLoading || isRecording}
      >
        <Send size={20} />
      </button>
    </form>
  );
};

export default InputArea;
