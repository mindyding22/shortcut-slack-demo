import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const LANDING_URL =
  process.env.LANDING_URL || "https://shortcut.ai/share/a2a7d1d5-b23b-40a8-afd3-ce0c19a78322";

app.use(cors());
app.use(express.json());

// ── In-memory stores ──
const users = new Map(); // email -> { email, password, name }
const sessions = new Map(); // token -> email

const models = new Map();

const sampleModels = [
  {
    id: "a2a7d1d5-b23b-40a8-afd3-ce0c19a78322",
    name: "Tesla DCF Analysis",
    creator: "Sarah Chen",
    summary: "10-year DCF with bull/base/bear scenarios for Tesla equity valuation.",
    outputs: [
      { label: "Implied Share Price", value: "$287" },
      { label: "WACC", value: "9.4%" },
      { label: "Terminal Growth Rate", value: "2.5%" },
    ],
    table: {
      headers: ["", "FY2024", "FY2025E", "FY2026E", "FY2027E", "FY2028E"],
      rows: [
        ["Revenue ($B)", "96.8", "112.4", "131.6", "149.2", "168.7"],
        ["Growth %", "8.2%", "16.1%", "17.1%", "13.4%", "13.1%"],
        ["EBIT ($B)", "10.4", "14.8", "19.7", "23.1", "27.5"],
        ["EBIT Margin", "10.7%", "13.2%", "15.0%", "15.5%", "16.3%"],
        ["Free Cash Flow ($B)", "4.4", "8.2", "12.1", "15.3", "18.9"],
        ["FCF Margin", "4.5%", "7.3%", "9.2%", "10.3%", "11.2%"],
        ["D&A ($B)", "5.9", "6.8", "7.5", "8.1", "8.7"],
        ["CapEx ($B)", "10.8", "11.2", "12.5", "13.1", "14.0"],
      ],
    },
  },
  {
    id: "0b7df665-e24d-40c2-a7fd-c1558e30855b",
    name: "Apple LBO Model",
    creator: "James Park",
    summary: "Leveraged buyout analysis assuming 60% debt financing at 5.5% rate.",
    outputs: [
      { label: "IRR", value: "18.3%" },
      { label: "MOIC", value: "2.4x" },
      { label: "Exit EV/EBITDA", value: "14.2x" },
    ],
    table: {
      headers: ["", "Entry", "Year 1", "Year 2", "Year 3", "Year 5"],
      rows: [
        ["Revenue ($B)", "394.3", "416.2", "441.2", "467.7", "525.5"],
        ["EBITDA ($B)", "130.5", "141.3", "152.8", "163.5", "187.2"],
        ["Net Debt ($B)", "180.0", "155.2", "128.4", "99.1", "32.6"],
        ["Leverage", "1.4x", "1.1x", "0.8x", "0.6x", "0.2x"],
        ["Equity Value ($B)", "120.5", "152.8", "188.6", "228.4", "322.4"],
        ["Cumulative FCF ($B)", "—", "32.8", "68.4", "107.1", "192.4"],
      ],
    },
  },
  {
    id: "c3d4e5f6-a1b2-4c3d-8e9f-0a1b2c3d4e5f",
    name: "Microsoft Comps Analysis",
    creator: "Emily Rivera",
    summary: "Comparable company analysis across enterprise software peers.",
    outputs: [
      { label: "Implied EV/Revenue", value: "11.8x" },
      { label: "Implied P/E", value: "32.5x" },
      { label: "Median Premium", value: "15%" },
    ],
    table: {
      headers: ["Company", "EV/Revenue", "EV/EBITDA", "P/E", "Revenue Growth"],
      rows: [
        ["Microsoft", "12.1x", "22.4x", "34.2x", "15.2%"],
        ["Salesforce", "7.8x", "25.1x", "42.8x", "11.3%"],
        ["Oracle", "6.9x", "16.8x", "22.1x", "8.7%"],
        ["SAP", "5.4x", "18.2x", "28.5x", "9.1%"],
        ["Adobe", "11.2x", "24.7x", "38.4x", "12.6%"],
        ["ServiceNow", "15.8x", "48.2x", "62.1x", "22.4%"],
        ["Median", "9.5x", "23.6x", "33.4x", "11.9%"],
      ],
    },
  },
];

for (const m of sampleModels) {
  models.set(m.id, m);
}

// ── Feature 3: Auth endpoints ──
app.post("/api/signup", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: "Account already exists" });
  }
  users.set(email, { email, password, name: name || email.split("@")[0] });
  const token = crypto.randomUUID();
  sessions.set(token, email);
  res.json({ token, user: { email, name: name || email.split("@")[0] } });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = crypto.randomUUID();
  sessions.set(token, email);
  res.json({ token, user: { email, name: user.name } });
});

