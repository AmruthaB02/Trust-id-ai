import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UploadCloud, ShieldCheck, ArrowLeft, ExternalLink, FileText } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api, { getErrorMessage } from "../services/api";

export default function CertificateUpload({ user }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    student_name: user?.full_name || "",
    registration_number: "",
    degree: "",
    university_name: user?.university_name || "",
    marks: "",
    graduation_year: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function choose(e) {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(f.type)) {
      setError("Choose a PDF, JPG or PNG file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be 10 MB or smaller.");
      return;
    }
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData();
    data.append("file", file);
    Object.entries(form).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        data.append(k, v);
      }
    });
    try {
      const r = await api.post("/certificates/", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(r.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="page-heading">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <span className="eyebrow">STUDENT MODULE</span>
        <h1>Upload educational certificate</h1>
        <p>Submit a document and its details for the demonstration comparison workflow.</p>
      </div>

      {result ? (
        <section className="panel result-panel">
          <ShieldCheck size={42} className={result.status === "verified_demo" ? "success-icon" : "danger-icon"} />
          <h2>Submission Received</h2>
          <p>
            Status: <span className={`status-pill ${result.status === "verified_demo" ? "success" : "danger"}`}>{result.status}</span>
          </p>
          <p>{result.review_note}</p>
          <p>
            Certificate SHA-256 hash: <code>{result.certificate_hash}</code>
          </p>
          {result.marks && (
            <p>
              Marks / Grade recorded: <strong>{result.marks}</strong>
            </p>
          )}
          {result.verification_url && (
            <p>
              Public Verification:{" "}
              <Link to={`/verify/${result.reference}`} className="table-link">
                View Verification Result <ExternalLink size={14} />
              </Link>
            </p>
          )}
          {result.file_url && (
            <p>
              Uploaded Document:{" "}
              <a href={result.file_url} target="_blank" rel="noopener noreferrer" className="table-link">
                <FileText size={14} /> Open Document
              </a>
            </p>
          )}
          {result.qr_code_url && (
            <div>
              <p>Scan to verify:</p>
              <img className="qr-image" src={result.qr_code_url} alt="Certificate verification QR code" />
            </div>
          )}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="primary-button" onClick={() => navigate("/dashboard")}>
              Return to dashboard
            </button>
            <button className="secondary-button" onClick={() => { setResult(null); setFile(null); }}>
              Submit another
            </button>
          </div>
        </section>
      ) : (
        <div className="upload-grid">
          <section className="panel">
            <form className="form-stack" onSubmit={submit}>
              <div className="form-field">
                <label>Certificate file *</label>
                <label className="file-drop">
                  <UploadCloud size={32} />
                  <strong>{file ? file.name : "Choose certificate file"}</strong>
                  <span>PDF, JPG or PNG · Maximum 10 MB</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={choose} />
                </label>
              </div>
              <div className="form-field">
                <label>Student full name *</label>
                <input
                  name="student_name"
                  type="text"
                  value={form.student_name}
                  onChange={change}
                  required
                />
              </div>
              <div className="form-field">
                <label>Registration number *</label>
                <input
                  name="registration_number"
                  type="text"
                  value={form.registration_number}
                  onChange={change}
                  required
                />
              </div>
              <div className="form-field">
                <label>Degree / qualification *</label>
                <input
                  name="degree"
                  type="text"
                  value={form.degree}
                  onChange={change}
                  required
                />
              </div>
              <div className="form-field">
                <label>University / institution *</label>
                <input
                  name="university_name"
                  type="text"
                  value={form.university_name}
                  onChange={change}
                  required
                />
              </div>
              <div className="form-field">
                <label>Marks / Grade / CGPA (optional)</label>
                <input
                  name="marks"
                  type="text"
                  value={form.marks}
                  onChange={change}
                  placeholder="e.g. 8.8 CGPA, 85%, or Distinction"
                />
              </div>
              <div className="form-field">
                <label>Graduation year *</label>
                <input
                  name="graduation_year"
                  type="number"
                  value={form.graduation_year}
                  onChange={change}
                  placeholder="e.g. 2024"
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button className="primary-button full-button" disabled={busy || !file}>
                {busy ? "Submitting..." : "Submit for verification"}
              </button>
            </form>
          </section>
          <aside className="panel upload-info">
            <div className="info-icon"><ShieldCheck /></div>
            <h2>Demonstration workflow</h2>
            <ol className="process-list">
              <li><strong>Certificate upload</strong><span>File and entered metadata are saved.</span></li>
              <li><strong>Issuer record comparison</strong><span>Metadata is compared with records registered by a university administrator.</span></li>
              <li><strong>SHA-256 hash</strong><span>A file hash is calculated for integrity reference.</span></li>
              <li><strong>QR verification</strong><span>A QR code is created for matching demo records.</span></li>
            </ol>
            <div className="privacy-note">
              OCR, CNN/anomaly analysis and blockchain submission are integration points and are not active in this local demo.
            </div>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
