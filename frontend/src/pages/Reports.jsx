import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, BarChart3, CheckCircle2, Clock3, AlertTriangle, ExternalLink } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api, { getList, getErrorMessage } from "../services/api";

export default function Reports({ user }) {
  const [summary, setSummary] = useState({});
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        api.get("/reports/summary/"),
        api.get("/certificates/")
      ]);
      setSummary(a.data);
      setItems(getList(b.data));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout user={user}>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">REPORT MODULE</span>
          <h1>Verification analytics & reports</h1>
          <p>Summary of certificate submissions and verification metrics.</p>
        </div>
        <button className="text-button" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="state-message">Loading report data...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard title="Total certificates" value={summary.total_certificates ?? 0} icon={BarChart3} />
            <StatCard title="Verified demo matches" value={summary.verified ?? 0} icon={CheckCircle2} />
            <StatCard title="Pending review" value={summary.pending ?? 0} icon={Clock3} />
            <StatCard title="Unverified" value={summary.flagged ?? 0} icon={AlertTriangle} />
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Certificate submission activity</h2>
                <p>Auditable event logs and submission timestamps.</p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">No certificate activity available yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Registration</th>
                      <th>Degree</th>
                      <th>Marks</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(x => (
                      <tr key={x.id}>
                        <td><strong>{x.student_name || "—"}</strong></td>
                        <td>{x.registration_number}</td>
                        <td>{x.degree}</td>
                        <td>{x.marks || "—"}</td>
                        <td>
                          <span className={`status-pill ${x.status === "verified_demo" ? "success" : x.status === "unverified" ? "danger" : "pending"}`}>
                            {x.status}
                          </span>
                        </td>
                        <td>{new Date(x.created_at).toLocaleDateString()}</td>
                        <td>
                          <Link to={`/verify/${x.reference}`} className="table-link">
                            <ExternalLink size={14} /> Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
