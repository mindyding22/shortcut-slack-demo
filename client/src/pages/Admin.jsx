import { useState } from "react";
import { Link } from "react-router-dom";

const SAMPLE_MODELS = [
  {
    name: "Tesla DCF Analysis",
    outputs: [
      { label: "Implied Share Price", value: "$287" },
      { label: "WACC", value: "9.4%" },
      { label: "Terminal Growth Rate", value: "2.5%" },
    ],
  },
  {
    name: "Apple LBO Model",
    outputs: [
      { label: "IRR", value: "18.3%" },
      { label: "MOIC", value: "2.4x" },
      { label: "Exit EV/EBITDA", value: "14.2x" },
    ],
  },
  {
    name: "Microsoft Comps Analysis",
    outputs: [
      { label: "Implied EV/Revenue", value: "11.8x" },
      { label: "Implied P/E", value: "32.5x" },
      { label: "Median Premium", value: "15%" },
    ],
  },
];

const SAMPLE_LINKS = [
  "https://shortcut.ai/share/a2a7d1d5-b23b-40a8-afd3-ce0c19a78322",
  "https://shortcut.ai/share/0b7df665-e24d-40c2-a7fd-c1558e30855b",
  "https://shortcut.ai/share/c3d4e5f6-a1b2-4c3d-8e9f-0a1b2c3d4e5f",
];

/* ─── Slack-like message components ─── */