app.get("/api/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const email = sessions.get(token);
  const user = users.get(email);
  res.json({ email, name: user.name });
});

// ── Model endpoints (updated: preview vs full) ──
app.get("/api/models", (req, res) => {
  res.json([...models.values()].map(({ table, ...rest }) => rest));
});

app.get("/api/models/:id", (req, res) => {
  const model = models.get(req.params.id);
  if (!model) {
    return res.status(404).json({ error: "Model not found" });
  }
  // Check auth — if authenticated, return full model; otherwise return preview
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token && sessions.has(token)) {
    return res.json(model);
  }
  // Preview: model info + outputs but only first 2 table rows
  const { table, ...rest } = model;
  const preview = {
    ...rest,
    table: table
      ? { headers: table.headers, rows: table.rows.slice(0, 2), totalRows: table.rows.length }
      : null,
  };
  res.json(preview);
});

app.post("/api/models", (req, res) => {
  const { name, creator, summary, outputs } = req.body;
  if (!name || !creator) {
    return res.status(400).json({ error: "Name and creator are required" });
  }
  const id = crypto.randomUUID();
  const model = { id, name, creator, summary: summary || "", outputs: outputs || [] };
  models.set(id, model);
  res.json(model);
});

// ── Feature 1: Model Notification Bot ──
app.post("/api/notify", async (req, res) => {
  const { modelName, outputs } = req.body;

  if (!modelName) {
    return res.status(400).json({ error: "Model name is required" });
  }
  if (!outputs || outputs.length === 0) {
    return res.status(400).json({ error: "At least one key output is required" });
  }
  if (!SLACK_WEBHOOK_URL) {
    return res.status(500).json({ error: "Slack webhook URL is not configured" });
  }

  const outputLines = outputs.map((o) => `>*${o.label}:*  ${o.value}`).join("\n");

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `Model Complete: ${modelName}`, emoji: true },
      },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: `*Key Outputs*\n${outputLines}` } },
      { type: "divider" },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Full Model", emoji: true },
            url: LANDING_URL,
            style: "primary",
          },
        ],
      },
      { type: "context", elements: [{ type: "mrkdwn", text: "Built with *Shortcut AI*" }] },
    ],
  };

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text();
      return res.status(502).json({ error: `Slack API error: ${body}` });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(502).json({ error: `Failed to reach Slack: ${err.message}` });
  }
});

// ── Feature 2: Link Unfurling ──
app.post("/api/slack/events", async (req, res) => {
  const { type, challenge, event } = req.body;

  if (type === "url_verification") {
    return res.json({ challenge });
  }

  if (type === "event_callback" && event?.type === "link_shared") {
    res.sendStatus(200);

    if (!SLACK_BOT_TOKEN) {
      console.error("SLACK_BOT_TOKEN not set — cannot unfurl links");
      return;
    }

    const unfurls = {};
    for (const link of event.links) {
      const url = link.url;
      const match = url.match(/shortcut\.ai\/share\/([a-f0-9-]+)/);
      if (!match) continue;
      const model = models.get(match[1]);
      if (!model) continue;

      const outputText = model.outputs.map((o) => `*${o.label}:* ${o.value}`).join("\n");

      unfurls[url] = {
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*${model.name}*\n${model.summary}` },
            accessory: {
              type: "button",
              text: { type: "plain_text", text: "Open in Shortcut AI" },
              url,
              style: "primary",
            },
          },
          { type: "section", text: { type: "mrkdwn", text: outputText } },
          {
            type: "context",
            elements: [
              { type: "mrkdwn", text: `Created by *${model.creator}*  |  Built with *Shortcut AI*` },
            ],
          },
        ],
      };
    }

    if (Object.keys(unfurls).length === 0) return;

    try {
      const response = await fetch("https://slack.com/api/chat.unfurl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel: event.channel, ts: event.message_ts, unfurls }),
      });
      const data = await response.json();
      if (!data.ok) console.error("Unfurl failed:", data.error);
    } catch (err) {
      console.error("Unfurl request failed:", err.message);
    }
    return;
  }

  res.sendStatus(200);
});

app.post("/api/simulate-unfurl", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  const match = url.match(/shortcut\.ai\/share\/([a-f0-9-]+)/);
  if (!match) return res.status(400).json({ error: "Not a valid Shortcut AI link" });
  const model = models.get(match[1]);
  if (!model) return res.status(404).json({ error: "Model not found" });
  res.json({ name: model.name, creator: model.creator, summary: model.summary, outputs: model.outputs, url });
});

// ── Serve React frontend in production ──
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
