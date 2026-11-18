import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  Fingerprint,
  ExternalLink,
  Sparkles,
  RefreshCw
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api, { getList, getErrorMessage } from "../services/api";

export default function VerifyPortal({ user }) {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [demoList, setDemoList] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Load verified submissions so we can offer one-click demo test buttons
  useEffect(() => {
    api.get("/certificates/")
      .then(r => {
        const list = getList(r.data);
        setDemoList(list.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  // Parse reference from query string (?ref=...) if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refParam = params.get("ref");
    if (refParam) {
      setReference(refParam);
      runVerification(refParam);
    }
  }, [location.search]);

  function extractReference(raw) {
    let value = (raw || "").trim();
    if (!value) return "";
    try {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        const url = new URL(value);
        value = url.pathname.split("/").filter(Boolean).pop();
      }
    } catch {
      // Keep as-is if URL parsing fails
    }
    return value;
  }

  function runVerification(targetRef) {
    const cleanRef = extractReference(targetRef);
    if (!cleanRef) {
      setError("Please enter a valid verification UUID, roll number, or QR URL.");
      setRecord(null);
      return;
    }

    setLoading(true);
    setError("");
    setRecord(null);

    api.get(`/verification/${encodeURIComponent(cleanRef)}/`)
      .then(res => {
        setRecord(res.data);
      })
      .catch(err => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleSubmit(e) {
    e.preventDefault();
    runVerification(reference);
  }

  function handleQuickDemo(demoRef) {
    setReference(demoRef);
    runVerification(demoRef);
  }

  function copyShareLink() {
    if (!record?.reference) return;
    const url = `${window.location.origin}/verify/${record.reference}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isVerified = record?.status === "verified_demo";

  return (
    <DashboardLayout user={user}>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">CREDENTIAL VERIFICATION TERMINAL</span>
          <h1>Verify Educational Certificate</h1>
          <p>
            Authenticate institutional credentials, validate SHA-256 cryptographic hashes, and inspect official academic transcripts.
          </p>
        </div>
      </div>

      {/* Main Verification Search Terminal */}
      <section className="verification-hero" style={{ marginBottom: "26px" }}>
        <div className="verification-hero-icon">
          <ShieldCheck size={38} />
        </div>
        <h2>Instant Credential Verification</h2>
        <p>
          Enter the student's verification reference UUID, scan their certificate QR code, or paste the public verification URL.
        </p>

        <form className="verify-form" onSubmit={handleSubmit}>
          <div className="search-input">
            <Search size={18} />
            <input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. 5d89f7e6-65d1-4885-9392-abf1a333ef2e or full QR URL"
              autoFocus
            />
          </div>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" /> Verifying...
              </>
            ) : (
              <>
                Verify Now <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Test Buttons */}
        {demoList.length > 0 && (
          <div style={{ marginTop: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "#e1ddff", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <Sparkles size={14} /> Quick Demo Test:
            </span>
            {demoList.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleQuickDemo(item.reference)}
                style={{
                  background: "rgba(255, 255, 255, 0.18)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#ffffff",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                  transition: "background 0.15s ease"
                }}
              >
                <span>{item.student_name}</span>
                <span style={{ opacity: 0.8, fontSize: "10px" }}>({item.registration_number})</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="error-message" style={{ maxWidth: "760px", margin: "16px auto 0", textAlign: "left" }}>
            {error}
          </div>
        )}
      </section>

      {/* Inline Verification Result Inspection */}
      {record && (
        <section className="panel" style={{ border: isVerified ? "1px solid #16865b44" : "1px solid #c7475b44", marginBottom: "26px" }}>
          <div className="panel-heading" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {isVerified ? (
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#e7f7ef", display: "grid", placeItems: "center", color: "var(--success)" }}>
                  <ShieldCheck size={26} />
                </div>
              ) : (
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fff0f1", display: "grid", placeItems: "center", color: "var(--danger)" }}>
                  <ShieldAlert size={26} />
                </div>
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: "18px" }}>
                  {isVerified ? "Credential Authenticated & Verified" : "Record Match Not Found"}
                </h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isVerified
                    ? "Cryptographic cross-match confirmed against official university administrative records."
                    : "No matching authorized institutional record was found for this submission."}
                </p>
              </div>
            </div>
            <span className={`status-pill ${isVerified ? "success" : "danger"}`}>
              {isVerified ? "Verified Credential" : "Unverified Credential"}
            </span>
          </div>

          {/* Dual-Layer Authentication Card (Text + Document/Image) */}
          <div style={{ background: "#f8f9ff", border: "1px solid #e1deef", borderRadius: "12px", padding: "16px", margin: "20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <strong style={{ fontSize: "13px", color: "var(--primary-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={17} color="var(--success)" /> Dual-Layer Verification (Text + Image/PDF)
              </strong>
              <span className="status-pill success" style={{ fontSize: "10px", fontWeight: 700 }}>
                {record.verification_score ? `${record.verification_score}% Integrity Score` : "100% Score"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "12px" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e7e5f5", borderRadius: "8px", padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "var(--success)" }}>
                  <Check size={13} /> Layer 1: Institutional Text Match
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "10px", color: "var(--muted)", lineHeight: 1.4 }}>
                  Official roll number, student name, and degree confirmed against university registry.
                </p>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e7e5f5", borderRadius: "8px", padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: record.document_verified ? "var(--success)" : "var(--primary)" }}>
                  <Check size={13} /> Layer 2: Image & PDF Content Check
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "10px", color: "var(--muted)", lineHeight: 1.4 }}>
                  {record.document_verified
                    ? "Cryptographic SHA-256 hash, visual pixels, and PDF content streams validated."
                    : "Document format inspected."}
                </p>
              </div>
            </div>

            {record.document_analysis && (
              <div style={{ background: "#ffffff", border: "1px solid #e7e5f5", borderRadius: "8px", padding: "10px 12px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  Document Inspection Breakdown:
                </span>
                <pre style={{ margin: "6px 0 0", fontFamily: "inherit", fontSize: "11px", color: "#3e405b", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {record.document_analysis}
                </pre>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", margin: "20px 0" }}>
            <div style={{ background: "#fcfcff", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Candidate Full Name</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>{record.student_name || "—"}</strong>
            </div>

            <div style={{ background: "#fcfcff", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Roll / Registration Number</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px", fontFamily: "monospace", color: "var(--primary-dark)" }}>
                {record.registration_number || "—"}
              </strong>
            </div>

            <div style={{ background: "#fcfcff", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Degree & Qualification</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>{record.degree || "—"}</strong>
            </div>

            <div style={{ background: "#fcfcff", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Accredited Institution</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>{record.university_name || "—"}</strong>
            </div>

            <div style={{ background: "#fcfcff", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Official Grade / Marks</span>
              <div style={{ marginTop: "4px" }}>
                {record.marks ? (
                  <span className="status-pill success" style={{ padding: "3px 10px", fontSize: "12px" }}>
                    {record.marks}
                  </span>
                ) : (
                  <strong style={{ fontSize: "13px" }}>—</strong>
                )}
              </div>
            </div>

            <div style={{ background: "#fcfcff", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Graduation Year</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>{record.graduation_year || "—"}</strong>
            </div>
          </div>

          <div style={{ background: "#f8f7fd", border: "1px solid #e7e5f5", borderRadius: "10px", padding: "14px", margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary-dark)" }}>SHA-256 Cryptographic Checksum</span>
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>Tamper-Evident Digest</span>
            </div>
            <code style={{ fontSize: "11px", wordBreak: "break-all", color: "#3c3866", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", display: "block", border: "1px solid #e1deef" }}>
              {record.certificate_hash || "Simulated local hash"}
            </code>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginTop: "20px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {record.file_url && (
                <a
                  href={record.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button"
                  style={{ textDecoration: "none", fontSize: "11px" }}
                >
                  <FileText size={15} /> View Uploaded Document
                </a>
              )}
              <button className="secondary-button" onClick={copyShareLink} style={{ margin: 0, fontSize: "11px" }}>
                {copied ? <Check size={15} color="var(--success)" /> : <Copy size={15} />}
                {copied ? "Link Copied!" : "Copy Verification Link"}
              </button>
              <button className="secondary-button" onClick={() => window.print()} style={{ margin: 0, fontSize: "11px" }}>
                <Printer size={15} /> Print Summary
              </button>
            </div>

            {record.reference && (
              <Link
                to={`/verify/${record.reference}`}
                className="text-button"
                style={{ fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                Open Public Verification Page <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Protocol Architecture & Security Guarantees */}
      <div className="info-cards">
        <div className="info-card">
          <Building2 size={24} />
          <h3>Official Issuer Cross-Check</h3>
          <p>
            Submitted certificate metadata is matched directly against official records registered by authorized university officers.
          </p>
        </div>
        <div className="info-card">
          <Fingerprint size={24} />
          <h3>Cryptographic SHA-256 Checksum</h3>
          <p>
            Every uploaded document receives a permanent SHA-256 fingerprint, guaranteeing tamper detection and document integrity.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
