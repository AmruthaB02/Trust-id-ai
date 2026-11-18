import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Fingerprint, LockKeyhole, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function quickFill(userEmail, userPass) {
    setEmail(userEmail);
    setPassword(userPass);
    setError("");
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ShieldCheck size={30} />
          <span>TrustID AI</span>
        </div>
        <div className="auth-pitch">
          <span className="eyebrow">TRUSTED DIGITAL CREDENTIALS</span>
          <h1>Verify what<br />matters.</h1>
          <p>
            An institution-backed cryptographic platform for educational certificate verification, authorized issuer records, and transparent credential validation.
          </p>
          <div className="auth-feature">
            <Fingerprint size={22} />
            <span>SHA-256 cryptographic document verification & instant QR authentication</span>
          </div>
        </div>
        <small>TRUST · TRANSPARENCY · CRYPTOGRAPHIC INTEGRITY</small>
      </section>

      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-mobile-brand">
            <ShieldCheck /> TrustID AI
          </div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="auth-subtitle">Enter your credentials or choose a demo role below.</p>

          <label>Email address or username</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com or username"
            autoComplete="username"
            required
          />

          <label>Password</label>
          <div className="password-wrap">
            <LockKeyhole size={17} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="primary-button auth-submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in securely"}
          </button>

          <div className="demo-credentials-card">
            <div className="demo-cred-header">
              <UserCheck size={14} />
              <span>One-Click Demo Accounts</span>
            </div>
            <div className="demo-cred-buttons">
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => quickFill("admin@gmail.com", "admin123")}
              >
                <strong>Admin</strong>
                <small>admin@gmail.com</small>
              </button>
              <button
                type="button"
                className="demo-btn student"
                onClick={() => quickFill("student@example.com", "student123")}
              >
                <strong>Student</strong>
                <small>student@example.com</small>
              </button>
              <button
                type="button"
                className="demo-btn employer"
                onClick={() => quickFill("employer@example.com", "employer123")}
              >
                <strong>Employer</strong>
                <small>employer@example.com</small>
              </button>
            </div>
          </div>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
