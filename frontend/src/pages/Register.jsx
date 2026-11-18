import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "student",
    university_name: "",
    company_name: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ShieldCheck size={30} />
          <span>TrustID AI</span>
        </div>
        <div className="auth-pitch">
          <span className="eyebrow">JOIN THE TRUST NETWORK</span>
          <h1>Your credentials.<br />Your trust.</h1>
          <p>Submit educational credentials and make verification easier for institutions and employers.</p>
        </div>
        <small>TRUST · TRANSPARENCY · TECHNOLOGY</small>
      </section>
      <section className="auth-form-panel">
        <form className="auth-card register-card" onSubmit={submit}>
          <div className="auth-mobile-brand"><ShieldCheck /> TrustID AI</div>
          <span className="eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="auth-subtitle">Register as a student or employer.</p>

          <label>Full name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={change}
            required
            placeholder="Your full name"
          />

          <label>Username</label>
          <input
            name="username"
            value={form.username}
            onChange={change}
            required
            placeholder="Choose a username"
            autoComplete="username"
          />

          <label>Email address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label>Account type</label>
          <select name="role" value={form.role} onChange={change}>
            <option value="student">Student</option>
            <option value="employer">Employer</option>
          </select>

          {form.role === "student" && (
            <>
              <label>University / Institution</label>
              <input
                name="university_name"
                value={form.university_name}
                onChange={change}
                placeholder="Your institution"
              />
            </>
          )}

          {form.role === "employer" && (
            <>
              <label>Company name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={change}
                placeholder="Your company"
              />
            </>
          )}

          <label>Password (minimum 8 characters)</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={change}
            required
            minLength="8"
            autoComplete="new-password"
          />

          <label>Confirm password</label>
          <input
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={change}
            required
            minLength="8"
            autoComplete="new-password"
          />

          {error && <div className="error-message">{error}</div>}

          <button className="primary-button auth-submit" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
