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

function NotifyTab() {
  const [modelName, setModelName] = useState("");
  const [outputs, setOutputs] = useState([{ label: "", value: "" }]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

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
      else setStatus({ type: "success", text: "Notification sent to Slack!" });
    } catch { setStatus({ type: "error", text: "Could not reach the server" }); }
    finally { setLoading(false); }
  }

  return (
    <>
      <h1>Notify Team</h1>
      <p className="subtitle">Send a rich Slack notification when a financial model is complete.</p>
      <div className="samples">
        <span className="samples-label">Try a sample:</span>
        {SAMPLE_MODELS.map(s => (
          <button key={s.name} type="button" className="sample-btn" onClick={() => loadSample(s)}>{s.name}</button>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="modelName">Model Name</label>
        <input id="modelName" type="text" required placeholder='e.g. "Tesla DCF Analysis"' value={modelName} onChange={e => setModelName(e.target.value)} />
        <div className="outputs-header"><label>Key Outputs</label><button type="button" className="add-btn" onClick={addOutput}>+ Add</button></div>
        {outputs.map((output, i) => (
          <div key={i} className="output-row">
            <input type="text" placeholder="Label" value={output.label} onChange={e => updateOutput(i, "label", e.target.value)} />
            <input type="text" placeholder="Value" value={output.value} onChange={e => updateOutput(i, "value", e.target.value)} />
            {outputs.length > 1 && <button type="button" className="remove-btn" onClick={() => removeOutput(i)}>x</button>}
          </div>
        ))}
        <button type="submit" className="submit-btn" disabled={loading}>{loading ? "Sending..." : "Send Slack Notification"}</button>
      </form>
      {status && <p className={`status ${status.type}`}>{status.text}</p>}
    </>
  );
}

function UnfurlTab() {
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
    <>
      <h1>Link Unfurling</h1>
      <p className="subtitle">When a Shortcut AI link is pasted in Slack, it automatically expands into a rich preview card.</p>
      <div className="info-box">
        <strong>How it works</strong>
        <ol>
          <li>Someone pastes a <code>shortcut.ai/share/...</code> link in Slack</li>
          <li>Slack sends a <code>link_shared</code> event to your server</li>
          <li>The server looks up the model and calls <code>chat.unfurl</code> with a rich card</li>
        </ol>
      </div>
      <div className="samples">
        <span className="samples-label">Try a link:</span>
        {SAMPLE_LINKS.map(l => (
          <button key={l} type="button" className="sample-btn" onClick={() => { setLink(l); setCard(null); setStatus(null); }}>...{l.slice(-12)}</button>
        ))}
      </div>
      <form onSubmit={handleSimulate}>
        <label htmlFor="unfurlLink">Shortcut AI Link</label>
        <input id="unfurlLink" type="url" required placeholder="https://shortcut.ai/share/..." value={link} onChange={e => setLink(e.target.value)} />
        <button type="submit" className="submit-btn" disabled={loading}>{loading ? "Loading..." : "Simulate Unfurl"}</button>
      </form>
      {status && <p className={`status ${status.type}`}>{status.text}</p>}
      {card && (
        <div className="preview-section">
          <h2>Unfurl Preview</h2>
          <div className="unfurl-card">
            <div className="unfurl-top">
              <div className="unfurl-brand-bar"></div>
              <div className="unfurl-content">
                <div className="unfurl-title">{card.name}</div>
                <div className="unfurl-summary">{card.summary}</div>
                <div className="unfurl-outputs">
                  {card.outputs.map((o, i) => (<span key={i} className="unfurl-metric"><strong>{o.label}</strong> {o.value}</span>))}
                </div>
                <div className="unfurl-footer">
                  <span className="unfurl-creator"><span className="unfurl-avatar">{card.creator[0]}</span>{card.creator}</span>
                  <span className="unfurl-badge">Shortcut AI</span>
                </div>
                <a href={card.url} className="unfurl-cta" target="_blank" rel="noreferrer">Open in Shortcut AI</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("notify");

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="logo">Shortcut AI</Link>
        <nav className="tabs">
          <button className={`tab ${tab === "notify" ? "active" : ""}`} onClick={() => setTab("notify")}>Notifications</button>
          <button className={`tab ${tab === "unfurl" ? "active" : ""}`} onClick={() => setTab("unfurl")}>Link Unfurling</button>
        </nav>
      </header>
      <div className="container">
        {tab === "notify" ? <NotifyTab /> : <UnfurlTab />}
      </div>
    </div>
  );
}
