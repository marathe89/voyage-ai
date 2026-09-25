import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { NavIcon } from "./icons";
import { useAuth } from "./auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("arjun.mehta@email.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? "Could not sign in.");
      return;
    }
    const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
    navigate(from, { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-icon"><NavIcon.sparkle /></span>
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to continue planning with VoyageAI.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          {error && <p className="auth-error"><NavIcon.info /> {error}</p>}
          <button type="submit" className="dash-btn-primary auth-submit">Log In</button>
        </form>

        <p className="auth-hint">Demo account: <strong>arjun.mehta@email.com</strong> / <strong>voyage123</strong><br />Admin demo: <strong>admin@voyageai.com</strong> / <strong>admin123</strong></p>
        <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
        <Link to="/" className="auth-guest">Continue browsing as guest →</Link>
      </div>
    </div>
  );
}
