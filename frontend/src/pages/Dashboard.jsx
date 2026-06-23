import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/api';
import '../components/Layout.css';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory()
      .then(res => setHistory(res.data))
      .catch(err => console.log(err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Derives a 0–100 "safe" percentage from riskScore (0–10)
  const getSafePercent = (riskScore) =>
    Math.max(0, Math.min(100, Math.round((10 - (riskScore ?? 5)) / 10 * 100)));

  // Structural integrity: use API field if present, else derive from safePercent
  const getStructuralIntegrity = (item) => {
    if (item.structuralIntegrity != null) return item.structuralIntegrity;
    return Math.round(getSafePercent(item.riskScore) * 0.88);
  };

  const getRingColor = (percent) => {
    if (percent >= 70) return '#22c55e';
    if (percent >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getGreeting = () =>{
    const hour = new Date().getHours();
    if(hour >= 5 && hour < 12) return 'Good Morning';
    if(hour >= 12 && hour < 17) return 'Good Afternoon';
    if(hour >= 17 &&  hour < 21)return 'Good Evening';
    return 'Good Night';
  };

  const AuditCard = ({ item }) => {
    const safePercent = getSafePercent(item.riskScore);
    const structuralIntegrity = getStructuralIntegrity(item);
    const ringColor = getRingColor(safePercent);
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (safePercent / 100) * circumference;
    const { darkMode } = useTheme();

    return (
      <div
        onClick={() => navigate('/results', { state: { analysis: item } })}
        style={{
          background: darkMode ? '#13192a' : '#fff',
  borderRadius: '12px',
  padding: '20px 22px',
  cursor: 'pointer',
  border: `1px solid ${darkMode ? '#1e2d45' : 'var(--outline-var)'}`,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  transition: 'box-shadow 0.2s, transform 0.2s',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Top Row: Doc info + Ring */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em',
              color: 'var(--on-variant)', textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif', marginBottom: '5px',
            }}>
              {item.docType || 'Legal Document'}
            </div>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontSize: '16px',
              fontWeight: 600, color: 'var(--navy)', lineHeight: 1.35,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.documentId?.filename || 'Document'}
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
            <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
             <circle cx="34" cy="34" r={radius} fill="none" stroke={darkMode ? '#1e2d45' : '#f3f4f6'} strokeWidth="5" />
              <circle
                cx="34" cy="34" r={radius} fill="none"
                stroke={ringColor} strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.7s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif', fontSize: '13px',
              fontWeight: 700, color: ringColor,
            }}>
              {safePercent}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'var(--on-variant)',
              fontFamily: 'Inter, sans-serif',
            }}>
              Structural Integrity
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 700,
              color: 'var(--navy)', fontFamily: 'Inter, sans-serif',
            }}>
              {structuralIntegrity}%
            </span>
          </div>
          <div style={{height: '4px', background: darkMode ? '#1e2d45' : '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${structuralIntegrity}%`,
              background: 'var(--gold)', borderRadius: '99px',
              transition: 'width 0.7s ease',
            }} />
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--on-variant)', fontFamily: 'Inter, sans-serif' }}>
            Last activity:{' '}
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
          <span style={{
            fontSize: '13px', color: 'var(--gold2)',
            fontWeight: 600, fontFamily: 'Inter, sans-serif',
          }}>
            Details ›
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>

      {/* Top Navbar — className controls visibility via CSS media query */}
      <div
        className="dashboard-navbar"
        style={{
          background: 'var(--navy)', padding: '0 32px',display:'flex',
          alignItems: 'center', justifyContent: 'space-between',
          top: 0, zIndex: 100, height: '64px', position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }}></div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#fff', fontWeight: 700 }}>
          Legal Simplifier
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { label: 'Home',    path: '/dashboard', icon: 'fa-home' },
            { label: 'Upload',  path: '/upload',    icon: 'fa-upload' },
            { label: 'Library', path: '/history',   icon: 'fa-book' },
            { label: 'Profile', path: '/profile',   icon: 'fa-user' },
          ].map((item, i) => (
            <NavLink key={i} to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '6px', textDecoration: 'none',
                fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                background: isActive ? 'rgba(233,195,73,0.15)' : 'transparent',
                color: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              })}>
              <i className={`fas ${item.icon}`}></i>
              <span className="nav-desktop-label">{item.label}</span>
            </NavLink>
          ))}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)', margin: '0 8px' }}></div>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.7)', padding: '7px 14px', borderRadius: '6px',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <i className="fas fa-right-from-bracket"></i>
            <span className="nav-desktop-label">Logout</span>
          </button>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginLeft: '4px',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div
        style={{ flex: 1, display: 'flex', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px', gap: '28px' }}
        className="dashboard-layout"
      >
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Greeting */}
          <div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 700,
             letterSpacing: '0.1em',
             textTransform: 'uppercase',
             color: 'var(--gold2)',
}}>{getGreeting()}</div>
            <div className="t-display" style={{ marginTop: '4px' }}>Namaste, {user?.name}</div>
            <div className="t-body-lg" style={{ marginTop: '8px' }}>
              Your legal landscape is clear. Upload a document to begin your analysis.
            </div>
          </div>

          {/* Upload Zone */}
          <div style={{
            background: 'var(--navy)', borderRadius: '12px', padding: '28px',
            display: 'flex', flexDirection: 'column', gap: '14px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }}></div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 600, color: '#fff' }}>
              Initialize Document Audit
            </div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Upload your legal contracts, deeds, or agreements. Our AI‑driven system performs a structural
              analysis of clauses, identifying risk vectors and regulatory misalignments in real‑time.
            </div>
            <div>
              <button className="btn-gold" onClick={() => navigate('/upload')}>
                <i className="fas fa-upload"></i> DROP DOCUMENTS HERE →
              </button>
            </div>
          </div>

          {/* Active Audits */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div className="t-headline">Active Audits</div>
              <NavLink to="/history" style={{ textDecoration: 'none' }}>
                <div className="t-label" style={{ color: 'var(--gold2)', cursor: 'pointer' }}>VIEW ALL ARCHIVES ↗</div>
              </NavLink>
            </div>

            {history.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-file-circle-plus" style={{ fontSize: '40px', color: 'var(--outline)', marginBottom: '16px' }}></i>
                <div className="t-title" style={{ fontSize: '18px' }}>No documents yet</div>
                <div className="t-body" style={{ marginTop: '8px' }}>Upload your first document to see analysis here.</div>
                <button
                  className="btn-primary"
                  style={{ marginTop: '20px', width: 'auto', padding: '12px 28px' }}
                  onClick={() => navigate('/upload')}
                >
                  <i className="fas fa-upload"></i> Upload Document
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {history.slice(0, 6).map((item, index) => (
                  <AuditCard key={index} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Brand Banner */}
<div style={{
  position: 'relative',
  borderRadius: '16px',
  overflow: 'hidden',
  height: '220px',
  marginTop: '8px',
}}>
  {/* Background Image */}
  <img
    src="/dashboard.avif"
    alt=""
    style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      objectFit: 'cover', objectPosition: 'center 30%',
    }}
  />

  {/* Dark overlay — navy gradient left-to-right */}
  <div style={{
position: 'absolute', inset: 0,
  background: 'linear-gradient(90deg, rgba(10,20,40,0.95) 0%, rgba(10,20,40,0.55) 50%, rgba(10,20,40,0.05) 100%)',
  }} />

  {/* Gold top accent line */}
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '3px', background: 'var(--gold)',
  }} />

  {/* Text Content */}
  <div style={{
    position: 'relative', zIndex: 1,
    height: '100%', display: 'flex',
    flexDirection: 'column', justifyContent: 'center',
    padding: '0 40px', gap: '10px',
  }}>
    <div style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
      textTransform: 'uppercase', color: 'var(--gold)',
      fontFamily: 'Inter, sans-serif',
    }}>
      Legal Simplifier
    </div>
    <div style={{
      fontFamily: 'Playfair Display, serif',
      fontSize: '28px', fontWeight: 700,
      color: '#fff', lineHeight: 1.25,
      maxWidth: '480px',
    }}>
      The law, finally in your language.
    </div>
    <div style={{
      fontSize: '13px', color: 'rgba(255,255,255,0.6)',
      fontFamily: 'Inter, sans-serif', fontWeight: 400,
      maxWidth: '380px', lineHeight: 1.6,
    }}>
      Complex contracts. Clear answers. Always on your side.
    </div>
  </div>
