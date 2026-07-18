import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ProfileForm from './components/ProfileForm';
import './index.css';

function App() {
  const [profile, setProfile] = useState(null);

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div className="header-title">
          <h1>MediBot</h1>
          <p>Health awareness for everyone</p>
        </div>
        <div className="header-badge">
          <span className="dot" />
          AI Online
        </div>
        {profile && (
          <button className="btn-end" onClick={() => setProfile(null)}>
            ✕ End Chat
          </button>
        )}
      </header>

      {/* ── Page ── */}
      {profile ? (
        <ChatInterface profile={profile} />
      ) : (
        <ProfileForm onStartChat={setProfile} />
      )}
    </div>
  );
}

export default App;
