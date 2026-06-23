import React, { useState, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { analyzeDoc,uploadFile } from "../services/api";
import {useTheme} from '../context/ThemeContext';
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

import "../components/Layout.css";
import "./Upload.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const DOC_TYPES = [
  {
    id: "rent",
    icon: "fa-file-contract",
    name: "Rent Agreement",
    desc: "Lease terms, deposits, and tenant obligations",
    checks: [
      "Security deposit limit (max 2 months rent by law)",
      "Lock-in period and early exit penalty clauses",
      "Maintenance responsibility — landlord vs tenant",
      "Eviction notice period and conditions",
      "Rent increase terms and frequency",
    ],
  },
  {
    id: "loan",
    icon: "fa-hand-holding-dollar",
    name: "Loan Agreement",
    desc: "Interest rates, repayment cycles, and collateral",
    checks: [
      "Hidden interest rate clauses and compounding terms",
      "Prepayment penalty and foreclosure charges",
      "Collateral forfeiture conditions",
      "Default consequences and recovery rights",
      "Processing fees and hidden charges",
    ],
  },
  {
    id: "employment",
    icon: "fa-briefcase",
    name: "Employment",
    desc: "Severance, non-compete, and role details",
    checks: [
      "Non-compete and non-solicitation clauses",
      "Severance pay terms and notice period",
      "Intellectual property ownership rights",
      "Termination conditions and grounds",
      "Probation period and appraisal terms",
    ],
  },
  {
    id: "other",
    icon: "fa-scale-balanced",
    name: "Other Legal",
    desc: "Any other legal document type",
    checks: [
      "One-sided or unfair clauses",
      "Liability and indemnification terms",
      "Dispute resolution and jurisdiction",
      "Termination and exit conditions",
      "Hidden obligations and penalties",
    ],
  },
];

const LANGUAGES = ["English", "Hindi"];

export default function Upload() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [docType, setDocType] = useState(null);
 const { defaultLanguage } = useTheme();
