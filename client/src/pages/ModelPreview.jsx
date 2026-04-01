import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import ShortcutNav from "../components/ShortcutNav";

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
      <div className="sc-page">
        <ShortcutNav />
        <div className="sc-content">
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
      <div className="sc-page">
        <ShortcutNav />
        <div className="sc-content">
          <p className="loading">Loading model...</p>
        </div>
      </div>
    );
  }

  const isFullAccess = auth && model.table && !model.table.totalRows;

  return (
    <div className="sc-page">
      <ShortcutNav />

      <div className="sc-content">
        <div className="sc-model-header">
          <div className="sc-badge">Shared Model</div>
          <h1 className="sc-model-title">{model.name}</h1>
          <div className="sc-model-meta">
            <span className="sc-creator">
              <span className="sc-creator-avatar">{model.creator[0]}</span>
              {model.creator}
            </span>
          </div>
          <p className="sc-model-summary">{model.summary}</p>
        </div>

        <div className="sc-metrics">
          {model.outputs.map((o, i) => (
            <div key={i} className="sc-metric-card">
              <div className="sc-metric-label">{o.label}</div>
              <div className="sc-metric-value">{o.value}</div>
            </div>
          ))}
        </div>

        {model.table && (
          <div className="sc-table-section">
            <div className={isFullAccess ? "sc-table-wrap" : "sc-table-wrap sc-table-blurred"}>
              <table className="sc-table">
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
                        <td key={j} className={j === 0 ? "sc-row-label" : ""}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isFullAccess && (
                <div className="sc-table-overlay">
                  <div className="sc-lock-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <p className="sc-lock-text">
                    {model.table.totalRows - model.table.rows.length} more rows hidden
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!auth && (
          <div className="sc-cta-section">
            <button
              className="sc-cta-button"
              onClick={() => navigate(`/signup?redirect=/model/${id}`)}
            >
              Sign up free to view the full model
            </button>
            <p className="sc-cta-sub">
              No credit card required. Free forever for individual use.
            </p>
          </div>
        )}

        {isFullAccess && (
          <ShareButton modelId={id} />
        )}
      </div>

      <footer className="sc-footer">
        <div className="sc-footer-inner">
          <span>© 2025 Shortcut AI. All rights reserved.</span>
          <span className="sc-footer-links">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Changelog</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

function ShareButton({ modelId }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/model/${modelId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="sc-share-bar">
      <span className="sc-share-label">Share this model with your team</span>
      <button className="sc-share-btn" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
