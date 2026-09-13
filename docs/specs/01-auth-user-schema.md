# Feature: Auth + User Schema

Status: Implemented & verified live
Service: User & Onboarding

## Problem / goal

A user needs to sign in so the system has an identity to attach a
RiskProfile and Portfolios to. No accounts, nothing downstream works.

## Scope

In: OAuth login (Google/GitHub) via NextAuth.js, the Users table, an empty
RiskProfile row created at signup, basic profile view/edit.

Out: the risk questionnaire logic itself (next spec, `02-risk-questionnaire.md`),
password-based auth (OAuth only per REQUIREMENTS.md FR-ON-1), roles/admin.

## Behavior

**New user, happy path:**
1. User clicks "Sign in with Google/GitHub" → NextAuth OAuth flow
2. NextAuth creates an `Account` row (provider, providerAccountId) and a
   `User` row if this `(provider, providerAccountId)` pair hasn't signed in
   before
3. An empty `RiskProfile` row is created for the new user (all fields
   null) — Onboarding UI checks for this to know the user hasn't done the
   questionnaire yet
4. Session cookie set, user redirected to the risk questionnaire

**Returning user:** NextAuth matches the existing `Account` row, session
established, user redirected straight to their dashboard.

**Edge case — same email, different provider:** matched by
`(provider, providerAccountId)`, not email alone, so a Google login and a
GitHub login with the same email address become two separate accounts
unless NextAuth's account linking is explicitly enabled. Not enabling
linking for now — out of scope, avoids the account-hijack risk that comes
with automatic email-based linking.

## Data

- `Users`: id, email, name, avatar_url, created_at, updated_at
- `RiskProfile` (1:1 with Users): id, user_id (FK, unique), goals,
  risk_tolerance, time_horizon_years, risk_score (nullable until the
  questionnaire is completed), created_at, updated_at
- NextAuth's own adapter tables (`Account`, `Session`, `VerificationToken`)
  — auto-created by the Postgres adapter, not hand-designed

Matches the ERD's Users/RiskProfile split (see `docs/diagrams/erd`).

## API / interface

- `/api/auth/*` — handled by NextAuth.js itself, not hand-written
- `GET /api/profile` — current user + their RiskProfile
- `PATCH /api/profile` — update name/avatar (not risk fields — those
  belong to the questionnaire feature)

## Open questions

None open — revisit account linking if it turns out to matter later.
