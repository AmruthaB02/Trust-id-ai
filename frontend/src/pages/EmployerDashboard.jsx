import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Fingerprint,
  ShieldCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Briefcase
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api, { getList } from "../services/api";

export default function EmployerDashboard({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInst, setSelectedInst] = useState("all");
  const [quickRef, setQuickRef] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get("/certificates/")
      .then(r => setCandidates(getList(r.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const universities = useMemo(() => {
    const list = Array.from(new Set(candidates.map(c => c.university_name).filter(Boolean)));
    return list;
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchInst = selectedInst === "all" || c.university_name === selectedInst;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        (c.student_name && c.student_name.toLowerCase().includes(term)) ||
        (c.registration_number && c.registration_number.toLowerCase().includes(term)) ||
        (c.degree && c.degree.toLowerCase().includes(term)) ||
        (c.university_name && c.university_name.toLowerCase().includes(term));
      return matchInst && matchSearch;
    });
  }, [candidates, selectedInst, searchTerm]);

  function handleQuickVerify(e) {
    e.preventDefault();
    let val = quickRef.trim();
    if (!val) {
      navigate("/verify");
      return;
    }
    navigate(`/verify?ref=${encodeURIComponent(val)}`);
  }

  return (
    <DashboardLayout user={user}>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">EMPLOYER COMMAND CENTER</span>
          <h1>Candidate Credentials & Network Overview</h1>
          <p>
            Review accredited candidate records, evaluate verified qualifications, and audit cryptographic credentials across partner institutions.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <section className="stats-grid">
        <StatCard
          title="Verified Candidates"
          value={candidates.length}
          icon={Users}
        />
        <StatCard
          title="Partner Institutions"
          value={universities.length || 1}
          icon={Building2}
        />
        <StatCard
          title="Tamper Protection"
          value="100% SHA-256"
          icon={Fingerprint}
        />
        <StatCard
          title="Employer Workspace"
          value={user?.company_name || "Apex Technologies"}
          icon={Briefcase}
        />
      </section>

      {/* Quick Action Credential Verification Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #30266f 0%, #4c3ba6 60%, #6859dc 100%)",
          borderRadius: "16px",
          padding: "24px 28px",
          color: "#ffffff",
          marginBottom: "26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          boxShadow: "0 10px 25px rgba(48, 38, 111, 0.15)"
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cfc8ff", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "6px" }}>
            <ShieldCheck size={16} /> DEDICATED VERIFICATION TERMINAL
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "20px", color: "#ffffff" }}>
            Need to verify a specific candidate's certificate?
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#e1ddff", lineHeight: 1.6 }}>
            Use the verification portal to paste a reference UUID, scan a certificate QR code, or inspect cryptographic SHA-256 file hashes.
          </p>
        </div>

        <form onSubmit={handleQuickVerify} style={{ display: "flex", gap: "8px", flexWrap: "wrap", minWidth: "320px", flex: 1, maxWidth: "460px" }}>
          <div style={{ flex: 1, background: "#ffffff", borderRadius: "10px", display: "flex", alignItems: "center", padding: "0 12px", color: "var(--muted)" }}>
            <Search size={16} />
            <input
              style={{ border: 0, outline: 0, padding: "10px 8px", width: "100%", fontSize: "12px", color: "var(--text)" }}
              placeholder="Enter reference UUID or QR URL..."
              value={quickRef}
              onChange={e => setQuickRef(e.target.value)}
            />
          </div>
          <button className="primary-button" type="submit" style={{ background: "#ffffff", color: "var(--primary-dark)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            Verify <ArrowRight size={15} />
          </button>
        </form>
      </section>

      {/* Verified Candidates Directory Panel */}
      <section className="panel">
        <div className="panel-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>Verified Candidate Directory ({filteredCandidates.length})</h2>
            <p>Accredited academic records matching official university issuer records.</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Filter Tabs by Institution */}
            {universities.length > 1 && (
              <div className="filter-tabs">
                <button
                  type="button"
                  className={`filter-tab ${selectedInst === "all" ? "active" : ""}`}
                  onClick={() => setSelectedInst("all")}
                >
                  All ({candidates.length})
                </button>
                {universities.map(u => (
                  <button
                    key={u}
                    type="button"
                    className={`filter-tab ${selectedInst === u ? "active" : ""}`}
                    onClick={() => setSelectedInst(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8f9ff", border: "1px solid #e2e1f4", borderRadius: "8px", padding: "6px 12px" }}>
              <Search size={14} color="var(--muted)" />
              <input
                type="text"
                placeholder="Search candidates or roll no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 0, background: "transparent", outline: 0, fontSize: "11px", width: "180px", color: "var(--text)" }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="state-message">Loading candidate directory...</p>
        ) : filteredCandidates.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={36} />
            <h3>No verified candidates match your search</h3>
            <p>Try clearing your search query or verify a new certificate submission.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll / Reg No</th>
                  <th>Degree / Program</th>
                  <th>Institution</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.student_name || "—"}</strong></td>
                    <td><span className="mono-badge">{c.registration_number}</span></td>
                    <td>{c.degree}</td>
                    <td>{c.university_name}</td>
                    <td>
                      {c.marks ? (
                        <span className="status-pill success" style={{ padding: "2px 8px", fontSize: "10px" }}>
                          {c.marks}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className="status-pill success">
                        <CheckCircle2 size={12} style={{ marginRight: "4px" }} /> Text + Doc Verified
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => navigate(`/verify?ref=${encodeURIComponent(c.reference)}`)}
                        title="Inspect verification details in Verification Portal"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700 }}
                      >
                        <ExternalLink size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trust & Compliance Overview */}
      <div className="info-cards">
        <div className="info-card">
          <Building2 size={24} />
          <h3>Official Issuer Cross-Check</h3>
          <p>
            Candidate records are verified against authorized university officer registries, preventing fake degrees or forged credentials.
          </p>
        </div>
        <div className="info-card">
          <Fingerprint size={24} />
          <h3>Cryptographic SHA-256 Checksum</h3>
          <p>
            Every uploaded transcript and degree certificate receives an immutable SHA-256 cryptographic digest to detect any document alteration.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
