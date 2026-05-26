import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Key, User } from 'lucide-react';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  
  // Form states
  const [name, setName] = useState(user?.name || '');
  const [height, setHeight] = useState(user?.height || 170);
  const [targetWeight, setTargetWeight] = useState(user?.targetWeight || 70);
  const [gender, setGender] = useState(user?.gender || 'male');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.geminiApiKey || '');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await updateProfile({
        name,
        height: Number(height),
        targetWeight: Number(targetWeight),
        gender,
        geminiApiKey
      });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <span className="flex align-center gap-8">
          <SettingsIcon size={16} /> User Settings
        </span>
      </div>

      {message && (
        <div style={{
          background: 'var(--color-success-glow)',
          border: '1px solid var(--color-success)',
          color: 'var(--text-primary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: 'var(--color-danger-glow)',
          border: '1px solid var(--color-danger)',
          color: 'var(--text-primary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Profile Group */}
        <div>
          <span className="form-label" style={{ display: 'flex', alignCenter: 'center', gap: '6px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '6px' }}>
            <User size={12} /> Personal Profile
          </span>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                className="form-input"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Weight (kg)</label>
              <input
                type="number"
                className="form-input"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Credentials / API Key Group */}
        <div>
          <span className="form-label" style={{ display: 'flex', alignCenter: 'center', gap: '6px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '6px' }}>
            <Key size={12} /> API Integrations
          </span>

          <div className="form-group">
            <label className="form-label">Google Gemini API Key (Optional)</label>
            <input
              type="password"
              className="form-input"
              placeholder="AI-key..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px', lineHeight: 1.4 }}>
              Providing a Google Gemini key enables the AI Coach premium generative dashboard report in the analytics tab. Key is stored locally in your SQLite-based JSON server database.
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '10px' }}>
          <Save size={14} /> {loading ? 'Saving Settings...' : 'Save Settings'}
        </button>

      </form>
    </div>
  );
};

export default Settings;
