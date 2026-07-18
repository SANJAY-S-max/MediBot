import React, { useState } from 'react';

const ProfileForm = ({ onStartChat }) => {
  const [profile, setProfile] = useState({ name: '', age: '', gender: '', location: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (profile.name && profile.age && profile.gender && profile.location) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onStartChat(profile);
      }, 600);
    }
  };

  const set = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  return (
    <div className="welcome-page">
      <div className="welcome-grid">

        {/* ── Left: Hero ── */}
        <div className="welcome-hero">
          <span className="hero-badge">🩺 AI-Powered Health Assistant</span>
          <h2 className="hero-heading">
            Your personal<br /><span>health guide</span>,<br />always available
          </h2>
          <p className="hero-desc">
            MediBot helps you understand your symptoms, get health awareness information,
            and know when to see a doctor — in your own language, at any time.
          </p>

          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon" style={{ background: '#d1fae5' }}>🎙️</div>
              <div className="feature-text">
                <strong>Voice Input & Responses</strong>
                <span>Speak your symptoms, hear the answers — no typing needed</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ background: '#dbeafe' }}>🧠</div>
              <div className="feature-text">
                <strong>AI-Powered Guidance</strong>
                <span>Powered by Google Gemini for accurate health information</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ background: '#fef9c3' }}>📄</div>
              <div className="feature-text">
                <strong>Download PDF Report</strong>
                <span>Save your consultation as a PDF to share with your doctor</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ background: '#fce7f3' }}>🔒</div>
              <div className="feature-text">
                <strong>Private & Secure</strong>
                <span>Your health information stays safe and confidential</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="profile-card">
          <h2>👋 Welcome to MediBot</h2>
          <p>Please fill in your details to start your free health consultation.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>👤 Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh Kumar"
                value={profile.name}
                onChange={set('name')}
                required
              />
            </div>

            <div className="form-group">
              <label>🎂 Age</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 35"
                min="1" max="120"
                value={profile.age}
                onChange={set('age')}
                required
              />
            </div>

            <div className="form-group">
              <label>⚧ Gender</label>
              <select
                className="input-field"
                value={profile.gender}
                onChange={set('gender')}
                required
              >
                <option value="" disabled>Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>📍 District / State</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Chennai, Tamil Nadu"
                value={profile.location}
                onChange={set('location')}
                required
              />
            </div>

            <button type="submit" className="btn-start" disabled={loading}>
              {loading ? (
                <>⏳ Starting...</>
              ) : (
                <>🩺 Start My Free Consultation →</>
              )}
            </button>
          </form>

          <div className="disclaimer-box">
            ⚠️ <span>MediBot provides <strong>health awareness only</strong> — not medical diagnosis. Always consult a qualified doctor for treatment.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
