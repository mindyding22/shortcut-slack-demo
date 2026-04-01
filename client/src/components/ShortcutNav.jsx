import { Link } from "react-router-dom";
import { useAuth } from "../App";

export default function ShortcutNav() {
  const { auth, logout } = useAuth();

  return (
    <nav className="sc-nav">
      <div className="sc-nav-inner">
        <div className="sc-nav-left">
          <Link to="/" className="sc-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="4" fill="#16A34A"/>
              <path d="M8 12L16 8L24 12L16 16L8 12Z" fill="white" opacity="0.9"/>
              <path d="M8 16L16 20L24 16" stroke="white" strokeWidth="2" fill="none" opacity="0.7"/>
              <path d="M8 20L16 24L24 20" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
            </svg>
          </Link>
          <div className="sc-nav-links">
            <span className="sc-nav-link">Pricing</span>
            <span className="sc-nav-link">Tutorials</span>
            <span className="sc-nav-link">Case Studies</span>
            <span className="sc-nav-link">Enterprise</span>
            <span className="sc-nav-link">Templates</span>
          </div>
        </div>
        <div className="sc-nav-right">
          {auth ? (
            <>
              <Link to="/dashboard" className="sc-nav-link">My Models</Link>
              <span className="sc-nav-user">{auth.user.name}</span>
              <button className="sc-btn-login" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/signup" className="sc-btn-login">Log In</Link>
              <Link to="/signup" className="sc-btn-primary">Try for Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
