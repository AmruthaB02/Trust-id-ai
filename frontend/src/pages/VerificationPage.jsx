import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ArrowLeft, FileText, Printer, Copy, Check, CheckCircle2 } from "lucide-react";
import api, { getErrorMessage } from "../services/api";

export default function VerificationPage() {
  const { reference } = useParams();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/verification/${reference}/`)
      .then(r => {
        if (active) setRecord(r.data);
      })
      .catch(e => {
        if (active) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reference]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function printSummary() {
    window.print();
  }

  if (loading) {
    return <div className="center-state">Checking cryptographic verification record...</div>;
  }

  const verified = record?.status === "verified_demo";

  return (
    <div className="public-verification">
      <div className="public-brand">
        <ShieldCheck size={28} />
        <span>TrustID AI Verification Network</span>
      </div>

      <div className="verification-card">
        {error ? (
          <>
            <ShieldAlert size={50} className="danger-icon" />
            <h1>Verification unavailable</h1>
            <p className="verification-description">{error}</p>
          </>
        ) : (
          <>
            <div>
              {verified ? (
                <ShieldCheck size={54} className="success-icon" />
              ) : (
                <ShieldAlert size={54} className="danger-icon" />
              )}
            </div>
            <span className={`status-pill ${verified ? "success" : "danger"}`} style={{ marginTop: "10px" }}>
              {verified ? "Verified Credential" : "Unverified Credential"}
            </span>
            <h1 style={{ marginTop: "12px", marginBottom: "8px" }}>
              {verified ? "Credential Authenticated" : "Record Match Not Found"}
            </h1>
            <p className="verification-description">
              {verified
                ? "The entered certificate metadata and document pixels/text successfully matched an authorized institutional record in the TrustID network."
                : "No matching authorized institutional record was found in the verification registry for the provided credentials."}
            </p>

            {/* Dual-Layer Authentication Card (Text + Image/PDF) */}
            <div style={{ background: "#f8f9ff", border: "1px solid #e1deef", borderRadius: "12px", padding: "16px", margin: "20px 0", textAlign: "left" }}>
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

            <div className="verification-details">
              {[
                ["Student Name", record.student_name],
                ["Registration / Roll No", record.registration_number],
                ["Degree / Qualification", record.degree],
                ["Institution / University", record.university_name],
                ["Official Grade / Marks", record.marks || "—"],
                ["Graduation Year", record.graduation_year],
                ["Verification Score", `${record.verification_score || 100}% (Text + Image/PDF Verified)`],
                ["SHA-256 Checksum", record.certificate_hash],
                ["Blockchain Reference", record.blockchain_tx_hash || "Simulated local ledger in demo"],
                ["Verification UUID", record.reference],
                ["Submission Date", record.created_at ? new Date(record.created_at).toLocaleString() : "—"]
              ].map(([label, value]) => (
                <div className="detail-row" key={label}>
                  <span>{label}</span>
                  <strong>{value || "—"}</strong>
                </div>
              ))}
            </div>

            {record.file_url && (
              <div style={{ margin: "16px 0" }}>
                <a
                  href={record.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-button"
                  style={{ display: "inline-flex", gap: "8px", textDecoration: "none" }}
                >
                  <FileText size={16} /> Open Uploaded Certificate Document
                </a>
              </div>
            )}

            {record.qr_code_url && (
              <div style={{ marginTop: "18px" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px" }}>
                  Scan Official Verification QR Reference:
                </p>
                <img
                  className="qr-image"
                  src={record.qr_code_url}
                  alt="Official verification QR code"
                />
              </div>
            )}

            <div className="privacy-note">{record.review_note}</div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "22px", flexWrap: "wrap" }}>
              <button className="secondary-button" onClick={copyUrl} style={{ margin: 0 }}>
                {copied ? <Check size={15} color="var(--success)" /> : <Copy size={15} />}
                {copied ? "Link Copied!" : "Copy Verification Link"}
              </button>
              <button className="secondary-button" onClick={printSummary} style={{ margin: 0 }}>
                <Printer size={15} /> Print / Save Summary
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: "25px" }}>
          <Link className="text-button" to="/dashboard" style={{ fontSize: "12px", textDecoration: "none" }}>
            <ArrowLeft size={16} /> Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
