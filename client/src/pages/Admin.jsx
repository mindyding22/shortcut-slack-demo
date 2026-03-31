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

/* ─── Channel content panels ─── */

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
    <div className="slack-layout">
      {/* Left: compose form */}
      <div className="slack-compose-panel">
        <div className="slack-compose-header">
          <h2>Compose Notification</h2>
          <p className="slack-compose-desc">Fill in the model details, then send to Slack.</p>
        </div>
        <div className="slack-compose-samples">
          <span className="slack-compose-samples-label">Quick fill:</span>
          {SAMPLE_MODELS.map(s => (
            <button key={s.name} type="button" className="slack-sample-chip" onClick={() => loadSample(s)}>{s.name}</button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="slack-compose-form">
          <label>Model Name</label>
          <input type="text" required placeholder='e.g. "Tesla DCF Analysis"' value={modelName} onChange={e => setModelName(e.target.value)} />
          <div className="slack-outputs-header"><label>Key Outputs</label><button type="button" className="slack-add-btn" onClick={addOutput}>+ Add</button></div>
          {outputs.map((output, i) => (
            <div key={i} className="slack-output-row">
              <input type="text" placeholder="Label" value={output.label} onChange={e => updateOutput(i, "label", e.target.value)} />
              <input type="text" placeholder="Value" value={output.value} onChange={e => updateOutput(i, "value", e.target.value)} />
              {outputs.length > 1 && <button type="button" className="slack-remove-btn" onClick={() => removeOutput(i)}>×</button>}
            </div>
          ))}
          <button type="submit" className="slack-send-btn" disabled={loading}>
            {loading ? "Sending..." : "Send to Slack"}
          </button>
        </form>
        {status && <p className={`slack-status ${status.type}`}>{status.text}</p>}
      </div>

      {/* Right: Slack preview */}
      <div className="slack-preview-pane">
        <div className="slack-channel-header">
          <span className="slack-channel-hash">#</span> model-updates
        </div>
        <div className="slack-messages-area">
          {!showPreview && sentMessages.length === 0 && (
            <div className="slack-empty-state">
              <div className="slack-empty-icon">💬</div>
              <p>Fill in the form to preview how your notification will look in Slack</p>
            </div>
          )}
          {sentMessages.map((msg, i) => (
            <SlackBotMessage key={`sent-${i}`}>
              <SlackNotificationCard modelName={msg.modelName} outputs={msg.outputs} />
            </SlackBotMessage>
          ))}
          {showPreview && (
            <>
              <div className="slack-date-divider">
                <span>Today</span>
              </div>
              <SlackBotMessage>
                <SlackNotificationCard modelName={modelName} outputs={validOutputs} />
              </SlackBotMessage>
            </>
          )}
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
    <div className="slack-layout">
      {/* Left: compose */}
      <div className="slack-compose-panel">
        <div className="slack-compose-header">
          <h2>Simulate Link Unfurl</h2>
          <p className="slack-compose-desc">Paste a Shortcut AI link to see how it auto-expands in Slack.</p>
        </div>
        <div className="slack-info-box">
          <strong>How it works</strong>
          <ol>
            <li>Someone pastes a <code>shortcut.ai/share/...</code> link in Slack</li>
            <li>Slack sends a <code>link_shared</code> event to your server</li>
            <li>The server responds with a rich preview card</li>
          </ol>
        </div>
        <div className="slack-compose-samples">
          <span className="slack-compose-samples-label">Try a link:</span>
          {SAMPLE_LINKS.map(l => (
            <button key={l} type="button" className="slack-sample-chip" onClick={() => { setLink(l); setCard(null); setStatus(null); }}>...{l.slice(-12)}</button>
          ))}
        </div>
        <form onSubmit={handleSimulate} className="slack-compose-form">
          <label>Shortcut AI Link</label>
          <input type="url" required placeholder="https://shortcut.ai/share/..." value={link} onChange={e => setLink(e.target.value)} />
          <button type="submit" className="slack-send-btn" disabled={loading}>{loading ? "Loading..." : "Simulate Unfurl"}</button>
        </form>
        {status && <p className={`slack-status ${status.type}`}>{status.text}</p>}
      </div>

      {/* Right: Slack preview */}
      <div className="slack-preview-pane">
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
              <div className="slack-date-divider">
                <span>Today</span>
              </div>
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
  );
}

/* ─── Main Admin shell (Slack-like) ─── */

export default function Admin() {
  const [tab, setTab] = useState("notify");

  return (
    <div className="slack-app">
      {/* Slack sidebar */}
      <aside className="slack-sidebar">
        <div className="slack-workspace-header">
          <div className="slack-workspace-name">Shortcut AI</div>
          <div className="slack-workspace-edit">▾</div>
        </div>

        <div className="slack-sidebar-section">
          <div className="slack-sidebar-label">Channels</div>
          <button
            className={`slack-channel-btn ${tab === "notify" ? "active" : ""}`}
            onClick={() => setTab("notify")}
          >
            <span className="slack-channel-prefix">#</span> model-updates
          </button>
          <button
            className={`slack-channel-btn ${tab === "unfurl" ? "active" : ""}`}
            onClick={() => setTab("unfurl")}
          >
            <span className="slack-channel-prefix">#</span> general
          </button>
        </div>

        <div className="slack-sidebar-section">
          <div className="slack-sidebar-label">Direct Messages</div>
          <button className="slack-channel-btn" disabled>
            <span className="slack-dm-status online"></span> Sarah Chen
          </button>
          <button className="slack-channel-btn" disabled>
            <span className="slack-dm-status online"></span> James Park
          </button>
          <button className="slack-channel-btn" disabled>
            <span className="slack-dm-status"></span> Emily Rivera
          </button>
        </div>

        <div className="slack-sidebar-section" style={{ marginTop: 'auto' }}>
          <div className="slack-sidebar-label">Apps</div>
          <button className="slack-channel-btn" disabled>
            <span className="slack-app-icon">⚡</span> Shortcut AI
          </button>
        </div>

        <div className="slack-sidebar-footer">
          <Link to="/dashboard" className="slack-sidebar-link">Open Dashboard →</Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="slack-main">
        {tab === "notify" ? <NotifyPanel /> : <UnfurlPanel />}
      </main>
    </div>
  );
}
