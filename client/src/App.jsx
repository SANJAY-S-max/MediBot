import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ProfileForm from './components/ProfileForm';
import './index.css';

function App() {
  const [profile, setProfile] = useState(null);

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ backgroundColor: 'var(--medical-accent)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div>
          <h1>MediBot</h1>
          <p>Health awareness for everyone</p>
        </div>
        {profile && (
          <button 
            onClick={() => setProfile(null)} 
            className="btn btn-secondary" 
            style={{ marginLeft: 'auto', padding: '0 16px', width: 'auto', borderRadius: 8, height: 36, fontSize: '0.85rem' }}
          >
            End Chat
          </button>
        )}
      </div>
      
      {profile ? (
        <ChatInterface profile={profile} />
      ) : (
        <ProfileForm onStartChat={setProfile} />
      )}
    </div>
  );
}

export default App;
