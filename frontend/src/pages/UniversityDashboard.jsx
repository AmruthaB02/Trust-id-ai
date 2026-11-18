import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  FileCheck2,
  AlertTriangle,
  Plus,
  RefreshCw,
  FileText,
  ExternalLink,
  CheckCircle2,
  Search,
  Clock3
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api, { getList, getErrorMessage } from "../services/api";

export default function UniversityDashboard({ user }) {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        api.get("/certificates/"),
        api.get("/institutions/authorized-certificates/")
      ]);
      setCerts(getList(a.data));
      setRecords(getList(b.data));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const verified = certs.filter(x => x.status === "verified_demo").length;
  const pending = certs.filter(x => x.status === "pending_review").length;
  const flagged = certs.filter(x => x.status === "unverified").length;

  const filteredCerts = certs.filter(x => {
    if (filter === "verified" && x.status !== "verified_demo") return false;
    if (filter === "pending" && x.status !== "pending_review") return false;
    if (filter === "unverified" && x.status !== "unverified") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = x.student_name?.toLowerCase().includes(q);
      const matchReg = x.registration_number?.toLowerCase().includes(q);
      const matchDegree = x.degree?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchDegree) return false;
    }
    return true;
  });

  return (
    <DashboardLayout user={user}>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">INSTITUTION PORTAL</span>
          <h1>{user.university_name || "University Administration"}</h1>
          <p>Manage official institutional certificate records and monitor credential authentications.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="primary-button" onClick={() => navigate("/university/records")}>
            <Plus size={16} /> Register record
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Official records" value={records.length} icon={Building2} />
        <StatCard title="Student submissions" value={certs.length} icon={FileCheck2} />
        <StatCard title="Verified demo matches" value={verified} icon={CheckCircle2} />
        <StatCard title="Flagged / Unverified" value={flagged} icon={AlertTriangle} />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Certificate submission activity ({filteredCerts.length})</h2>
            <p>Incoming student credential submissions matched against authorized university records.</p>
          </div>
          <button className="text-button" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>

        <div className="panel-toolbar" style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({certs.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === "verified" ? "active" : ""}`}
              onClick={() => setFilter("verified")}
            >
              Verified ({verified})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === "unverified" ? "active" : ""}`}
              onClick={() => setFilter("unverified")}
            >
              Unverified ({flagged})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === "pending" ? "active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pending ({pending})
            </button>
          </div>

          <div className="search-input" style={{ flex: 1, minWidth: "220px", border: "1px solid var(--border)" }}>
            <Search size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, roll no, degree..."
              style={{ height: "36px" }}
            />
          </div>
        </div>

        {loading ? (
          <p className="state-message">Loading records...</p>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredCerts.length === 0 ? (
          <div className="empty-state">
            <Building2 size={38} />
            <h3>{certs.length === 0 ? "No student submissions yet" : "No matching submissions found"}</h3>
            <p>
              {certs.length === 0
                ? "Submissions uploaded by students will automatically appear here for verification review."
                : "Try resetting your search query or switching tabs."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll / Reg Number</th>
                  <th>Degree / Qualification</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Review Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map(x => (
                  <tr key={x.id}>
                    <td><strong>{x.student_name || "—"}</strong></td>
                    <td><span className="mono-badge">{x.registration_number}</span></td>
                    <td>{x.degree}</td>
                    <td>
                      {x.marks ? (
                        <span className="status-pill success" style={{ padding: "2px 8px", fontSize: "10px" }}>
                          {x.marks}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${x.status === "verified_demo" ? "success" : x.status === "unverified" ? "danger" : "pending"}`}>
                        {x.status === "verified_demo" ? "Text + Doc Verified" : x.status === "unverified" ? "Unverified" : "Pending"}
                      </span>
                      {x.status === "verified_demo" && x.verification_score ? (
                        <div style={{ marginTop: "3px" }}>
                          <span className="mono-badge" style={{ fontSize: "9px", padding: "1px 5px" }}>
                            {x.verification_score}% Integrity
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td style={{ fontSize: "11px", color: "var(--muted)", maxWidth: "260px" }}>{x.review_note}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {x.file_url && (
                          <a
                            href={x.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-link"
                            title="Open submitted document"
                          >
                            <FileText size={14} /> Doc
                          </a>
                        )}
                        <Link to={`/verify/${x.reference}`} className="table-link" title="Open verification page">
                          <ExternalLink size={14} /> Verify
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
