# Shortcut AI — Slack Integration Demo

A working prototype demonstrating how Slack integration can drive viral user growth for Shortcut AI, an AI-powered financial modeling platform.

**Live Demo:** https://shortcut-slack-demo.onrender.com/admin

## Three Features

### 1. Model Completion Notifications
When an analyst finishes a financial model, Shortcut AI automatically posts a rich notification to a Slack channel with model name, key outputs (IRR, MOIC, EV/EBITDA), and a "View Full Model" button — branded with "Built with Shortcut AI."

### 2. Link Unfurling
When someone pastes a Shortcut AI link in Slack, it auto-expands into a rich preview card showing the model summary, key metrics, creator name, and an "Open in Shortcut AI" button — the same mechanic Figma uses to drive team-wide adoption.

### 3. Landing Page + Viral Signup Loop
Clicking the link leads to a landing page showing a partial model preview (key metrics visible, full data locked). Users sign up free to view the full model — completing the viral loop: build model → share in Slack → teammate sees preview → signs up → builds their own model → shares → repeat.

## Why This Matters

There is currently **zero** AI financial modeling app in the Slack App Directory. This integration makes Shortcut AI the first mover in that category, with access to Slack's 750M+ registered users.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Slack API:** Incoming webhooks + Block Kit for rich messages
- **Deployment:** Render

## Sample Models

- Tesla DCF Analysis (Implied Share Price: $287, WACC: 9.4%)
- Apple LBO Model (IRR: 18.3%, MOIC: 2.4x)
- Microsoft Comps Analysis

## Built By

Mindy Ding — with Claude Code as the coding tool.
