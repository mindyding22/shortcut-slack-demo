import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../App";

export default function ModelPreview() {
  const { id } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const headers = {};
    if (auth?.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }
    fetch(`/api/models/${id}`, { headers })
      .then((r) => {
        if (!r.ok) throw new Error("Model not found");
        return r.json();
      })
      .then(setModel)
      .catch((e) => setError(e.message));
  }, [id, auth]);

  if (error) {
    return (
      <div className="landing-page">
        <header className="landing-topbar">
          <span className="logo">Shortcut AI</span>
        </header>
        <div className="landing-container">
          <div className="error-state">
            <h1>Model not found</h1>
            <p>This model may have been removed or the link is invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="landing-page">
        <header className="landing-topbar">
          <span className="logo">Shortcut AI</span>
        </header>
        <div className="landing-container">
          <p className="loading">Loading model...</p>
        </div>
      </div>
    );
  }

  const isFullAccess = auth && model.table && !model.table.totalRows;

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <Link to="/" className="logo">Shortcut AI</Link>
        {auth ? (
          <Link to="/dashboard" className="topbar-link">My Dashboard</Link>
        ) : null}
      </header>

      <div className="landing-container">
        <div className="model-header">
          <div className="model-type-badge">Financial Model</div>
          <h1>{model.name}</h1>
          <p className="model-meta">
            <span className="creator-pill">
              <span className="creator-avatar">{model.creator[0]}</span>
              {model.creator}
            </span>
          </p>
          <p className="model-summary">{model.summary}</p>
        </div>

        <div className="metrics-grid">
          {model.outputs.map((o, i) => (
            <div key={i} className="metric-card">
              <div className="metric-label">{o.label}</div>
              <div className="metric-value">{o.value}</div>
            </div>
          ))}
        </div>

        {model.table && (
          <div className="table-section">
            <div className={isFullAccess ? "table-wrap" : "table-wrap table-blurred"}>
              <table className="data-table">
                <thead>
                  <tr>
                    {model.table.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className={j === 0 ? "row-label" : ""}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isFullAccess && (
                <div className="table-overlay">
                  <div className="lock-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <p className="lock-text">
                    {model.table.totalRows - model.table.rows.length} more rows hidden
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!auth && (
          <div className="signup-cta-section">
            <button
              className="cta-button"
              onClick={() => navigate(`/signup?redirect=/model/${id}`)}
            >
              Sign up free to view the full model
            </button>
            <p className="cta-sub">
              Built with <strong>Shortcut AI</strong> — AI-powered financial modeling
            </p>
          </div>
        )}

        {isFullAccess && (
          <div className="share-section">
            <ShareButton modelId={id} modelName={model.name} />
          </div>
        )}
      </div>

      <footer className="landing-footer">
        Built with <strong>Shortcut AI</strong>
      </footer>
    </div>
  );
}

function ShareButton({ modelId, modelName }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/model/${modelId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="share-bar">
      <span className="share-label">Share this model</span>
      <div className="share-actions">
        <button className="share-copy-btn" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
