import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import ShortcutNav from "../components/ShortcutNav";

export default function Dashboard() {
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setModels);
  }, []);

  return (
    <div className="sc-page">
      <ShortcutNav />

      <div className="sc-dashboard">
        <div className="sc-dashboard-header">
          <h1 className="sc-section-title">Your Models</h1>
          <p className="sc-section-desc">View, analyze, and share financial models with your team.</p>
        </div>

        <div className="sc-models-grid">
          {models.map((model) => (
            <Link to={`/model/${model.id}`} key={model.id} className="sc-model-card-link">
              <div className="sc-model-card">
                <div className="sc-badge small">Financial Model</div>
                <h3 className="sc-card-title">{model.name}</h3>
                <p className="sc-card-summary">{model.summary}</p>
                <div className="sc-card-metrics">
                  {model.outputs.slice(0, 2).map((o, i) => (
                    <span key={i} className="sc-card-metric">
                      <strong>{o.label}:</strong> {o.value}
                    </span>
                  ))}
                </div>
                <div className="sc-card-footer">
                  <span className="sc-creator small">
                    <span className="sc-creator-avatar small">{model.creator[0]}</span>
                    {model.creator}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
