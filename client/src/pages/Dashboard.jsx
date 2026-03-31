import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setModels);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <Link to="/" className="logo">Shortcut AI</Link>
        <div className="topbar-right">
          <span className="topbar-user">
            {auth.user.name}
          </span>
          <button className="topbar-link" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Your Models</h1>
          <p className="subtitle">View, analyze, and share financial models with your team.</p>
        </div>

        <div className="models-grid">
          {models.map((model) => (
            <Link to={`/model/${model.id}`} key={model.id} className="model-card-link">
              <div className="model-grid-card">
                <div className="model-card-header">
                  <span className="model-type-badge small">Financial Model</span>
                </div>
                <h3>{model.name}</h3>
                <p className="model-card-summary">{model.summary}</p>
                <div className="model-card-metrics">
                  {model.outputs.slice(0, 2).map((o, i) => (
                    <span key={i} className="mini-metric">
                      <strong>{o.label}:</strong> {o.value}
                    </span>
                  ))}
                </div>
                <div className="model-card-footer">
                  <span className="creator-pill small">
                    <span className="creator-avatar small">{model.creator[0]}</span>
                    {model.creator}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer className="landing-footer">
        Built with <strong>Shortcut AI</strong>
      </footer>
    </div>
  );
}
