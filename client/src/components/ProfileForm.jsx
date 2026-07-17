import React, { useState } from 'react';

const ProfileForm = ({ onStartChat }) => {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    location: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (profile.name && profile.age && profile.gender && profile.location) {
      onStartChat(profile);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', overflowY: 'auto', width: '100%' }}>
      <div className="profile-card" style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ marginBottom: 8, fontSize: '1.5rem', fontWeight: 600, color: 'var(--medical-accent)' }}>Welcome to MediBot</h2>
        <p style={{ marginBottom: 32, color: 'var(--text-muted)' }}>Your simple AI guide for health awareness.</p>
      
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Name</label>
          <input 
            type="text" 
            className="input-field" 
            style={{ width: '100%', backgroundColor: 'white' }} 
            placeholder="e.g. John Doe"
            value={profile.name}
            onChange={e => setProfile({...profile, name: e.target.value})}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Age</label>
          <input 
            type="number" 
            className="input-field" 
            style={{ width: '100%', backgroundColor: 'white' }} 
            placeholder="e.g. 34"
            value={profile.age}
            onChange={e => setProfile({...profile, age: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Gender</label>
          <select 
            className="input-field" 
            style={{ width: '100%', backgroundColor: 'white' }}
            value={profile.gender}
            onChange={e => setProfile({...profile, gender: e.target.value})}
            required
          >
            <option value="" disabled>Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>District / State</label>
          <input 
            type="text" 
            className="input-field" 
            style={{ width: '100%', backgroundColor: 'white' }} 
            placeholder="e.g. Pune, Maharashtra"
            value={profile.location}
            onChange={e => setProfile({...profile, location: e.target.value})}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16, padding: '16px 0', fontSize: '1.05rem' }}>
          Start Consultation
        </button>
      </form>
      </div>
    </div>
  );
};

export default ProfileForm;
