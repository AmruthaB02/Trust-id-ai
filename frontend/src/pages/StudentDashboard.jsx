import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileCheck2,
  Clock3,
  AlertTriangle,
  RefreshCw,
  FileText,
  ExternalLink,
  CheckCircle2,
  Search,
  Filter
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api, { getList, getErrorMessage } from "../services/api";

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await api.get("/certificates/");
      setItems(getList(r.data));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const verified = items.filter(x => x.status === "verified_demo").length;
  const pending = items.filter(x => x.status === "pending_review").length;
  const flagged = items.filter(x => x.status === "unverified").length;

  const filteredItems = items.filter(x => {
    if (filter === "verified" && x.status !== "verified_demo") return false;
    if (filter === "pending" && x.status !== "pending_review") return false;
    if (filter === "unverified" && x.status !== "unverified") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchReg = x.registration_number?.toLowerCase().includes(q);
      const matchDegree = x.degree?.toLowerCase().includes(q);
      const matchUni = x.university_name?.toLowerCase().includes(q);
      if (!matchReg && !matchDegree && !matchUni) return false;
    }
    return true;
  });

  return (
    <DashboardLayout user={user}>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">STUDENT CREDENTIAL PORTAL</span>
          <h1>Welcome, {user.full_name || user.username || "Student"}</h1>
          <p>Manage, track, and share your cryptographic educational certificates.</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/certificates/upload")}>
          <UploadCloud size={17} /> Upload certificate
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Total submissions" value={items.length} icon={FileCheck2} />
        <StatCard title="Verified matches" value={verified} icon={CheckCircle2} />
        <StatCard title="Pending review" value={pending} icon={Clock3} />
        <StatCard title="Unverified" value={flagged} icon={AlertTriangle} />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>My certificate submissions ({filteredItems.length})</h2>
            <p>Cryptographically verified credentials and real-time status.</p>
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
              All ({items.length})
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
              className={`filter-tab ${filter === "pending" ? "active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pending ({pending})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === "unverified" ? "active" : ""}`}
              onClick={() => setFilter("unverified")}
            >
              Unverified ({flagged})
            </button>
          </div>

          <div className="search-input" style={{ flex: 1, minWidth: "220px", border: "1px solid var(--border)" }}>
            <Search size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by roll number, degree, university..."
              style={{ height: "36px" }}
            />
          </div>
        </div>

        {loading ? (
          <p className="state-message">Loading submissions...</p>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <FileCheck2 size={38} />
            <h3>{items.length === 0 ? "No certificates submitted yet" : "No matching submissions found"}</h3>
            <p>
              {items.length === 0
                ? "Upload your educational credentials to start automated verification."
                : "Try clearing your search query or switching filter tabs."}
            </p>
            {items.length === 0 ? (
              <button className="primary-button" style={{ marginTop: "12px" }} onClick={() => navigate("/certificates/upload")}>
                Upload first certificate
              </button>
            ) : (
              <button className="secondary-button" style={{ marginTop: "12px" }} onClick={() => { setFilter("all"); setSearch(""); }}>
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Registration No</th>
                  <th>Degree / Program</th>
                  <th>Institution</th>
                  <th>Grade/Marks</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(x => (
                  <tr key={x.id}>
                    <td>
                      <strong>{x.registration_number}</strong>
                    </td>
                    <td>{x.degree}</td>
                    <td>{x.university_name}</td>
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
                    <td>{new Date(x.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {x.file_url && (
                          <a
                            href={x.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-link"
                            title="Open certificate document"
                          >
                            <FileText size={14} /> File
                          </a>
                        )}
                        <Link to={`/verify/${x.reference}`} className="table-link" title="Open public verification page">
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
