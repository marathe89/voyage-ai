import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { NavIcon } from "./icons";
import { useAuth } from "./auth";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocationValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const result = signup({ name, email, password, phone, location });
    if (!result.ok) {
      setError(result.error ?? "Could not create your account.");
      return;
    }
    navigate("/profile", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-icon"><NavIcon.sparkle /></span>
        <h1>Create your account</h1>
        <p className="auth-sub">Personalize every trip VoyageAI plans for you.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Full name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Amit Sharma" required />
          </label>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
          </label>
          <div className="auth-form-grid">
            <label>Phone <span className="auth-optional">(optional)</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98200 34512" />
            </label>
            <label>Location <span className="auth-optional">(optional)</span>
              <input value={location} onChange={(e) => setLocationValue(e.target.value)} placeholder="Mumbai, India" />
            </label>
          </div>
          {error && <p className="auth-error"><NavIcon.info /> {error}</p>}
          <button type="submit" className="dash-btn-primary auth-submit">Create Account</button>
        </form>

        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
