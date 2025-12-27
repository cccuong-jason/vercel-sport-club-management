## Goals & Scope
- Deliver the MVP features: user management, scheduling, attendance, MVP voting, leaderboard, team fund, match payments.
- Web app with responsive UI; no real-time features beyond email notifications.
- Security: JWT sessions, RBAC, vote anonymity via encryption, basic GDPR practices.

## Architecture Overview
- Frontend: Next.js 15 (App Router, Server Components), Tailwind CSS, shadcn/ui.
- State/Data: React Query for server data; Zustand for light client state (auth/user/filters).
- Auth: NextAuth.js (email + Google) with role-based authorization.
- Backend: Next.js server actions + route handlers for REST where needed.
- Database: MongoDB via Mongoose models; connection pooled in a shared module.
- Notifications: Nodemailer for transactional emails (events, reminders, low balance).
- Validation: Zod schemas shared across server/client forms.
- Testing: Jest + RTL for unit/integration; Cypress for E2E.
- Deployment: Vercel; Docker for local dev; GitHub Actions CI.

## Project Structure
- `app/`: App Router pages
  - `(public)/signin`, `(public)/signup`
  - `(dashboard)/dashboard`
  - `team`, `team/[memberId]`
  - `events`, `events/new`, `events/[eventId]`
  - `voting/[matchId]`
  - `leaderboard`
  - `funds`
  - `match-payments/[matchId]`
- `components/`: UI (forms, tables, calendar, modals).
- `models/`: Mongoose schemas.
- `lib/`: `db.ts`, `auth.ts`, `rbac.ts`, `mailer.ts`, `validators.ts`, `crypto.ts` (vote encryption), `scoring.ts`.
- `hooks/`: React Query hooks.
- `styles/`: Tailwind setup.
- `tests/`, `cypress/`: testing.

## Data Models
- `User`: `{ name, email, role: 'admin'|'member', position?, contact?, photoUrl?, createdAt }`.
- `Team`: `{ name, managerUserId, memberIds[], createdAt }`.
- `Event`: `{ type: 'training'|'match', title, date, startTime, endTime, location, teamId, createdBy, rsvpOpen: boolean }`.
- `RSVP`: `{ eventId, userId, status: 'yes'|'no'|'maybe', note?, createdAt, updatedAt }`.
- `Attendance`: `{ eventId, userId, status: 'present'|'absent'|'unexpected', note?, markedBy, createdAt }`.
- `Vote`: `{ matchId, voterId, selectionsEnc: string, createdAt }` (encrypted selections for 1st/2nd/3rd; server-only decrypt for admin view; prevent self-votes & duplicates).
- `Season`: `{ name, startDate, endDate, teamId, createdBy }`.
- `LeaderboardEntry` (optional cache): `{ seasonId, userId, mvpPoints, attendancePoints, total, breakdown }` (computed & persisted post-voting or on demand).
- `FundTransaction`: `{ teamId, type: 'contribution'|'expense', amount, date, category?, reason?, createdBy, approvedBy?, memberId? }`.
- `MatchPayment`: `{ matchId, userId, amount, status: 'paid'|'pending'|'overdue', confirmedBy?, createdAt }`.

## Auth & RBAC
- NextAuth providers: Email + Google; JWT sessions with `role` claim.
- Middleware protects `app/(dashboard)` routes; server actions double-check role.
- Admin-only: member management, attendance bulk marking, opening/closing voting, funds approvals, payment confirmations.
- Members: RSVP, self-report absence note, vote, view leaderboards, log contributions.

## Core Features
### User Management
- Signup/login via NextAuth; invite flow generates tokenized link tied to `Team`.
- Admin can approve/add/remove members; edit profiles.

### Events & RSVP
- Admin creates events with date/time/location, type.
- Calendar view with filters; members RSVP via simple form; email notifications on new/updated events.

### Attendance Tracking
- Admin marks attendance per event; bulk actions (set all present/absent, then adjust).
- Members can add absence notes; stats per member/event.

### MVP Voting (Matches)
- Admin opens/close voting windows per match.
- Member vote form: select 1st/2nd/3rd (unique, no self-vote).
- Scoring: 1st=5, 2nd=3, 3rd=1; tiebreakers by count of higher placements.
- Store selections encrypted; admin-only decrypt view; results auto-computed and saved on close.

### Leaderboard
- Seasons configured by admin; multiple overlapping allowed.
- Aggregation: MVP points within season + attendance points (+1 present, -1 absent, 0 unexpected).
- Views: public list for members; admin detail with breakdown and filters.

### Team Fund
- Member contributions logged and admin-approved; admin expenses recorded.
- Balance = sum(contributions) - sum(expenses); history visible to all (details restricted if needed).
- Monthly summaries and per-member stats.

### Match Payments
- Admin sets per-player fee per match.
- Members mark paid; admin confirms; statuses shown (paid/pending/overdue).
- Integration: confirmed payments create `FundTransaction` contributions.

## Notifications
- Nodemailer: event creation/updates, low fund balance, overdue payments.
- Templated emails; batched sending where possible.

## Security & Compliance
- HTTPS-only deployment; secure cookies; CSRF-safe actions via NextAuth.
- Zod validation on all inputs; sanitize strings.
- Votes encrypted at rest using server-side symmetric key; only admin role can decrypt on server.
- PII minimal exposure; role-gated fields; data retention policies simple.

## UI & UX
- Tailwind + shadcn/ui components; accessible forms, tables, and calendar.
- Responsive layouts; keyboard navigation and ARIA labels.
- Simple dashboards per role.

## Testing
- Unit: `scoring.ts`, `crypto.ts`, validators, RBAC helpers.
- Component: forms, tables, calendar interactions.
- E2E: auth flows, event CRUD, RSVP, attendance marking, voting, leaderboard aggregation, funds, payments.
- CI: run Jest + Cypress on PRs.

## Deployment & DevOps
- Vercel project; env vars: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth client IDs, `SMTP_*`, `VOTE_ENC_KEY`.
- Docker for local dev; GitHub Actions for lint/test.

## Implementation Phases
1. Foundation: Next.js setup, Tailwind, shadcn, Mongo connection, NextAuth with roles.
2. User & Team management: invites, roster, profiles.
3. Events & RSVP: CRUD, calendar, notifications.
4. Attendance: marking, stats.
5. Voting: encrypted votes, scoring, admin results.
6. Leaderboard: season config, aggregation, views.
7. Funds & Payments: ledger, balances, match fees integration, reminders.
8. Testing & hardening: coverage, accessibility, performance.
9. Deployment: Vercel, envs, monitoring.

## Open Assumptions
- Single team per workspace for MVP; multi-team later.
- Email provider SMTP available; Google OAuth approved.
- No real payment gateway; contributions are virtual.

Please confirm this plan or specify adjustments, and I will proceed to implement step-by-step.