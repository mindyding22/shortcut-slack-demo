import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import ShortcutNav from "../components/ShortcutNav";

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
    <div className="sc-page">
      <ShortcutNav />

      <div className="sc-auth-container">
        <h1 className="sc-auth-title">{isLogin ? "Welcome back" : "Create your free account"}</h1>
        <p className="sc-auth-desc">
          {isLogin
            ? "Sign in to access your financial models"
            : "View full models, build your own, and share with your team"}
        </p>

        <form onSubmit={handleSubmit} className="sc-auth-form">
          {!isLogin && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            required
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="sc-cta-button" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up free"}
          </button>
        </form>

        {error && <p className="sc-error">{error}</p>}

        <p className="sc-auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="sc-toggle-link"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
