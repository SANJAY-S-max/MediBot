import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

const InputArea = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Setup Speech Recognition ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setSttSupported(true);
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setText(transcript);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.warn('STT error:', e.error);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="input-area" onSubmit={handleSubmit}>
      <div className="input-row">
        {/* Mic button */}
        {sttSupported && (
          <button
            type="button"
            className={`btn btn-icon btn-mic ${isListening ? 'recording' : ''}`}
            onClick={toggleMic}
            disabled={isLoading}
            title={isListening ? 'Stop recording' : 'Speak your symptoms'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={
            isListening
              ? '🎙️ Listening... speak now'
              : sttSupported
              ? 'Type or 🎙️ speak your symptoms...'
              : 'Type your symptoms or health question...'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
        />

        {/* Send button */}
        <button
          type="submit"
          className="btn btn-icon btn-send"
          disabled={!text.trim() || isLoading}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Hint */}
      <div className="voice-hint">
        {isListening
          ? '🔴 Recording — speak clearly, then click Send'
          : sttSupported
          ? '💡 Tap the 🎙️ mic to speak in your language — MediBot will reply by voice too'
          : '💡 Type your symptoms and press Enter or click Send'}
      </div>
    </form>
  );
};

export default InputArea;
