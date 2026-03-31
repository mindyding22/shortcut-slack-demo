import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../App";

export default function Signup() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/login" : "/api/signup";
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        login(data.token, data.user);
        navigate(redirect);
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <Link to="/" className="logo">Shortcut AI</Link>
      </header>

      <div className="auth-container">
        <h1>{isLogin ? "Welcome back" : "Create your free account"}</h1>
        <p className="subtitle">
          {isLogin
            ? "Sign in to access your financial models"
            : "View full models, build your own, and share with your team"}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="cta-button" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign in"
                : "Sign up free"}
          </button>
        </form>

        {error && <p className="status error">{error}</p>}

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="toggle-link"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

        <p className="cta-sub">
          Built with <strong>Shortcut AI</strong> — AI-powered financial modeling
        </p>
      </div>
    </div>
  );
}