function SlackBotMessage({ children }) {
  return (
    <div className="slack-msg">
      <div className="slack-msg-avatar-col">
        <div className="slack-bot-avatar">
          <span className="slack-bot-avatar-icon">⚡</span>
        </div>
      </div>
      <div className="slack-msg-body">
        <div className="slack-msg-header">
          <span className="slack-msg-author">Shortcut AI</span>
          <span className="slack-msg-badge">APP</span>
          <span className="slack-msg-time">{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
        <div className="slack-msg-content">{children}</div>
      </div>
    </div>
  );
}

function SlackUserMessage({ user, text }) {
  const initials = user.split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <div className="slack-msg">
      <div className="slack-msg-avatar-col">
        <div className="slack-user-avatar">{initials}</div>
      </div>
      <div className="slack-msg-body">
        <div className="slack-msg-header">
          <span className="slack-msg-author">{user}</span>
          <span className="slack-msg-time">{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
        <div className="slack-msg-text">{text}</div>
      </div>
    </div>
  );
}

function SlackNotificationCard({ modelName, outputs }) {
  return (
    <div className="slack-attachment">
      <div className="slack-attachment-bar" />
      <div className="slack-attachment-body">
        <div className="slack-attachment-title">📊 Model Complete: {modelName}</div>
        <div className="slack-attachment-divider" />
        <div className="slack-attachment-section-title">Key Outputs</div>
        {outputs.map((o, i) => (
          <div key={i} className="slack-attachment-field">
            <span className="slack-field-label">{o.label}:</span> {o.value}
          </div>
        ))}
        <div className="slack-attachment-divider" />
        <button className="slack-btn-primary">View Full Model</button>
        <div className="slack-attachment-footer">
          <span className="slack-footer-icon">✦</span> Built with <strong>Shortcut AI</strong>
        </div>
      </div>
    </div>
  );
}

function SlackUnfurlCard({ card }) {
  return (
    <div className="slack-attachment">
      <div className="slack-attachment-bar" />
      <div className="slack-attachment-body">
        <div className="slack-unfurl-app-label">
          <div className="slack-unfurl-app-icon">⚡</div>
          Shortcut AI
        </div>
        <a className="slack-attachment-link" href="#" onClick={e => e.preventDefault()}>{card.name}</a>
        <div className="slack-attachment-desc">{card.summary}</div>
        <div className="slack-unfurl-metrics">
          {card.outputs.map((o, i) => (
            <div key={i} className="slack-unfurl-metric">
              <span className="slack-unfurl-metric-label">{o.label}</span>
              <span className="slack-unfurl-metric-value">{o.value}</span>
            </div>
          ))}
        </div>
        <div className="slack-attachment-footer">
          Created by <strong>{card.creator}</strong> &nbsp;|&nbsp; Built with <strong>Shortcut AI</strong>
        </div>
        <button className="slack-btn-primary" style={{ marginTop: 8 }}>Open in Shortcut AI</button>
      </div>
    </div>
  );
}

/* ─── Panels ─── */

function NotifyPanel() {
  const [modelName, setModelName] = useState("");
  const [outputs, setOutputs] = useState([{ label: "", value: "" }]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  function addOutput() { setOutputs([...outputs, { label: "", value: "" }]); }
  function removeOutput(i) { setOutputs(outputs.filter((_, idx) => idx !== i)); }
  function updateOutput(i, field, val) {
    setOutputs(outputs.map((o, idx) => idx === i ? { ...o, [field]: val } : o));
  }
  function loadSample(s) { setModelName(s.name); setOutputs(s.outputs.map(o => ({ ...o }))); setStatus(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const validOutputs = outputs.filter(o => o.label && o.value);
    if (!validOutputs.length) { setStatus({ type: "error", text: "Add at least one key output" }); setLoading(false); return; }
    try {
      const res = await fetch("/api/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName, outputs: validOutputs }),
      });
      const data = await res.json();
      if (!res.ok) setStatus({ type: "error", text: data.error });
      else {
        setStatus({ type: "success", text: "Notification sent to Slack!" });
        setSentMessages(prev => [...prev, { modelName, outputs: validOutputs }]);
      }
    } catch { setStatus({ type: "error", text: "Could not reach the server" }); }
    finally { setLoading(false); }
  }

  const validOutputs = outputs.filter(o => o.label && o.value);
  const showPreview = modelName && validOutputs.length > 0;

  return (
    <div className="demo-split">
      {/* Left: Shortcut AI side */}
      <div className="demo-shortcut-side">
        <div className="demo-side-label">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="4" fill="#16A34A"/><path d="M8 12L16 8L24 12L16 16L8 12Z" fill="white" opacity="0.9"/><path d="M8 16L16 20L24 16" stroke="white" strokeWidth="2" fill="none" opacity="0.7"/></svg>
          <span>Shortcut AI</span>
        </div>
        <h2 className="demo-shortcut-title">Model Complete</h2>
        <p className="demo-shortcut-desc">When an analyst finishes a model, Shortcut AI automatically sends a notification to Slack.</p>

        <div className="demo-shortcut-samples">
          <span className="demo-samples-label">Try a sample model:</span>
          {SAMPLE_MODELS.map(s => (
            <button key={s.name} type="button" className="demo-sample-chip" onClick={() => loadSample(s)}>{s.name}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="demo-shortcut-form">
          <label>Model Name</label>
          <input type="text" required placeholder='e.g. "Tesla DCF Analysis"' value={modelName} onChange={e => setModelName(e.target.value)} />
          <div className="demo-outputs-header"><label>Key Outputs</label><button type="button" className="demo-add-btn" onClick={addOutput}>+ Add</button></div>
          {outputs.map((output, i) => (
            <div key={i} className="demo-output-row">
              <input type="text" placeholder="Label" value={output.label} onChange={e => updateOutput(i, "label", e.target.value)} />
              <input type="text" placeholder="Value" value={output.value} onChange={e => updateOutput(i, "value", e.target.value)} />
              {outputs.length > 1 && <button type="button" className="demo-remove-btn" onClick={() => removeOutput(i)}>×</button>}
            </div>
          ))}
          <button type="submit" className="demo-send-btn" disabled={loading}>
            {loading ? "Sending..." : "Send to Slack →"}
          </button>
        </form>
        {status && <p className={`demo-status ${status.type}`}>{status.text}</p>}
      </div>

      {/* Right: Slack side */}
      <div className="demo-slack-side">
        <div className="demo-side-label slack">
          <span className="demo-slack-icon">💬</span>
          <span>Slack Preview</span>
        </div>
        <div className="demo-slack-window">
          <div className="slack-sidebar-mini">
            <div className="slack-mini-workspace">Acme Corp</div>
            <div className="slack-mini-channel active"># model-updates</div>
            <div className="slack-mini-channel"># general</div>
            <div className="slack-mini-channel"># random</div>
          </div>
          <div className="slack-preview-main">
            <div className="slack-channel-header">
              <span className="slack-channel-hash">#</span> model-updates
            </div>
            <div className="slack-messages-area">
              {!showPreview && sentMessages.length === 0 && (
                <div className="slack-empty-state">
                  <div className="slack-empty-icon">💬</div>
                  <p>Fill in the form to preview how the notification appears in Slack</p>
                </div>
              )}
              {sentMessages.map((msg, i) => (
                <SlackBotMessage key={`sent-${i}`}>
                  <SlackNotificationCard modelName={msg.modelName} outputs={msg.outputs} />
                </SlackBotMessage>
              ))}
              {showPreview && (
                <>
                  <div className="slack-date-divider"><span>Today</span></div>
                  <SlackBotMessage>
                    <SlackNotificationCard modelName={modelName} outputs={validOutputs} />
                  </SlackBotMessage>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnfurlPanel() {
  const [link, setLink] = useState("");
  const [card, setCard] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulate(e) {
    e.preventDefault();
    setStatus(null); setCard(null); setLoading(true);
    try {
      const res = await fetch("/api/simulate-unfurl", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (!res.ok) setStatus({ type: "error", text: data.error });
      else setCard(data);
    } catch { setStatus({ type: "error", text: "Could not reach the server" }); }
    finally { setLoading(false); }
  }

  return (
    <div className="demo-split">
      {/* Left: Shortcut AI side */}
      <div className="demo-shortcut-side">
        <div className="demo-side-label">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="4" fill="#16A34A"/><path d="M8 12L16 8L24 12L16 16L8 12Z" fill="white" opacity="0.9"/><path d="M8 16L16 20L24 16" stroke="white" strokeWidth="2" fill="none" opacity="0.7"/></svg>
          <span>Shortcut AI</span>
        </div>
        <h2 className="demo-shortcut-title">Link Unfurling</h2>
        <p className="demo-shortcut-desc">When someone pastes a Shortcut AI link in Slack, it auto-expands into a rich preview card.</p>

        <div className="demo-info-box">
          <strong>How it works</strong>
          <ol>
            <li>Someone pastes a <code>shortcut.ai/share/...</code> link in Slack</li>
            <li>Slack sends a <code>link_shared</code> event to the server</li>
            <li>The server responds with a rich preview card</li>
          </ol>
        </div>

        <div className="demo-shortcut-samples">
          <span className="demo-samples-label">Try a link:</span>
          {SAMPLE_LINKS.map(l => (
            <button key={l} type="button" className="demo-sample-chip" onClick={() => { setLink(l); setCard(null); setStatus(null); }}>...{l.slice(-12)}</button>
          ))}
        </div>

        <form onSubmit={handleSimulate} className="demo-shortcut-form">
          <label>Shortcut AI Link</label>
          <input type="url" required placeholder="https://shortcut.ai/share/..." value={link} onChange={e => setLink(e.target.value)} />
          <button type="submit" className="demo-send-btn" disabled={loading}>{loading ? "Loading..." : "Simulate Unfurl →"}</button>
        </form>
        {status && <p className={`demo-status ${status.type}`}>{status.text}</p>}
      </div>

      {/* Right: Slack side */}
      <div className="demo-slack-side">
        <div className="demo-side-label slack">
          <span className="demo-slack-icon">💬</span>
          <span>Slack Preview</span>
        </div>
        <div className="demo-slack-window">
          <div className="slack-sidebar-mini">
            <div className="slack-mini-workspace">Acme Corp</div>
            <div className="slack-mini-channel"># model-updates</div>
            <div className="slack-mini-channel active"># general</div>
            <div className="slack-mini-channel"># random</div>
          </div>
          <div className="slack-preview-main">
            <div className="slack-channel-header">
              <span className="slack-channel-hash">#</span> general
            </div>
            <div className="slack-messages-area">
              {!card && (
                <div className="slack-empty-state">
                  <div className="slack-empty-icon">🔗</div>
                  <p>Paste a link and click "Simulate Unfurl" to see the preview</p>
                </div>
              )}
              {card && (
                <>
                  <div className="slack-date-divider"><span>Today</span></div>
                  <SlackUserMessage
                    user="Sarah Chen"
                    text={<>Hey team, check out this model I just finished: <a className="slack-inline-link" href="#" onClick={e => e.preventDefault()}>{link}</a></>}
                  />
                  <div className="slack-unfurl-thread">
                    <SlackUnfurlCard card={card} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin page ─── */

export default function Admin() {
  const [tab, setTab] = useState("notify");

  return (
    <div className="demo-page">
      {/* Top nav */}
      <nav className="demo-topnav">
        <div className="demo-topnav-left">
          <span className="demo-topnav-title">Shortcut AI — Slack Integration Demo</span>
        </div>
        <div className="demo-topnav-tabs">
          <button className={`demo-tab ${tab === "notify" ? "active" : ""}`} onClick={() => setTab("notify")}>
            Feature 1: Notifications
          </button>
          <button className={`demo-tab ${tab === "unfurl" ? "active" : ""}`} onClick={() => setTab("unfurl")}>
            Feature 2: Link Unfurling
          </button>
          <Link to="/model/a2a7d1d5-b23b-40a8-afd3-ce0c19a78322" className="demo-tab">
            Feature 3: Landing Page →
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="demo-content">
        {tab === "notify" ? <NotifyPanel /> : <UnfurlPanel />}
      </div>
    </div>
  );
}
