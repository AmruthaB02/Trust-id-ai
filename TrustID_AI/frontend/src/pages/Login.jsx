import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Fingerprint, LockKeyhole } from "lucide-react";
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
    event.preventDefault(); setError(""); setBusy(true);
    try { await login(email, password); navigate("/dashboard"); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand"><ShieldCheck size={30} /><span>TrustID AI</span></div>
        <div className="auth-pitch"><span className="eyebrow">TRUSTED DIGITAL CREDENTIALS</span><h1>Verify what<br/>matters.</h1><p>A unified platform for secure educational certificate verification, issuer records and transparent credential checks.</p><div className="auth-feature"><Fingerprint size={22}/><span>AI-assisted document screening and tamper detection workflow</span></div></div>
        <small>TRUST · TRANSPARENCY · TECHNOLOGY</small>
      </section>
      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-mobile-brand"><ShieldCheck/> TrustID AI</div>
          <span className="eyebrow">WELCOME BACK</span><h2>Sign in to your account</h2><p className="auth-subtitle">Enter your credentials to access your workspace.</p>
          <label>Email address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
          <label>Password</label><div className="password-wrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></div>
          {error && <div className="error-message">{error}</div>}
          <button className="primary-button auth-submit" disabled={busy}>{busy ? "Signing in..." : "Sign in securely"}</button>
          <p className="auth-switch">Don't have an account? <Link to="/register">Create account</Link></p>
        </form>
      </section>
    </div>
  );
}
