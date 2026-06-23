import React, {useState} from "react";
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Results.css';
import '../components/Layout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Result() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis;

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!analysis) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
        <div className="dashboard-navbar" style={{ background: 'var(--navy)', padding: '0 32px', alignItems: 'center', justifyContent: 'space-between', height: '64px', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#fff', fontWeight: 700 }}>Legal Simplifier</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
          <i className="fas fa-file-contract" style={{ fontSize: '56px', color: 'var(--outline)' }} />
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: 'var(--navy)' }}>No analysis found</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--on-variant)' }}>Go back and upload a document first</div>
          <button className="btn-primary" style={{ marginTop: '8px', width: 'auto', padding: '12px 28px' }} onClick={() => navigate('/upload')}>
            Upload Document
          </button>
        </div>
      </div>
    );
  }

  const handleOpenChat = () => {
    setChatMessages([{ role: 'assistant', content: "Hi I've read this document. Ask me anything about it - I'll explain it in simple words." }]);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatMessages([]);
    setChatInput('');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const historyToSend = updatedMessages
        .slice(1, -1)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant');
      const response = await fetch(`${API_URL}/api/document/chat/${analysis._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: userMessage.content, history: historyToSend }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'risky') return '#c0392b';
    if (risk === 'caution') return '#b8952a';
    return '#2e7d5e';
  };

  const getRiskBg = (risk) => {
    if (risk === 'risky') return 'rgba(192,57,43,0.08)';
    if (risk === 'caution') return 'rgba(184,149,42,0.08)';
    return 'rgba(46,125,94,0.08)';
  };

  const getRiskBorder = (risk) => {
    if (risk === 'risky') return 'rgba(239,68,68,0.25)';
    if (risk === 'caution') return 'rgba(245,158,11,0.25)';
    return 'rgba(34,197,94,0.25)';
  };

  const getRiskLabel = (risk) => {
    if (risk === 'risky') return 'Critical Risk';
    if (risk === 'caution') return 'Review Required';
    return 'Standard';
  };

  const getGradeFromScore = (score) => {
    if (score <= 2) return 'A+';
    if (score <= 3) return 'A';
    if (score <= 4) return 'B+';
    if (score <= 5) return 'B';
    if (score <= 6) return 'C+';
    if (score <= 7) return 'C';
    if (score <= 8) return 'D';
    return 'F';
  };

  const getRiskLevel = (score) => {
    if (score <= 3) return { label: 'Low Risk', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
    if (score <= 6) return { label: 'Moderate Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
    if (score <= 8) return { label: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
    return { label: 'Critical Risk', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' };
  };

  const safePercent = Math.max(0, Math.min(100, Math.round((10 - analysis.riskScore) / 10 * 100)));
  const riskInfo = getRiskLevel(analysis.riskScore);
  const grade = getGradeFromScore(analysis.riskScore);

  const riskyCount   = analysis.clauses?.filter(c => c.risk === 'risky').length || 0;
  const cautionCount = analysis.clauses?.filter(c => c.risk === 'caution').length || 0;
  const safeCount    = analysis.clauses?.filter(c => c.risk === 'safe').length || 0;

  const fileId = analysis.documentId?.savedFile
    || analysis.documentId?.file
    || analysis.documentId?.path
    || analysis.documentId?.filename
    || analysis.documentId?._id;

  const radius = 54, circ = 2 * Math.PI * radius;
  const offset = circ - (safePercent / 100) * circ;

  const handleViewDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/document/file/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('Could not load document: ' + err.message);
    }
  };

  const handleLanguageSwitch = async () => {
    const newLanguage = analysis.language === 'english' ? 'hindi' : 'english';
    setSwitching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/document/reanalyze/${analysis._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language: newLanguage }),
      });
      const data = await response.json();
      navigate('/results', { state: { analysis: data.analysis } });
    } catch (err) {
      console.log(err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <div className="dashboard-navbar" style={{ background: 'var(--navy)', padding: '0 32px', top: 0, zIndex: 100, height: '64px', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#fff', fontWeight: 700 }}>Legal Simplifier</div>
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
              })}
            >
              <i className={`fas ${item.icon}`} />
              <span className="nav-desktop-label">{item.label}</span>
            </NavLink>
          ))}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)', margin: '0 8px' }} />
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.7)', padding: '7px 14px', borderRadius: '6px',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <i className="fas fa-right-from-bracket" />
            <span className="nav-desktop-label">Logout</span>
          </button>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#0a1428', marginLeft: '4px',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px 60px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Breadcrumb + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="t-label" style={{ color: 'var(--gold2)', marginBottom: '6px' }}>
              Reports › {analysis.docType} › <span style={{ color: 'var(--gold)' }}>Analysis</span>
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.15 }}>Document Analysis</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--on-variant)', marginTop: '6px' }}>
              {analysis.documentId?.filename || 'Analyzed Document'}
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <button onClick={() => navigate('/upload')} className="btn-primary" style={{ width: 'auto', padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-plus" /> New Analysis
            </button>
          </div>
        </div>

        {/* Hero Risk Card */}
        <div style={{ background: 'var(--navy)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }} />
          <div style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #0a1628 100%)', padding: '36px 40px', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle cx="70" cy="70" r={radius} fill="none" stroke={riskInfo.color} strokeWidth="8"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{grade}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>GRADE</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Overall Risk Assessment</div>
                <span style={{ background: riskInfo.bg, color: riskInfo.color, padding: '4px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {riskInfo.label}
                </span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '20px' }}>
                {analysis.summary}
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[
                  { value: `${safePercent}%`, label: 'Safety Rate', color: '#22c55e' },
                  { value: analysis.clauses?.length || 0, label: 'Clauses', color: 'var(--gold)' },
                  { value: riskyCount, label: 'Critical', color: '#ef4444' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }} className="results-main-grid">

          {/* Left — Clause Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>Detailed Clause Analysis</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--on-variant)' }}>
                Automated identification of risk factors and legal anomalies across {analysis.clauses?.length} clauses.
              </div>
            </div>

            {analysis.clauses?.map((clause, index) => (
              <div key={index} className="card" style={{ padding: '24px', borderLeft: `4px solid ${getRiskColor(clause.risk)}`, transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-variant)', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>Clause {index + 1}</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, color: 'var(--navy)' }}>{clause.title}</div>
                  </div>
                  <span style={{ background: getRiskBg(clause.risk), border: `1px solid ${getRiskBorder(clause.risk)}`, color: getRiskColor(clause.risk), padding: '5px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    {getRiskLabel(clause.risk)}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${clause.title}\n\n${clause.explanation}`); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); }}
                    title="Copy clause"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-variant)', fontSize: '14px', padding: '4px', flexShrink: 0 }}
                  >
                    <i className={`fas ${copiedIndex === index ? 'fa-check' : 'fa-copy'}`} style={{ color: copiedIndex === index ? '#22c55e' : 'inherit' }} />
                  </button>
                </div>

                {clause.warnings && clause.warnings.trim() && (
                  <div style={{ borderLeft: `3px solid ${getRiskColor(clause.risk)}`, paddingLeft: '12px', marginBottom: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--on-variant)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{clause.warnings}"
                  </div>
                )}

                <div style={{ background: getRiskBg(clause.risk), border: `1px solid ${getRiskBorder(clause.risk)}`, borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: getRiskColor(clause.risk), fontFamily: 'Inter, sans-serif', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className={`fas ${clause.risk === 'risky' ? 'fa-triangle-exclamation' : 'fa-bolt'}`} /> AI Insight
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--on-variant)', lineHeight: 1.6 }}>{clause.explanation}</div>
                </div>
              </div>
            ))}

            {/* Chat Box */}
            {chatOpen && (
              <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--outline-var)', overflow: 'hidden', marginTop: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div style={{ background: 'var(--navy)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(233,195,73,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-comments" style={{ color: 'var(--gold)', fontSize: '14px' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: '#fff' }}>Ask this Document</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Powered by AI · Answers reset when closed</div>
                    </div>
                  </div>
                  <button onClick={handleCloseChat} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-xmark" />
                  </button>
                </div>
                <div style={{ height: '320px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg2)' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', background: msg.role === 'user' ? 'var(--navy)' : 'var(--card)', color: msg.role === 'user' ? '#fff' : 'var(--navy)', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.6, border: msg.role === 'assistant' ? '1px solid var(--outline-var)' : 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        {msg.role === 'assistant' && (
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <i className="fas fa-bolt" /> AI
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--outline-var)', padding: '10px 16px', borderRadius: '12px 12px 12px 2px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold2)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--card)', borderTop: '1px solid var(--outline-var)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text" value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask anything about this document..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--outline-var)', fontFamily: 'Inter, sans-serif', fontSize: '14px', background: 'var(--bg2)', color: 'var(--navy)', outline: 'none' }}
                  />
                  <button onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}
                    style={{ background: 'var(--navy)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '8px', cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', opacity: chatLoading || !chatInput.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'all 0.2s', flexShrink: 0 }}>
                    <i className="fas fa-paper-plane" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1.5px solid var(--outline-var)', color: 'var(--navy)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <i className="fas fa-home" /> Dashboard
              </button>
              <button onClick={handleLanguageSwitch} disabled={switching} style={{ background: 'transparent', border: '1.5px solid var(--outline-var)', color: 'var(--navy)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: switching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: switching ? 0.7 : 1, transition: 'all 0.2s' }}>
                <i className={`fas ${switching ? 'fa-spinner fa-spin' : 'fa-language'}`} />
                {switching ? 'Switching...' : analysis.language === 'english' ? 'Switch to Hindi' : 'Switch to English'}
              </button>
              <button onClick={handleOpenChat} style={{ background: 'transparent', border: '1.5px solid var(--outline-var)', color: 'var(--navy)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <i className="fas fa-comments" /> Ask Document
              </button>
              {fileId && (
                <button onClick={handleViewDocument} style={{ background: 'transparent', border: '1.5px solid var(--outline-var)', color: 'var(--navy)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,195,73,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="fas fa-file-pdf" /> View Document
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }} />
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, color: 'var(--navy)', marginBottom: '14px' }}>Executive Brief</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Document Type', value: analysis.docType || 'Legal Document', icon: 'fa-file-contract' },
                  { label: 'Risk Score',    value: `${analysis.riskScore}/10`,            icon: 'fa-gauge' },
                  { label: 'Risk Level',    value: riskInfo.label,                        icon: 'fa-shield-halved' },
                  { label: 'Total Clauses', value: analysis.clauses?.length || 0,         icon: 'fa-list' },
                  { label: 'Language',      value: analysis.language?.charAt(0).toUpperCase() + analysis.language?.slice(1) || 'English', icon: 'fa-language' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--outline-var)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className={`fas ${item.icon}`} style={{ color: 'var(--gold2)', fontSize: '14px', width: '16px' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--on-variant)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: riskInfo.color }} />
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, color: 'var(--navy)', marginBottom: '16px' }}>Risk Breakdown</div>
              {[
                { label: 'Critical', count: riskyCount,   total: analysis.clauses?.length, color: '#c0392b' },
                { label: 'Caution',  count: cautionCount, total: analysis.clauses?.length, color: '#b8952a' },
                { label: 'Safe',     count: safeCount,    total: analysis.clauses?.length, color: '#2e7d5e' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? '14px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--on-variant)' }}>{item.label}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: item.color }}>{item.count}/{item.total}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--outline-var)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: item.color, transition: 'width 0.8s ease', width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--navy)', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }} />
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
                <i className="fa-solid fa-lightbulb" /> What to do next?
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                {riskyCount > 0
                  ? `This document has ${riskyCount} critical clause${riskyCount > 1 ? 's' : ''}. Consider consulting a lawyer before signing.`
                  : 'This document looks relatively safe. Always read the full document before signing.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}