import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  ArrowLeft
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    university_name: "",
    company_name: "",
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        full_name: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        university_name: user.university_name || "",
        company_name: user.company_name || ""
      }));
    }
  }, [user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (form.new_password) {
      if (form.new_password !== form.confirm_password) {
        setError("New password and confirm password do not match.");
        setLoading(false);
        return;
      }
      if (!form.current_password) {
        setError("Please enter your current password to set a new password.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      university_name: form.university_name.trim(),
      company_name: form.company_name.trim()
    };

    if (form.new_password) {
      payload.current_password = form.current_password;
      payload.new_password = form.new_password;
    }

    try {
      const res = await api.put("/auth/profile/", payload);
      updateUser(res.data);
      setSuccess("Profile details updated successfully!");
      setForm(prev => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: ""
      }));
      setShowPasswordSection(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const roleLabel =
    user?.role === "university_admin"
      ? "University Administrator"
      : user?.role === "employer"
      ? "Employer Verifier"
      : "Student";

  const initial = (user?.full_name || user?.username || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <DashboardLayout user={user}>
      <div className="page-heading">
        <span className="eyebrow">ACCOUNT SETTINGS</span>
        <h1>User Profile & Identity</h1>
        <p>View and update your personal identity, login username, contact email, and organization details.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.65fr)", gap: "24px", alignItems: "start" }}>
        {/* Form Panel */}
        <section className="panel">
          <div className="panel-heading" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "14px" }}>
            <div>
              <h2 style={{ margin: 0 }}>Edit Account Information</h2>
              <p style={{ margin: "4px 0 0" }}>Update your display credentials and organization metadata.</p>
            </div>
            <span className="status-pill success">{roleLabel}</span>
          </div>

          <form className="form-stack" onSubmit={handleSubmit} style={{ marginTop: "18px" }}>
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="e.g. Alex Mercer"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-field">
                <label>Login Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. admin or student"
                  required
                />
              </div>

              <div className="form-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. user@example.com"
                  required
                />
              </div>
            </div>

            {user?.role === "employer" ? (
              <div className="form-field">
                <label>Company / Organization Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Apex Verification Technologies"
                />
              </div>
            ) : (
              <div className="form-field">
                <label>University / Institution Name</label>
                <input
                  type="text"
                  name="university_name"
                  value={form.university_name}
                  onChange={handleChange}
                  placeholder="e.g. National Tech University"
                />
              </div>
            )}

            {/* Optional Change Password Section */}
            <div style={{ marginTop: "10px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <button
                type="button"
                className="text-button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <KeyRound size={15} />
                {showPasswordSection ? "Hide Password Change" : "Change Account Password"}
              </button>

              {showPasswordSection && (
                <div style={{ marginTop: "14px", display: "grid", gap: "12px", background: "#fcfcff", border: "1px solid var(--border)", padding: "16px", borderRadius: "10px" }}>
                  <div className="form-field">
                    <label>Current Password *</label>
                    <input
                      type="password"
                      name="current_password"
                      value={form.current_password}
                      onChange={handleChange}
                      placeholder="Enter existing password"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-field">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="new_password"
                        value={form.new_password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="form-field">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={form.confirm_password}
                        onChange={handleChange}
                        placeholder="Re-type new password"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {success}
              </div>
            )}

            <div style={{ marginTop: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
              <button className="primary-button" type="submit" disabled={loading} style={{ minWidth: "150px" }}>
                <Save size={15} /> {loading ? "Saving Details..." : "Save Profile Details"}
              </button>
              <Link to="/dashboard" className="text-button" style={{ textDecoration: "none" }}>
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
            </div>
          </form>
        </section>

        {/* Identity Overview Sidebar Card */}
        <section className="panel" style={{ textAlign: "center", padding: "26px 20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: "26px",
              fontWeight: 800,
              margin: "0 auto 16px",
              boxShadow: "0 8px 20px rgba(98, 84, 217, 0.25)"
            }}
          >
            {initial}
          </div>

          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>
            {user?.full_name || user?.username || "Account Holder"}
          </h2>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            @{user?.username || "user"}
          </span>

          <div style={{ marginTop: "10px" }}>
            <span className="status-pill success">{roleLabel}</span>
          </div>

          <div style={{ margin: "20px 0", borderTop: "1px solid var(--border)", paddingTop: "16px", textAlign: "left", fontSize: "11px", display: "grid", gap: "10px" }}>
            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Primary Email</span>
              <strong style={{ fontSize: "12px", color: "var(--text)" }}>{user?.email}</strong>
            </div>

            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Affiliated Organization</span>
              <strong style={{ fontSize: "12px", color: "var(--text)" }}>
                {user?.university_name || user?.company_name || "Independent"}
              </strong>
            </div>

            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Authentication Security</span>
              <span className="mono-badge" style={{ fontSize: "10px", marginTop: "2px", display: "inline-block" }}>
                JWT Bearer Active · Role Verified
              </span>
            </div>
          </div>

          <div className="security-note" style={{ textAlign: "left", background: "#f8f9ff", border: "1px solid #e1deef", color: "var(--text)" }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <div>
              <strong style={{ fontSize: "11px", color: "var(--text)" }}>Encrypted Session</strong>
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                Your identity is secured with password hashing & JSON Web Tokens.
              </span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