</div>
        </div>

        {/* Right Column — Stats Sidebar */}
        <div
          style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}
          className="dashboard-sidebar"
        >
          {/* Stats Card */}
          <div className="card">
            <div className="t-headline" style={{ fontSize: '18px', marginBottom: '16px' }}>Overview</div>
            {[
              { icon: 'fa-file-contract',      label: 'Total Documents', value: history.length,                                  color: 'var(--navy)' },
              { icon: 'fa-triangle-exclamation', label: 'High Risk Docs', value: history.filter(h => h.riskScore >= 7).length,   color: 'var(--error)' },
              { icon: 'fa-circle-check',        label: 'Safe Documents', value: history.filter(h => h.riskScore <= 3).length,    color: 'var(--success-text)' },
            ].map((stat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--outline-var)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '16px', width: '20px' }}></i>
                  <span style={{ fontSize: '14px', color: 'var(--on-variant)', fontFamily: 'Inter, sans-serif' }}>{stat.label}</span>
                </div>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="t-headline" style={{ fontSize: '18px', marginBottom: '16px' }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-primary" onClick={() => navigate('/upload')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="fas fa-upload"></i> Analyze New Document
              </button>
              <button className="btn-secondary" onClick={() => navigate('/history')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="fas fa-book"></i> View All Documents
              </button>
              <button className="btn-secondary" onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="fas fa-user"></i> View Profile
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div style={{ background: 'var(--navy)', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }}></div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
               Did You Know?
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              Most rent agreements in India contain at least one clause that violates tenant rights. Always analyze before signing!
            </div>
          </div>
          
          
        </div>
      </div>

     

    </div>
  );
}