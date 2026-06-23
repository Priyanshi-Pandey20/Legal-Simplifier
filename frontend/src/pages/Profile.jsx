import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHistory } from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";
import './Profile.css';
import '../components/Layout.css';
import {useTheme} from '../context/ThemeContext';


export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const {darkMode,setDarkMode, defaultLanguage, setDefaultLanguage} = useTheme(); 

  useEffect(() => {
    getHistory()
      .then((res) => setHistory(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  // ── Legal IQ Score (smart calculation) ──
  const calculateLegalIQ = () => {
    if (history.length === 0) return 30;
    let score = 0;

    // 1. Variety of doc types (15 pts)
    const uniqueTypes = new Set(history.map(h => h.docType)).size;
    score += Math.min(uniqueTypes * 4, 15);

    // 2. Risky clauses identified (20 pts)
    const totalRiskyClauses = history.reduce((acc, item) => {
      return acc + (item.clauses?.filter(c => c.risk === 'risky').length || 0);
    }, 0);
    score += Math.min(totalRiskyClauses * 4, 20);

    // 3. Avoided high risk docs (20 pts)
    const highRiskDocs = history.filter(h => h.riskScore >= 7).length;
    const highRiskRatio = highRiskDocs / history.length;
    if (highRiskRatio === 0)       score += 20;
    else if (highRiskRatio <= 0.2) score += 15;
    else if (highRiskRatio <= 0.4) score += 10;
    else if (highRiskRatio <= 0.6) score += 5;

    // 4. Total documents analyzed (20 pts)
    score += Math.min(history.length * 2, 20);

    // 5. Improving risk scores over time (25 pts)
    if (history.length >= 2) {
      const sorted = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const firstHalf  = sorted.slice(0, Math.floor(sorted.length / 2));
      const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
      const avgFirst  = firstHalf.reduce((a, b)  => a + b.riskScore, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b.riskScore, 0) / secondHalf.length;
      if (avgSecond < avgFirst - 2)      score += 25;
      else if (avgSecond < avgFirst)     score += 18;
      else if (avgSecond === avgFirst)   score += 12;
      else if (avgSecond < avgFirst + 2) score += 6;
    } else {
      score += 12;
    }

    return Math.min(Math.round(score), 100);
  };

  const legalIQ = calculateLegalIQ();

  const getIQLabel = (iq) => {
    if (iq < 40) return { label: "Beginner", color: "#ef4444" };
    if (iq < 60) return { label: "Aware",    color: "#f59e0b" };
    if (iq < 80) return { label: "Informed", color: "#3b82f6" };
    return             { label: "Expert",    color: "#22c55e" };
  };
  const iqInfo = getIQLabel(legalIQ);

  // ── Legal Journey ──
  const journeyStages = [
    { label: "Beginner",  min: 0, icon: "fa-seedling" },
    { label: "Aware",     min: 1, icon: "fa-eye" },
    { label: "Informed",  min: 3, icon: "fa-book-open" },
    { label: "Expert",    min: 7, icon: "fa-graduation-cap" },
  ];
  const currentStageIndex = [...journeyStages].reverse().findIndex(s => history.length >= s.min);
  const activeStage = journeyStages.length - 1 - currentStageIndex;

  // ── Money Saved ──
  const avgClausePenalty = 15000;
  const riskyClausesCaught = history.reduce((acc, item) => {
    return acc + (item.clauses?.filter(c => c.risk === "risky").length || 0);
  }, 0);
  const moneySaved = riskyClausesCaught * avgClausePenalty;

  // ── Profile Completion ──
  const calculateCompletion = () => {
    let percent = 0;
    if (history.length >= 1) percent += 30;
    if (history.length >= 3) percent += 30;
    if (history.length >= 5) percent += 20;
    if (history.some(h => h.riskScore >= 7)) percent += 20;
    return percent;
  };
  const completionPercent = calculateCompletion();

  // ── IQ Ring SVG ──
  const IQRing = ({ value, color }) => {
    const r = 54, circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
      <div style={{ position: "relative", width: "130px", height: "130px" }}>
        <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 700, color: "var(--navy)", lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color, marginTop: "4px" }}>
            {iqInfo.label}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg2)", display: "flex", flexDirection: "column" }}>

      {/* ── Navbar ── */}
      <div
        className="dashboard-navbar"
        style={{
          background: "var(--navy)", padding: "0 32px",
          alignItems: "center", justifyContent: "space-between",
          top: 0, zIndex: 100, height: "64px", position: "relative",
        }}
      >
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "var(--gold)" }} />
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#fff", fontWeight: 700 }}>
          Legal Simplifier
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {[
            { label: "Home",    path: "/dashboard", icon: "fa-home" },
            { label: "Upload",  path: "/upload",    icon: "fa-upload" },
            { label: "Library", path: "/history",   icon: "fa-book" },
            { label: "Profile", path: "/profile",   icon: "fa-user" },
          ].map((item, i) => (
            <NavLink key={i} to={item.path}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "6px", textDecoration: "none",
                fontSize: "13px", fontWeight: 600, fontFamily: "Inter, sans-serif",
                background: isActive ? "rgba(233,195,73,0.15)" : "transparent",
                color: isActive ? "var(--gold)" : "rgba(255,255,255,0.7)",
                transition: "all 0.2s",
              })}
            >
              <i className={`fas ${item.icon}`} />
              <span className="nav-desktop-label">{item.label}</span>
            </NavLink>
          ))}
          <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.15)", margin: "0 8px" }} />
          <button onClick={handleLogout} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.7)", padding: "7px 14px", borderRadius: "6px",
            fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif",
            fontWeight: 600, display: "flex", alignItems: "center", gap: "6px",
          }}>
            <i className="fas fa-right-from-bracket" />
            <span className="nav-desktop-label">Logout</span>
          </button>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px", background: "var(--gold)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 700, color: "var(--navy)", marginLeft: "4px",
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div style={{
        flex: 1, maxWidth: "1200px", width: "100%",
        margin: "0 auto", padding: "40px 24px 60px",
        display: "flex", flexDirection: "column", gap: "24px",
      }}>

        {/* Page Header */}
        <div>
          <div className="t-label" style={{ color: "var(--gold2)", marginBottom: "6px" }}>My Account</div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "36px", fontWeight: 700, color: "var(--navy)", lineHeight: 1.15, marginBottom: "10px" }}>
            Profile
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "var(--on-variant)", lineHeight: 1.65 }}>
            Your legal intelligence dashboard — track your progress and manage your account.
          </div>
        </div>

        {/* ── Profile Hero ── */}
        <div style={{ background: "var(--navy)", borderRadius: "16px", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--gold)" }} />
          <div className="profile-hero" style={{
            background: "linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 40%, #0a1628 100%)",
            padding: "32px 36px", display: "flex", alignItems: "center",
            gap: "24px", flexWrap: "wrap",
          }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "16px",
              background: "var(--gold)", display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "Playfair Display, serif",
              fontSize: "32px", fontWeight: 700, color: "var(--navy)",
              border: "3px solid rgba(255,255,255,0.2)", flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 700, color: "#fff" }}>
                  {user?.name}
                </div>
                <div style={{
                  background: "var(--gold)", color: "var(--navy)",
                  fontSize: "11px", fontWeight: 700, padding: "4px 12px",
                  borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  Elite Member
                </div>
              </div>
              <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", marginTop: "6px", fontFamily: "Inter, sans-serif" }}>
                {user?.email}
              </div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginTop: "4px", fontFamily: "Inter, sans-serif" }}>
                <i className="fas fa-location-dot" /> India
              </div>
            </div>
            {/* Quick stats */}
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {[
                { value: history.length,                                  label: "Documents" },
                { value: history.filter(h => h.riskScore >= 7).length,   label: "Risk Alerts" },
                { value: riskyClausesCaught,                              label: "Clauses Caught" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Grid: IQ + Journey + Money ── */}
        <div className="profile-main-grid">

          {/* Legal IQ */}
          <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: iqInfo.color }} />
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 600, color: "var(--navy)", alignSelf: "flex-start" }}>
               Legal IQ Score
            </div>
            <IQRing value={legalIQ} color={iqInfo.color} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "var(--on-variant)", lineHeight: 1.6 }}>
                Based on doc variety, risky clauses found, risk avoidance, and improvement over time.
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                {[
                  { text: "Beginner", color: "#ef4444" },
                  { text: "Aware",    color: "#f59e0b" },
                  { text: "Informed", color: "#3b82f6" },
                  { text: "Expert",   color: "#22c55e" },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: l.color }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--on-variant)" }}>{l.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Journey */}
          <div className="card" style={{ padding: "28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--gold)" }} />
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 600, color: "var(--navy)", marginBottom: "24px" }}>
               Legal Journey
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {journeyStages.map((stage, i) => {
                const isActive = i === activeStage;
                const isDone   = i < activeStage;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: isActive ? "var(--navy)" : isDone ? "var(--gold)" : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                        flexShrink: 0, transition: "all 0.3s",
                      }}>
                        <i className={`fas ${stage.icon}`} style={{
                          fontSize: "15px",
                          color: isActive ? "var(--gold)" : isDone ? "var(--navy)" : "#ccc",
                        }} />
                      </div>
                      {i < journeyStages.length - 1 && (
                        <div style={{ width: "2px", height: "28px", background: isDone ? "var(--gold)" : "#f3f4f6", marginTop: "2px" }} />
                      )}
                    </div>
                    <div style={{ paddingTop: "8px", paddingBottom: "22px" }}>
                      <div style={{
                        fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700,
                        color: isActive || isDone ? "var(--navy)" : "var(--on-variant)",
                        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
                      }}>
                        {stage.label}
                        {isActive && (
                          <span style={{ fontSize: "11px", background: "rgba(233,195,73,0.2)", color: "var(--gold2)", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                            YOU ARE HERE
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "var(--on-variant)", marginTop: "3px" }}>
                        {stage.min === 0 ? "Start analyzing docs" : `${stage.min}+ documents analyzed`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Money Saved */}
          <div className="card" style={{ padding: "28px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#22c55e" }} />
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 600, color: "var(--navy)" }}>
               Estimated Savings
            </div>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: "38px", fontWeight: 700, color: "#22c55e" }}>
                ₹{moneySaved.toLocaleString('en-IN')}
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "var(--on-variant)", marginTop: "4px" }}>
                Estimated value protected
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Risky clauses caught",   value: riskyClausesCaught, icon: "fa-triangle-exclamation", color: "#ef4444" },
                { label: "Avg. penalty per clause", value: "₹15,000",         icon: "fa-indian-rupee-sign",    color: "#f59e0b" },
                { label: "Documents scanned",       value: history.length,     icon: "fa-file-contract",        color: "var(--navy)" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--outline-var)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: "15px", width: "18px" }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "var(--on-variant)" }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--navy)" }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "var(--on-variant)", lineHeight: 1.5, marginTop: "auto" }}>
              * Estimated based on average legal dispute costs in India.
            </div>
          </div>
        </div>

        {/* ── Settings Grid ── */}
        <div className="profile-settings-grid">

          {/* Account Security */}
          <div className="card" style={{ padding: "28px" }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 600, color: "var(--navy)", marginBottom: "20px" }}>
              Account Security
            </div>
            {[
              {
    icon: "fa-lock", label: "Change Password",
    sub: "Update your account password",
    action: () => setShowPasswordModal(true),
    right: <i className="fas fa-chevron-right" style={{ color: "var(--outline)" }} />,
  },
  {
    icon: "fa-shield-halved", label: "Two-Factor Authentication",
    sub: "Extra layer of protection",
    right: (
      <span style={{ fontSize: "11px", color: "#1a6e35", background: "#e6f4ea", padding: "4px 12px", borderRadius: "4px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
        ENABLED
      </span>
    ),
  },
  {
    icon: "fa-right-from-bracket", label: "Sign Out",
    sub: "Log out of your session",
    action: handleLogout,
    right: <i className="fas fa-chevron-right" style={{ color: "var(--outline)" }} />,
    danger: true,
  },
            ].map((item, i) => (
              <div key={i} onClick={item.action} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 0", borderBottom: i === 0 ? "1px solid var(--outline-var)" : "none",
                cursor: item.action ? "pointer" : "default",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`fas ${item.icon}`} style={{ color: "var(--navy)", fontSize: "18px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy)", fontFamily: "Inter, sans-serif" }}>{item.label}</div>
                    <div style={{ fontSize: "14px", color: "var(--on-variant)", fontFamily: "Inter, sans-serif", marginTop: "3px" }}>{item.sub}</div>
                  </div>
                </div>
                {item.right}
              </div>
            ))}
          </div>

          {/* Preferences */}
          {/* Preferences */}
<div className="card" style={{ padding: "28px" }}>
  <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 600, color: "var(--navy)", marginBottom: "20px" }}>
    Preferences
  </div>

  {/* Dark Mode */}
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--outline-var)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`} style={{ color: "var(--navy)", fontSize: "18px" }} />
      </div>
      <div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy)", fontFamily: "Inter, sans-serif" }}>
          Dark Mode
        </div>
        <div style={{ fontSize: "14px", color: "var(--on-variant)", fontFamily: "Inter, sans-serif", marginTop: "3px" }}>
          {darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
        </div>
      </div>
    </div>
    <div
      onClick={() => setDarkMode(!darkMode)}
      style={{
        width: "48px", height: "26px", borderRadius: "99px",
        background: darkMode ? "var(--navy)" : "var(--outline-var)",
        cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: "3px",
        left: darkMode ? "24px" : "3px",
        width: "20px", height: "20px", borderRadius: "50%",
        background: darkMode ? "var(--gold)" : "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </div>
  </div>

  {/* Default Language */}
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--outline-var)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="fas fa-language" style={{ color: "var(--navy)", fontSize: "18px" }} />
      </div>
      <div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy)", fontFamily: "Inter, sans-serif" }}>
          Default Language
        </div>
        <div style={{ fontSize: "14px", color: "var(--on-variant)", fontFamily: "Inter, sans-serif", marginTop: "3px" }}>
          Pre-selected on upload page
        </div>
      </div>
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
      {['English', 'Hindi'].map(lang => (
        <button
          key={lang}
          onClick={() => setDefaultLanguage(lang)}
          style={{
            padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600,
            transition: "all 0.2s",
            background: defaultLanguage=== lang ? "var(--navy)" : "transparent",
            color:defaultLanguage=== lang ? "#fff" : "var(--on-variant)",
            border:defaultLanguage === lang ? "1.5px solid var(--navy)" : "1.5px solid var(--outline-var)",
          }}
        >
          {lang === 'English' ? '🇬🇧' : '🇮🇳'} {lang}
        </button>
      ))}
    </div>
  </div>

  {/* Profile Completion */}
  <div style={{ padding: "16px 0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy)", fontFamily: "Inter, sans-serif" }}>
        Profile Completion
      </div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold2)", fontFamily: "Inter, sans-serif" }}>
        {completionPercent}%
      </div>
    </div>
    <div style={{ background: "var(--bg2)", borderRadius: "99px", height: "7px", overflow: "hidden" }}>
      <div style={{ width: `${completionPercent}%`, height: "100%", background: "var(--gold)", borderRadius: "99px", transition: "width 1s ease" }} />
    </div>
    <div style={{ fontSize: "14px", color: "var(--on-variant)", fontFamily: "Inter, sans-serif", marginTop: "8px" }}>
      {completionPercent < 100 ? "Analyze more documents to reach 100%" : "Your profile is complete! 🎉"}
    </div>
  </div>
</div>
        </div>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}