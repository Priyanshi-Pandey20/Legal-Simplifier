import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../components/Layout.css';
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Please fill all fields');
    if (!isLogin && !name) return setError('Please enter your name');
    setLoading(true);
    try {
      const res = isLogin
        ? await loginUser({ email, password })
        : await registerUser({ name, email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const cardBg       = darkMode ? '#1a1d27' : '#ffffff';
  const inputBg      = darkMode ? '#111318' : '#f8f9fc';
  const inputBorder  = darkMode ? '#2a2f3e' : '#e0e2ec';
  const inputColor   = darkMode ? '#e8eaf0' : '#1a1c20';
  const headingColor = darkMode ? '#e8eaf0' : '#0a1428';
  const subColor     = darkMode ? '#9aa0b0' : '#6b7080';
  const labelColor   = darkMode ? '#6b7888' : '#6b7080';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className='login-card' style={{
          display: 'flex', width: '100%', maxWidth: '920px',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: darkMode
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(2,28,54,0.12)',
          border: darkMode ? '1px solid #2a2f3e' : 'none',
        }}>

          {/* Left — Hero Panel */}
          <div
            className="login-hero-panel"
            style={{
              flex: 1,
              backgroundImage: 'linear-gradient(rgba(2,28,54,0.72), rgba(2,28,5,0.2)), url(/login.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center',
              padding: '48px 40px',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative', minWidth: 0,
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }} />

            <div>
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: '32px',
                fontWeight: 700, color: '#fff', lineHeight: 1.3,
              }}>
                Understand Every Clause Before You Sign
              </div>
              <div style={{
                fontSize: '15px', color: 'rgba(255,255,255,0.65)',
                marginTop: '16px', lineHeight: 1.7, fontFamily: 'Inter, sans-serif',
              }}>
                Legal Simplifier uses AI to break down complex legal documents into
                simple, actionable insights — in Hindi or English.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '32px' }}>
              {[
                { icon: 'fa-file-contract', text: 'Analyze Rent, Loan & Employment agreements' },
                { icon: 'fa-shield-halved', text: 'Identify risky clauses before signing' },
                { icon: 'fa-language',      text: 'Get results in Hindi or English' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'rgba(233,195,73,0.15)',
                    border: '1px solid rgba(233,195,73,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className={`fas ${item.icon}`} style={{ color: 'var(--gold)', fontSize: '14px' }} />
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '40px', padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                "I used to sign documents without understanding them. Legal Samjho showed me a risky eviction clause in my rent agreement before I signed!"
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gold)', marginTop: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                — Rahul M., First-time tenant, Indore
              </div>
            </div>
          </div>

          {/* Right — Form Panel */}
          <div
            className="login-form-panel"
            style={{
              width: '400px', flexShrink: 0,
              padding: '48px 40px',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', gap: '20px',
              background: cardBg, position: 'relative',
            }}
          >
            {/* Gold top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '3px', background: 'var(--gold)',
            }} />

            {/* ── Logo ── */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: '24px',
                fontWeight: 700, color: 'var(--gold)',
              }}>
                Legal Simplifier
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: subColor,
                marginTop: '3px',
              }}>
                AI Legal Document Simplifier
              </div>
            </div>

            {/* ── Heading ── */}
            <div>
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: '28px',
                fontWeight: 700, color: headingColor, lineHeight: 1.2,
              }}>
                {isLogin ? 'Welcome back' : 'Create account'}
              </div>
              <div style={{
                fontSize: '14px', color: subColor,
                marginTop: '6px', fontFamily: 'Inter, sans-serif',
              }}>
                {isLogin
                  ? 'Sign in to continue your document review.'
                  : 'Start understanding your legal documents today.'}
              </div>
            </div>

            {/* ── Form Fields ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isLogin && (
                <div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: labelColor, marginBottom: '6px' }}>
                    Full Name
                  </div>
                  <input
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: `1.5px solid ${inputBorder}`,
                      background: inputBg, color: inputColor,
                      fontFamily: 'Inter, sans-serif', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                    onBlur={e => { e.target.style.borderColor = inputBorder; }}
                  />
                </div>
              )}

              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: labelColor, marginBottom: '6px' }}>
                  Email Address
                </div>
                <input
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '8px',
                    border: `1.5px solid ${inputBorder}`,
                    background: inputBg, color: inputColor,
                    fontFamily: 'Inter, sans-serif', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                  onBlur={e => { e.target.style.borderColor = inputBorder; }}
                />
              </div>

              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: labelColor, marginBottom: '6px' }}>
                  Password
                </div>
                <input
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '8px',
                    border: `1.5px solid ${inputBorder}`,
                    background: inputBg, color: inputColor,
                    fontFamily: 'Inter, sans-serif', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                  onBlur={e => { e.target.style.borderColor = inputBorder; }}
                />
              </div>

              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--gold2)', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Forgot password?
                  </span>
                </div>
              )}

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

              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ marginTop: '4px', fontSize: '15px', padding: '14px' }}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: inputBorder }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: subColor }}>or</span>
              <div style={{ flex: 1, height: '1px', background: inputBorder }} />
            </div>

            {/* ── Toggle ── */}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '8px', fontSize: '14px',
                fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', transition: 'all 0.2s',
                background: 'transparent',
                border: `1.5px solid ${inputBorder}`,
                color: headingColor,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.color = headingColor; }}
            >
              {isLogin ? 'Create new account' : 'Already have an account? Sign in'}
            </button>

            <div style={{
              textAlign: 'center', fontSize: '12px',
              color: subColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
            }}>
              By continuing you agree to our Terms of Service
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}