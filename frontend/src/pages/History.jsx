import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHistory, deleteHistory } from "../services/api";
import "../components/Layout.css";
import jsPDF from 'jspdf';
import "./History.css";


export default function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteModal,setDeleteModal] = useState({show:false,id:null});

  useEffect(() => {
    getHistory()
      .then((res) => { setHistory(res.data); setLoading(false); })
      .catch((err) => { console.log(err); setLoading(false); });
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  const getRiskLevel = (score) => {
    if (score <= 3) return { label: "Low Risk", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
    if (score <= 6) return { label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    if (score <= 8) return { label: "High Risk", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    return { label: "Critical", color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
  };

  const getSafePercent = (score) =>
    Math.max(0, Math.min(100, Math.round((10 - (score ?? 5)) / 10 * 100)));

  const getRingColor = (percent) => {
    if (percent >= 70) return "#22c55e";
    if (percent >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const filtered = history.filter((item) => {
    const matchFilter =
      filter === "all" ||
      (filter === "safe" && item.riskScore <= 3) ||
      (filter === "moderate" && item.riskScore > 3 && item.riskScore <= 6) ||
      (filter === "high" && item.riskScore > 6);
    const matchSearch =
      search === "" ||
      (item.documentId?.filename || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.docType || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

 const handleDelete = async () => {
  try {
    await deleteHistory(deleteModal.id);
    setHistory(prev => prev.filter(item => item._id !== deleteModal.id));
    setDeleteModal({ show: false, id: null });
  } catch (err) {
    console.log(err);
  }
};


const handleExportSinglePDF = (e, item) => {
  e.stopPropagation();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Header Background ──
  doc.setFillColor(10, 20, 50);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Gold accent line
  doc.setFillColor(233, 195, 73);
  doc.rect(0, 45, pageWidth, 2, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Legal Samjho', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(233, 195, 73);
  doc.text('Document Analysis Report', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageWidth / 2, 38, { align: 'center' }
  );

  y = 58;

  // ── Document Info Box ──
  doc.setFillColor(245, 246, 250);
  doc.roundedRect(14, y, pageWidth - 28, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 20, 50);
  doc.text(item.documentId?.filename || 'Document', 20, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Type: ${item.docType || 'Legal Document'}`, 20, y + 19);
  doc.text(`Language: ${item.language?.charAt(0).toUpperCase() + item.language?.slice(1)}`, 20, y + 27);
  doc.text(
    `Analyzed: ${new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    20, y + 35
  );

  // Risk score on right side of box
  const risk = getRiskLevel(item.riskScore);
  const safePercent = getSafePercent(item.riskScore);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(
    item.riskScore <= 3 ? 34 : item.riskScore <= 6 ? 180 : 220,
    item.riskScore <= 3 ? 197 : item.riskScore <= 6 ? 120 : 38,
    item.riskScore <= 3 ? 94 : item.riskScore <= 6 ? 11 : 38,
  );
  doc.text(`${item.riskScore}/10`, pageWidth - 20, y + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(risk.label, pageWidth - 20, y + 27, { align: 'right' });
  doc.text(`Safe: ${safePercent}%`, pageWidth - 20, y + 35, { align: 'right' });

  y += 48;

  // ── Summary Section ──
  doc.setFillColor(233, 195, 73);
  doc.rect(14, y, 3, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(10, 20, 50);
  doc.text('Summary', 20, y + 9);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(item.summary || '', pageWidth - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 5 + 12;

  // ── Clauses Section ──
  doc.setFillColor(233, 195, 73);
  doc.rect(14, y, 3, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(10, 20, 50);
  doc.text('Clause Analysis', 20, y + 9);
  y += 18;

  if (item.clauses && item.clauses.length > 0) {
    item.clauses.forEach((clause, i) => {
      if (y > 260) { doc.addPage(); y = 20; }

      // Risk color
      const clauseColor =
        clause.risk === 'safe' ? [34, 197, 94] :
        clause.risk === 'caution' ? [245, 158, 11] :
        [239, 68, 68];

      // Clause box background
      doc.setFillColor(
        clause.risk === 'safe' ? 240 : clause.risk === 'caution' ? 255 : 255,
        clause.risk === 'safe' ? 253 : clause.risk === 'caution' ? 247 : 240,
        clause.risk === 'safe' ? 244 : clause.risk === 'caution' ? 237 : 240,
      );
      const clauseLines = doc.splitTextToSize(clause.explanation || '', pageWidth - 50);
      const warningLines = clause.warnings ? doc.splitTextToSize(`⚠ ${clause.warnings}`, pageWidth - 50) : [];
      const boxHeight = 8 + clauseLines.length * 5 + (warningLines.length > 0 ? warningLines.length * 5 + 4 : 0) + 6;
      doc.roundedRect(14, y, pageWidth - 28, boxHeight, 2, 2, 'F');

      // Risk badge
      doc.setFillColor(...clauseColor);
      doc.roundedRect(pageWidth - 40, y + 3, 26, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(clause.risk?.toUpperCase() || '', pageWidth - 27, y + 8, { align: 'center' });

      // Clause title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(10, 20, 50);
      doc.text(`${i + 1}. ${clause.title || 'Clause'}`, 18, y + 9);

      // Explanation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(clauseLines, 18, y + 16);
      y += 16 + clauseLines.length * 5;

      // Warning
      if (clause.warnings && clause.warnings.trim()) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...clauseColor);
        doc.text(warningLines, 18, y + 2);
        y += warningLines.length * 5 + 4;
      }

      y += 8;
    });
  }

  // ── Footer ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(233, 195, 73);
    doc.setLineWidth(0.5);
    doc.line(14, 287, pageWidth - 14, 287);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Legal Samjho — The law, finally in your language.', 14, 293);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 293, { align: 'right' });
  }

  doc.save(`${item.documentId?.filename?.replace('.pdf', '') || 'Report'}_Analysis.pdf`);
};

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg2)", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      <div
        className="dashboard-navbar"
        style={{
          background: "var(--navy)", padding: "0 32px", display: "flex",
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
            { label: "Home", path: "/dashboard", icon: "fa-home" },
            { label: "Upload", path: "/upload", icon: "fa-upload" },
            { label: "Library", path: "/history", icon: "fa-book" },
            { label: "Profile", path: "/profile", icon: "fa-user" },
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

      {/* Page Body */}
      <div style={{
        flex: 1, maxWidth: "1200px", width: "100%",
        margin: "0 auto", padding: "40px 24px 60px",
        display: "flex", flexDirection: "column", gap: "28px",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="t-label" style={{ color: "var(--gold2)", marginBottom: "6px" }}>Document Library</div>
            <div style={{
              fontFamily: "Playfair Display, serif", fontSize: "36px",
              fontWeight: 700, color: "var(--navy)", lineHeight: 1.15, marginBottom: "10px",
            }}>Your Archives</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "var(--on-variant)", lineHeight: 1.6 }}>
              All your previously analyzed documents in one place.
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate("/upload")}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", fontSize: "14px", width: "auto" }}
          >
            <i className="fas fa-plus" /> New Analysis
          </button>
         
        </div>


        {/* Search + Filter */}
        {!loading && history.length > 0 && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <i className="fas fa-search" style={{
                position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                color: "var(--on-variant)", fontSize: "13px",
              }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "11px 16px 11px 38px",
                  borderRadius: "8px", border: "1.5px solid var(--outline-var)",
                  background: "#fff", fontFamily: "Inter, sans-serif",
                  fontSize: "14px", color: "var(--navy)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "all", label: "All" },
                { id: "safe", label: "Safe" },
                { id: "moderate", label: "Moderate" },
                { id: "high", label: "High Risk" },
              ].map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: "9px 16px", borderRadius: "8px", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600,
                  transition: "all 0.2s",
                  background: filter === f.id ? "var(--navy)" : "#fff",
                  color: filter === f.id ? "#fff" : "var(--on-variant)",
                  border: filter === f.id ? "1.5px solid var(--navy)" : "1.5px solid var(--outline-var)",
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <i className="fas fa-hourglass-half" style={{ fontSize: "36px", color: "var(--gold)" }} />
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "var(--on-variant)", marginTop: "16px" }}>
              Loading your documents...
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 40px" }}>
            <i className="fas fa-folder-open" style={{ fontSize: "48px", color: "var(--outline)", marginBottom: "20px" }} />
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 600, color: "var(--navy)" }}>
              No documents yet
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "var(--on-variant)", marginTop: "10px", maxWidth: "360px", margin: "10px auto 0" }}>
              You haven't analyzed any documents yet. Upload your first document to get started.
            </div>
            <button className="btn-primary" style={{ marginTop: "24px", width: "auto", padding: "12px 28px" }} onClick={() => navigate("/upload")}>
              <i className="fas fa-upload" /> Upload Document
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <i className="fas fa-magnifying-glass" style={{ fontSize: "36px", color: "var(--outline)", marginBottom: "16px" }} />
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", color: "var(--navy)" }}>No results found</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "var(--on-variant)", marginTop: "8px" }}>
              Try a different search or filter.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--on-variant)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {filtered.length} Document{filtered.length !== 1 ? "s" : ""} Found
            </div>
            {filtered.map((item, index) => {
              const risk = getRiskLevel(item.riskScore);
              const safePercent = getSafePercent(item.riskScore);
              const ringColor = getRingColor(safePercent);
              const radius = 22;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (safePercent / 100) * circumference;

              return (
                <div
                  key={index}
                  className="card"
                  onClick={() => navigate("/results", { state: { analysis: item } })}
                  style={{ cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s", padding: "24px 28px" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>

                    {/* Ring */}
                    <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
                      <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="28" cy="28" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="4" />
                        <circle cx="28" cy="28" r={radius} fill="none" stroke={ringColor} strokeWidth="4"
                          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.7s ease" }}
                        />
                      </svg>
                      <div style={{
                        position: "absolute", inset: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: ringColor,
                      }}>
                        {safePercent}%
                      </div>
                    </div>

                    {/* Main Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-variant)", fontFamily: "Inter, sans-serif", marginBottom: "4px" }}>
                            {item.docType || "Legal Document"}
                          </div>
                          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.documentId?.filename || "Document"}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                          <span style={{
                            fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
                            fontWeight: 700, fontFamily: "Inter, sans-serif",
                            background: risk.bg, color: risk.color,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>
                            {risk.label}
                          </span>
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "var(--on-variant)" }}>
                            Score: <strong style={{ color: "var(--navy)" }}>{item.riskScore}/10</strong>
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "var(--on-variant)", lineHeight: 1.6, marginTop: "10px" }}>
                        {item.summary?.substring(0, 120)}...
                      </div>

                      {/* Footer */}
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--outline-var)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "var(--on-variant)", display: "flex", alignItems: "center", gap: "5px" }}>
                            <i className="fas fa-language" style={{ color: "var(--gold2)" }} />
                            {item.language?.charAt(0).toUpperCase() + item.language?.slice(1)}
                          </span>
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "var(--on-variant)", display: "flex", alignItems: "center", gap: "5px" }}>
                            <i className="fas fa-calendar" style={{ color: "var(--gold2)" }} />
                            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                              setDeleteModal({ show: true, id: item._id });
}}
                            style={{
                                background:"transparent",
                                border:"1px solid rgba(239,68,68,0.3)",
                                color:"#ef4444",
                                padding:"5px,12px",
                                borderRadius:"6px",
                                fontSize:"12px",
                                fontWeight:600,
                                fontFamily:"Inter,sans-serif",
                                cursor:"pointer",
                                display:"flex",
                                alignItems:"center",
                                gap:"5px",
                                transition:"all 0.2s"
                            }}
                            onMouseEnter={e => {e.currentTarget.style.background="rgba(239,68,68,0.08";}}
                            onMouseLeave={e => {e.currentTarget.style.background="transparent";}}
                            >
                            <i className="fas fa-trash" /> 
                            </button>

                            <button
  onClick={(e) => handleExportSinglePDF(e, item)}
  style={{
    background: "transparent",
    border: "1px solid rgba(233,195,73,0.4)",
    color: "var(--gold2)",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "Inter, sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.2s",
  }}
  onMouseEnter={e => { e.currentTarget.style.background = "rgba(233,195,73,0.08)"; }}
  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
>
  <i className="fas fa-file-pdf" /> Report
</button>
        
                        <span style={{ fontSize: "13px", color: "var(--gold2)", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                          View Details →
                        </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
{deleteModal.show && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px",
  }}
    onClick={() => setDeleteModal({ show: false, id: null })}
  >
    <div style={{
      background: "#fff", borderRadius: "16px",
      padding: "32px", maxWidth: "400px", width: "100%",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      position: "relative", overflow: "hidden",
    }}
      onClick={e => e.stopPropagation()}
    >
      {/* Gold top line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "3px", background: "var(--gold)",
      }} />

      {/* Icon */}
      <div style={{
        width: "56px", height: "56px", borderRadius: "14px",
        background: "rgba(239,68,68,0.1)", display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: "20px",
      }}>
        <i className="fas fa-trash" style={{ fontSize: "22px", color: "#ef4444" }} />
      </div>

      {/* Text */}
      <div style={{
        fontFamily: "Playfair Display, serif", fontSize: "22px",
        fontWeight: 700, color: "var(--navy)", marginBottom: "10px",
      }}>
        Delete Document?
      </div>
      <div style={{
        fontFamily: "Inter, sans-serif", fontSize: "14px",
        color: "var(--on-variant)", lineHeight: 1.6, marginBottom: "28px",
      }}>
        This will permanently delete this document and its analysis. This action cannot be undone.
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => setDeleteModal({ show: false, id: null })}
          style={{
            flex: 1, padding: "12px", borderRadius: "8px",
            border: "1.5px solid var(--outline-var)", background: "transparent",
            fontFamily: "Inter, sans-serif", fontSize: "14px",
            fontWeight: 600, cursor: "pointer", color: "var(--on-variant)",
            transition: "all 0.2s",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          style={{
            flex: 1, padding: "12px", borderRadius: "8px",
            border: "none", background: "#ef4444", color: "#fff",
            fontFamily: "Inter, sans-serif", fontSize: "14px",
            fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <i className="fas fa-trash" /> Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}