const [language, setLanguage] = useState(defaultLanguage);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  


  const handleLogout = () => { logout(); navigate("/"); };

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return text;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

 const handleAnalyze = async () => {
  console.log('docType is:', docType);
  console.log('clicked', { docType, file, language });
  if (!docType) return setError("Please select a document type first");
  if (!file) return setError("Please select a document first");
  setError("");
  setLoading(true);
  try {
    // Step 1: Upload the file to get saved filename
    setProgress("Uploading document...");
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await uploadFile(formData);
    const savedFilename = uploadRes.data.filename;

    // Step 2: Extract text
    setProgress("Extracting text from document...");
    const text = await extractTextFromPDF(file);
    if (!text.trim()) return setError("Could not extract text from this PDF");

    // Step 3: Analyze with savedFile included
    setProgress("Sending to AI for analysis...");
    const res = await analyzeDoc({
      text,
      filename: file.name,
      language: language.toLowerCase(),
      docType,
      savedFile: savedFilename,  // ← this is the key addition
    });

    setProgress("Analysis complete!");
    navigate("/results", { state: { analysis: res.data.analysis } });
  } catch (err) {
    console.log(err);
    setError("Analysis failed. Please try again.");
  } finally {
    setLoading(false);
    setProgress("");
  }
};

  const selectedDoc = DOC_TYPES.find((d) => d.id === docType);

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
        display: "flex", flexDirection: "column", gap: "32px",
      }}>

        {/* Header */}
        <div>
          <div className="t-label" style={{ color: "var(--gold2)", marginBottom: "6px" }}>Document Analysis</div>
          <div style={{
            fontFamily: "Playfair Display, serif", fontSize: "36px",
            fontWeight: 700, color: "var(--navy)", lineHeight: 1.15, marginBottom: "10px",
          }}>Analyze Document</div>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: "16px",
            color: "var(--on-variant)", lineHeight: 1.65, maxWidth: "600px",
          }}>
            Transform complex legal jargon into clear, actionable insights.
            Follow the steps below to begin your analysis.
          </div>
        </div>

        {/* Main Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 400px",
          gap: "28px", alignItems: "start",
        }} className="upload-main-grid">

          {/* LEFT — Step 1 + Step 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Step 1 */}
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", background: "var(--navy)",
                  color: "#fff", fontSize: "13px", fontWeight: 700, display: "flex",
                  alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", flexShrink: 0,
                }}>1</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--navy)" }}>
                  Select Document Type
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {DOC_TYPES.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setDocType(docType === type.id ? null : type.id)}
                    style={{
                      background: docType === type.id ? "rgba(233,195,73,0.08)" : "var(--bg2)",
                      border: `2px solid ${docType === type.id ? "var(--gold2)" : "var(--outline-var)"}`,
                      borderRadius: "12px", padding: "18px 16px", cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: "8px",
                      transition: "all 0.2s", position: "relative",
                    }}
                  >
                    {docType === type.id && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                        background: "var(--gold)", borderRadius: "12px 12px 0 0",
                      }} />
                    )}
                    <i className={`fas ${type.icon}`} style={{
                      fontSize: "22px", color: docType === type.id ? "var(--gold2)" : "var(--navy)",
                    }} />
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", fontWeight: 600, color: "var(--navy)" }}>
                      {type.name}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--on-variant)", lineHeight: 1.5 }}>
                      {type.desc}
                    </div>
                    {docType === type.id && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        fontSize: "11px", fontWeight: 700, color: "var(--gold2)",
                        fontFamily: "Inter, sans-serif", marginTop: "2px",
                      }}>
                        <i className="fas fa-check" /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Expanding Info Box */}
              {selectedDoc && (
                <div style={{
                  marginTop: "20px", background: "var(--navy)",
                  borderRadius: "12px", padding: "20px 24px",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--gold)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <i className="fas fa-magnifying-glass" style={{ color: "var(--gold)", fontSize: "14px" }} />
                    <span style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", fontWeight: 600, color: "#fff" }}>
                      What our AI checks in your {selectedDoc.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedDoc.checks.map((check, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <i className="fas fa-circle-check" style={{ color: "var(--gold)", fontSize: "13px", marginTop: "2px", flexShrink: 0 }} />
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                          {check}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Language */}
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", background: "var(--navy)",
                  color: "#fff", fontSize: "13px", fontWeight: 700, display: "flex",
                  alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", flexShrink: 0,
                }}>2</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--navy)" }}>
                  Response Language
                </div>
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "var(--on-variant)", marginBottom: "16px", lineHeight: 1.6 }}>
                The AI analysis result will be delivered in your chosen language.
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                {LANGUAGES.map((lang) => (
                  <button key={lang} onClick={() => setLanguage(lang)} style={{
                    flex: 1, padding: "13px 16px", borderRadius: "10px",
                    fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    background: language === lang ? "var(--navy)" : "transparent",
                    color: language === lang ? "#fff" : "var(--on-variant)",
                    border: language === lang ? "2px solid var(--navy)" : "2px solid var(--outline-var)",
                  }}>
                    {lang === "English" ? "🇬🇧" : "🇮🇳"} {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Step 3 + Analyze */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Step 3 — Upload */}
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", background: "var(--navy)",
                  color: "#fff", fontSize: "13px", fontWeight: 700, display: "flex",
                  alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", flexShrink: 0,
                }}>3</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--navy)" }}>
                  Upload Document
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => !file && fileRef.current.click()}
                style={{
                  background: dragOver ? "rgba(233,195,73,0.06)" : "var(--bg2)",
                  border: `2px dashed ${file ? "var(--gold2)" : dragOver ? "var(--gold)" : "var(--outline-var)"}`,
                  borderRadius: "12px", padding: "40px 20px",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "12px", textAlign: "center", transition: "all 0.2s",
                  cursor: file ? "default" : "pointer",
                  minHeight: "260px", justifyContent: "center",
                }}
              >
                {file ? (
                  <>
                    <div style={{
                      width: "60px", height: "60px", borderRadius: "14px",
                      background: "rgba(34,197,94,0.1)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <i className="fas fa-circle-check" style={{ fontSize: "30px", color: "#22c55e" }} />
                    </div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", fontWeight: 600, color: "var(--navy)", wordBreak: "break-all" }}>
                      {file.name}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--on-variant)" }}>
                      {(file.size / 1024).toFixed(1)} KB · Ready to analyze
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{
                        fontSize: "13px", color: "var(--error)", background: "transparent",
                        border: "1px solid var(--error)", borderRadius: "6px", cursor: "pointer",
                        fontFamily: "Inter, sans-serif", padding: "6px 16px", fontWeight: 600,
                      }}
                    >
                      <i className="fas fa-trash" /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: "60px", height: "60px", borderRadius: "14px",
                      background: "rgba(10,20,40,0.06)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: "28px", color: "var(--on-variant)" }} />
                    </div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: "17px", fontWeight: 600, color: "var(--navy)" }}>
                      Drag & drop your file here
                    </div>
                    <div style={{
                      fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: "var(--on-variant)", lineHeight: 1.7,
                    }}>
                      Supports PDF, DOCX, and JPG<br />Max file size 10MB
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: "auto", padding: "11px 26px", marginTop: "4px", fontSize: "14px" }}
                      onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}
                    >
                      <i className="fas fa-folder-open" /> Browse Files
                    </button>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: "100%", padding: "18px", background: "var(--navy)", color: "#fff",
                border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700,
                fontFamily: "Inter, sans-serif", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center",
                justifyContent: "center", gap: "10px", transition: "all 0.2s",
                position: "relative", overflow: "hidden", letterSpacing: "0.02em",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--gold)" }} />
              {loading
                ? <><i className="fas fa-spinner fa-spin" /> Analyzing...</>
                : <><i className="fas fa-wand-magic-sparkles" /> Analyze Document</>
              }
            </button>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "10px", padding: "14px 16px", color: "var(--error)",
                fontFamily: "Inter, sans-serif", fontSize: "14px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}

            {/* Progress */}
            {progress && (
              <div style={{
                background: "rgba(233,195,73,0.08)", border: "1px solid rgba(233,195,73,0.3)",
                borderRadius: "10px", padding: "14px 16px", fontFamily: "Inter, sans-serif",
                fontSize: "14px", color: "var(--navy)", fontWeight: 500,
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "var(--gold)", flexShrink: 0,
                  animation: "pulse 1.2s ease-in-out infinite",
                }} />
                {progress}
              </div>
            )}
          </div>
        </div>
      </div>

    
    </div>
  );
}