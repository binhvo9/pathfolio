# Feature: Insight/AI Service

Status: Implemented & verified live (comparison, export, email backend
routes — apps/web proxy routes + UI still pending)
Service: Insight/AI

## Problem / goal

A beginner can see two scenarios' numbers side by side and still not know
which one actually serves their stated goal better, or why. This service
is the last piece of the core loop (core value prop #5) — it explains the
comparison in plain language.

## Scope

In: comparing 2+ of a user's scenarios via Google Gemini, given their real
performance history and stated goal; exporting a scenario as a PDF;
emailing that PDF.

Out: computing performance itself (Performance Tracking's job — this
service only reads that history). Any UI beyond the comparison
trigger/display (Phase 5's own UI item covers that separately).

## Behavior

**Comparison (FR-AI-1/2), synchronous — the user is waiting for a reply:**
1. User selects 2+ of their own scenarios, clicks "Compare"
2. This service gathers, per selected portfolio: current allocation
   (from Simulation), full snapshot history (from Performance Tracking),
   and the user's goal/risk profile (from Onboarding's RiskProfile)
3. Builds a prompt from that real data and calls Google Gemini (swapped
   from Claude/Anthropic on 2026-09-12 — Anthropic's API has no real free
   tier, only expiring trial credits, while Gemini does; a demo-scale
   personal project shouldn't need a paid API key just to run) — model:
   Gemini Flash, not the smallest/cheapest variant, because the insight
   text *is* the product's headline feature (core value prop #5); this
   is the one place in the system where output quality matters more than
   squeezing the free tier further
4. Returns plain-language insight: which scenario is ahead relative to
   the stated goal, and why — logged to the `Insights` collection
   (portfolio ids compared, the text, timestamp) so a user can revisit
   past comparisons, not just the latest one

**Export (FR-AI-3/4):** generates a PDF reflecting whatever data exists
right now for one scenario (allocation + reasoning only if no snapshots
yet; allocation + performance curve + latest insight once they exist —
per CLAUDE.md's 2026-08-29 "report is a snapshot at export time" entry).
Built with `pdfkit` (simple, no headless-browser overhead for a
single-page report). Uploaded to Cloudflare R2, returns a signed URL that
expires after 24h (NFR-SEC-3) — not a permanent public link.

**Email (FR-AI-5):** sends the exported PDF as an attachment (or a link,
TBD at implementation) via Resend.

## Data

`Insights` collection (MongoDB Atlas, same cluster, per CLAUDE.md's
storage split): `id`, `userId`, `portfolioIds` (the scenarios compared),
`insightText`, `createdAt`.

PDFs themselves live in R2, not Mongo — only the generated insight *text*
is persisted here.

## API / interface

- `POST /compare` — body `{ portfolioIds: string[] }`, returns the
  insight text (also persists it)
- `POST /portfolios/:id/export` — generates + uploads the PDF, returns a
  signed URL
- `POST /portfolios/:id/email` — exports (if not already) and emails it
- Calls Simulation (`GET /portfolios`), Performance Tracking
  (`GET /portfolios/:id/snapshots`), and reads RiskProfile — needs a way
  to reach Onboarding's data; since Onboarding lives inside apps/web (the
  modular monolith), this is a new internal-only endpoint on apps/web
  itself, not a separate deployable call

## Open questions

None open. Resolved during implementation: email links to the signed R2
URL rather than attaching the PDF — the URL already carries its own 24h
expiry, so a link keeps the same guarantee without duplicating the file
bytes into the email. Export's "reasoning" (no-snapshots case) and
"latest insight" (has-snapshots case) are both generated locally /
read from the existing `Insights` collection — export never calls
Gemini itself, since the comparison text is only regenerated on demand
via /compare.
