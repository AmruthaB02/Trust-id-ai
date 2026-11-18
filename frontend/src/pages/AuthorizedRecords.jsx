import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, Edit3, Search, X, CheckCircle2, AlertCircle, FileText, UploadCloud, ExternalLink } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api, { getList, getErrorMessage } from "../services/api";

export default function AuthorizedRecords({ user }) {
  const defaultUni = user?.university_name || "";
  const blankForm = {
    student_name: "",
    registration_number: "",
    degree: "",
    university_name: defaultUni,
    marks: "",
    graduation_year: ""
  };

  const [form, setForm] = useState(blankForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await api.get("/institutions/authorized-certificates/");
      setRecords(getList(r.data));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      student_name: record.student_name,
      registration_number: record.registration_number,
      degree: record.degree,
      university_name: record.university_name,
      marks: record.marks || "",
      graduation_year: record.graduation_year
    });
    setFile(null);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setFile(null);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const data = new FormData();
    data.append("student_name", form.student_name);
    data.append("registration_number", form.registration_number);
    data.append("degree", form.degree);
    data.append("university_name", form.university_name);
    data.append("graduation_year", form.graduation_year);
    if (form.marks) {
      data.append("marks", form.marks);
    }
    if (file) {
      data.append("certificate_file", file);
    }

    try {
      if (editingId) {
        await api.patch(`/institutions/authorized-certificates/${editingId}/`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage(`Authorized record for ${form.student_name} (${form.registration_number}) updated successfully.`);
        setEditingId(null);
      } else {
        await api.post("/institutions/authorized-certificates/", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage(`New authorized record for ${form.student_name} registered successfully with document hash.`);
      }
      setForm(blankForm);
      setFile(null);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord(id, regNum) {
    if (!window.confirm(`Are you sure you want to delete the authorized record for '${regNum}'?`)) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.delete(`/institutions/authorized-certificates/${id}/`);
      setMessage(`Authorized record '${regNum}' deleted.`);
      if (editingId === id) {
        cancelEdit();
      }
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    return (
      r.student_name.toLowerCase().includes(q) ||
      r.registration_number.toLowerCase().includes(q) ||
      r.degree.toLowerCase().includes(q) ||
      r.university_name.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout user={user}>
      <div className="page-heading">
        <span className="eyebrow">ISSUER REGISTRY MODULE</span>
        <h1>Authorized certificate records</h1>
        <p>Register official student records and upload master certificate documents (PDF or Image) for dual-layer text + image verification.</p>
      </div>

      <div className="upload-grid">
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ margin: 0 }}>
              {editingId ? `Edit Record #${editingId}` : "Register official record & document"}
            </h2>
            {editingId && (
              <button className="text-button" onClick={cancelEdit}>
                <X size={15} /> Cancel edit
              </button>
            )}
          </div>

          <form className="form-stack" onSubmit={submit}>
            <div className="form-field">
              <label>Student full name *</label>
              <input
                name="student_name"
                type="text"
                value={form.student_name}
                onChange={change}
                required
                placeholder="e.g. Alex Mercer"
              />
            </div>

            <div className="form-field">
              <label>Registration / Roll number *</label>
              <input
                name="registration_number"
                type="text"
                value={form.registration_number}
                onChange={change}
                required
                placeholder="e.g. NTU2024CS001"
              />
            </div>

            <div className="form-field">
              <label>Degree / Qualification *</label>
              <input
                name="degree"
                type="text"
                value={form.degree}
                onChange={change}
                required
                placeholder="e.g. B.Tech Computer Science"
              />
            </div>

            <div className="form-field">
              <label>University / Institution name *</label>
              <input
                name="university_name"
                type="text"
                value={form.university_name}
                onChange={change}
                required
                placeholder="e.g. National Tech University"
              />
            </div>

            <div className="form-field">
              <label>Marks / Grade / CGPA (optional)</label>
              <input
                name="marks"
                type="text"
                value={form.marks}
                onChange={change}
                placeholder="e.g. 9.4 CGPA or 88%"
              />
            </div>

            <div className="form-field">
              <label>Graduation year *</label>
              <input
                name="graduation_year"
                type="number"
                value={form.graduation_year}
                onChange={change}
                required
                placeholder="e.g. 2024"
              />
            </div>

            {/* Official Master Certificate Upload */}
            <div className="form-field">
              <label>Master Certificate Document (PDF or Image, Optional)</label>
              <div style={{ border: "1px dashed #c9c4ef", borderRadius: "10px", padding: "14px", background: "#fcfcff", textAlign: "center" }}>
                <input
                  type="file"
                  id="master_cert_file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                />
                <label htmlFor="master_cert_file" style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <UploadCloud size={24} color="var(--primary)" />
                  <strong style={{ fontSize: "11px", color: "var(--text)" }}>
                    {file ? file.name : "Attach Master Certificate File (PDF / PNG / JPG)"}
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                    {file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Allows 100% cryptographic SHA-256 and visual pixel comparison"}
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {error}
              </div>
            )}
            {message && (
              <div className="success-message">
                <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {message}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="primary-button" disabled={busy} style={{ flex: 1 }}>
                {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
                {busy ? "Saving..." : editingId ? "Update Record" : "Register Record"}
              </button>
              {editingId && (
                <button type="button" className="secondary-button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Registered records ({records.length})</h2>
              <p>Official records with metadata & master document hashes.</p>
            </div>
            <button className="text-button" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div className="search-input" style={{ border: "1px solid var(--border)" }}>
              <Search size={16} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by student, roll no, degree..."
                style={{ height: "38px" }}
              />
            </div>
          </div>

          {loading ? (
            <p className="state-message">Loading authorized records...</p>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              {search ? "No records matched your search." : "No authorized records registered yet. Fill in the form to add one."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px", maxHeight: "650px", overflowY: "auto", paddingRight: "4px" }}>
              {filteredRecords.map(r => (
                <div
                  key={r.id}
                  className="record-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    background: editingId === r.id ? "#f5f3ff" : "transparent",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid " + (editingId === r.id ? "var(--primary)" : "#f0eff7")
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "14px", color: "var(--text)" }}>{r.student_name}</strong>
                    <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>
                      {r.registration_number}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      {r.degree} · Graduated: {r.graduation_year}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "3px" }}>
                      {r.university_name}
                      {r.marks && (
                        <span
                          className="status-pill success"
                          style={{ marginLeft: "8px", padding: "2px 8px", fontSize: "9px" }}
                        >
                          Grade: {r.marks}
                        </span>
                      )}
                    </div>

                    {/* Master Document Link & Hash */}
                    {r.certificate_file_url ? (
                      <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <a
                          href={r.certificate_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-link"
                          style={{ fontSize: "10px", fontWeight: 700 }}
                        >
                          <FileText size={12} /> Master Document
                        </a>
                        {r.certificate_hash && (
                          <span className="mono-badge" style={{ fontSize: "9px" }} title={r.certificate_hash}>
                            SHA-256: {r.certificate_hash.slice(0, 10)}...
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: "4px", fontSize: "10px", color: "#a5a7be" }}>
                        No master document attached (metadata matching only)
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "6px", marginLeft: "10px" }}>
                    <button
                      className="text-button"
                      onClick={() => startEdit(r)}
                      title="Edit this record"
                      style={{ padding: "6px 8px", borderRadius: "6px", background: "#eeecff" }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => deleteRecord(r.id, r.registration_number)}
                      title="Delete this record"
                      style={{ padding: "6px 8px", borderRadius: "6px", background: "#fff0f2", color: "var(--danger)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
