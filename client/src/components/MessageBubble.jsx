import React from 'react';
import { AlertCircle } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  
  // Format medical disclaimer if present
  const formatContent = (text) => {
    if (text.includes('**Safety Disclaimer:**')) {
      const parts = text.split('**Safety Disclaimer:**');
      return (
        <>
          {parts[0]}
          <div className="medical-disclaimer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <AlertCircle size={16} />
              <strong>Safety Disclaimer</strong>
            </div>
            {parts[1]}
          </div>
        </>
      );
    }
    return text;
  };

  return (
    <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
      {message.type === 'image' ? (
        <em>📎 Image Uploaded</em>
      ) : (
        formatContent(message.content)
      )}
    </div>
  );
};

export default MessageBubble;
