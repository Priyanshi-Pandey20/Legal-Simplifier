import React, { useState } from 'react';
import { changePassword } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword)
      return setError('Please fill all fields');
    if (newPassword !== confirmPassword)
      return setError('New passwords do not match');
    if (newPassword.length < 6)
      return setError('New password must be at least 6 characters');
    if (currentPassword === newPassword)
      return setError('New password must be different from current password');

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const cardBg    = darkMode ? '#1a1d27' : '#ffffff';
  const labelColor = darkMode ? '#9aa0b0' : '#6b7080';
  const inputBg   = darkMode ? '#111318' : '#f8f9fc';
  const inputBorder = darkMode ? '#2a2f3e' : '#e0e2ec';
  const inputColor = darkMode ? '#e8eaf0' : '#1a1c20';
  const headingColor = darkMode ? '#e8eaf0' : '#0a1428';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Modal — centered */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: cardBg,
            borderRadius: '16px',
            padding: '32px 28px',
            width: '100%',
            maxWidth: '440px',
            margin: '24px',
            zIndex: 201,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Gold top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '3px', background: 'var(--gold)',
          }} />

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '24px',
          }}>
            <div>
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: '22px',
                fontWeight: 700, color: headingColor,
              }}>
                Change Password
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
                color: labelColor, marginTop: '4px',
              }}>
                Update your account password securely
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: darkMode ? '#2a2f3e' : '#f3f4f6',
                border: 'none', width: '32px', height: '32px',
                borderRadius: '8px', cursor: 'pointer',
                color: labelColor, fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {[
              { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword, placeholder: 'Enter current password' },
              { label: 'New Password',     value: newPassword,     onChange: setNewPassword,     placeholder: 'Enter new password' },
              { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, placeholder: 'Confirm new password' },
            ].map((field, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: labelColor,
                  marginBottom: '6px',
                }}>
                  {field.label}
                </div>
                <input
                  type="password"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '8px', border: `1.5px solid ${inputBorder}`,
                    background: inputBg, color: inputColor,
                    fontFamily: 'Inter, sans-serif', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                  onBlur={e => { e.target.style.borderColor = inputBorder; }}
                />
              </div>
            ))}

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(186,26,26,0.08)',
                border: '1px solid rgba(186,26,26,0.2)',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '13px', color: 'var(--error)',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '13px', color: '#22c55e',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <i className="fas fa-circle-check" /> {success}
              </div>
            )}

            {/* Buttons */}
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ marginTop: '4px', fontSize: '15px', padding: '14px' }}
            >
              {loading ? <><i className="fas fa-spinner fa-spin" /> Changing...</> : 'Change Password'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '8px', fontSize: '14px',
                fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', transition: 'all 0.2s',
                background: 'transparent',
                border: `1.5px solid ${inputBorder}`,
                color: labelColor,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}