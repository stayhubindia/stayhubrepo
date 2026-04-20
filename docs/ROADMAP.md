# GharBazar - Execution Roadmap (Reviewed)

> Last Updated: 5 April 2026
> Basis: Repository review of backend, frontend, and docs in this workspace
> Current Stage: MVP complete, hardening and production readiness in progress

---

## 1) Executive Review

The project is structurally strong and feature-rich for an MVP, with a clean modular backend (Django + DRF + services) and modern frontend (Next.js App Router + TypeScript). Core business flows are present: auth, properties, favorites, leads/contacts, notifications, analytics, and partial real-time chat.

Production readiness is blocked by a small set of high-impact operational and security tasks, plus testing and observability gaps.

### Health Snapshot

| Area | Score | Status |
| --- | --- | --- |
| Architecture | 8/10 | Strong module boundaries and service-layer patterns |
| Feature Completeness (MVP) | 8/10 | Core marketplace flows implemented |
| Security | 6.5/10 | Core fixes done, but critical manual rotation/config still pending |
| Frontend UX Reliability | 6/10 | Good foundation, some reliability claims are partially implemented |
| Testing | 3/10 | Backend tests exist in parts, frontend coverage is low |
| Observability/DevOps | 2/10 | No CI/CD, limited monitoring |

---

## 2) Verified Status (What Is Actually Done)

### Confirmed Complete
- [x] Modular backend apps and service architecture
- [x] JWT + Firebase-based authentication flow
- [x] Property CRUD, filtering, ordering, lifecycle states
- [x] Favorites, contacts/leads, notifications
- [x] Swagger/OpenAPI docs (`/api/v1/docs/`)
- [x] Security headers + baseline throttling
- [x] Celery + Redis integration
- [x] Owner analytics APIs and heatmap endpoint
- [x] Auth page consolidation to `/auth` (legacy signup routes redirected)
- [x] Chat backend core (models, APIs, Channels consumer, JWT socket auth)

### Confirmed Partial / Incomplete
- [-] Session expiry UX (refresh plumbing exists; warning UX implemented, needs cross-tab edge case testing)

### Confirmed Not Complete
- [ ] Firebase credential rotation in console (manual)
- [ ] Public history scrubbing for exposed credentials (if repo/public mirror exists)
- [ ] Production env hardening (`DEBUG=False`, strict hosts/origins)
- [ ] Error monitoring (Sentry or equivalent)
- [ ] Comprehensive frontend tests and E2E suite

---

## 3) Immediate Production Blockers (P0)

Complete these before production deployment.

### P0.1 Credential and Secret Hygiene
- [ ] Rotate Firebase service account key in Firebase Console
- [ ] Update runtime env vars with new key material
- [ ] Verify no JSON credential fallback is used in production
- [ ] If repository was ever public: scrub git history and force-rotate all leaked credentials

### P0.2 Production Configuration Lockdown
- [ ] Set `DEBUG=False`
- [ ] Set explicit `ALLOWED_HOSTS`
- [ ] Restrict `CORS_ALLOWED_ORIGINS` to production domain(s)
- [ ] Validate secure cookie/SSL behavior in deployed environment

### P0.3 Migration and Deployment Readiness
- [ ] Run and verify all pending migrations
- [ ] Smoke-test core endpoints after migration
- [ ] Confirm Celery worker and Redis connectivity in deployment environment

---

## 4) Priority Backlog

Legend:
- `P0` = Production blocker
- `P1` = High value before/at launch
- `P2` = Important post-launch stabilization
- `P3` = Growth/expansion

### P1 - Launch Hardening

#### Auth and Session UX
- [x] Implement or finalize 5-minute session expiry warning UX
- [x] Ensure refresh/logout edge cases are consistent across tabs

#### Chat Reliability and Safety
- [x] Add typing indicators (websocket emit/consume + inactivity timeout polish)
- [x] Add delivery/read status indicators in UI (queued/sending/delivered/read states)
- [x] Add robust reconnect handling and replay behavior (bounded reconnect/backoff + queued message replay)
- [x] Add message rate limiting (user + conversation scope)

#### Frontend Consistency
- [x] Enforce profile-completion guard on all property creation paths
- [x] Apply idempotent action guard to high-impact mutations (create property, lead/contact, critical state changes)
- [x] Standardize loading/error/empty states where still inconsistent

### P2 - Quality and Product Stability

#### Testing
- [x] Frontend: Tests for auth API (OTP, Google OAuth, refresh, logout, profile fetch)
- [x] Frontend: Tests for auth store (session, error, loading, user updates)
- [x] Frontend: Tests for properties API (CRUD, filtering, publishing, deletion)
- [x] Frontend: Tests for chat/messaging API (conversations, messages, typing, read receipts, rate limiting)
- [x] Frontend: Tests for favorites, leads, and contacts APIs
- [x] Frontend: Tests for idempotent action guards (mutation deduplication)
- [x] Frontend: Component tests for property creation guards (profile completion validation)
- [ ] Backend: API + service tests for auth, permissions, and lifecycle transitions (prioritize permissions checks)
- [ ] Backend: Integration tests for chat WebSocket flows
- [ ] E2E: auth -> property create -> lead/contact -> chat happy path

#### Observability and Engineering Quality
- [ ] Integrate error monitoring (frontend + backend)
- [ ] Define local quality gate commands (lint, typecheck, tests)
- [ ] Enforce pull request checklist for testing and security review

#### Performance
- [ ] Audit N+1 patterns and optimize query prefetch/select usage
- [ ] Add caching strategy for expensive list/analytics endpoints
- [ ] Profile chat history pagination under realistic load

### P3 - Product Growth
- [ ] Advanced analytics UX (owner charts, trend drill-down)
- [ ] Monetization foundations (featured listings/subscription)
- [ ] Notification expansion (push/email templates)
- [ ] Communication expansion (future audio calling/WebRTC signaling)

---

## 5) 30-60-90 Day Plan

## Day 0-30: Secure and Stabilize
- Finish all P0 tasks
- Close chat safety/reliability gaps needed for launch
- Ship session expiry warning and route-level profile-completion guards
- Standardize code quality and test expectations across teams

Success criteria:
- No known credential exposure risk
- Production config validated
- Core flows stable under smoke/regression tests

## Day 31-60: Quality and Operability
- Build automated test baseline (backend + frontend + E2E critical path)
- Integrate monitoring/alerts
- Fix highest-impact UX inconsistencies from production telemetry

Success criteria:
- Repeatable local quality checks passing before merge
- Actionable error tracking in place
- Reduced regression risk on auth/property/chat modules

## Day 61-90: Scale and Differentiation
- Performance optimization pass
- Analytics UX improvements for owners
- Begin monetization and notification enhancements

Success criteria:
- Improved response times on key pages
- Owner analytics adoption increases
- Roadmap ready for growth features without destabilizing core product

---

## 6) Current Focus (Active Work Queue)

| Task | Priority | Owner | Status |
| --- | --- | --- | --- |
| Firebase key rotation + env update | P0 | Manual/Ops | Pending |
| Production env lockdown | P0 | Manual/Ops | Pending |
| Migrations + smoke verification | P0 | Backend | Pending |
| Session expiry warning UX | P1 | Frontend | Completed |
| Chat delivery/read/typing UX | P1 | Frontend | Completed |
| Message rate limiting for chat | P1 | Backend | Completed |
| Idempotent action guards for mutations | P1 | Frontend | Completed |
| Loading/error/empty state standardization | P1 | Frontend | Completed |

---

## 7) Review Notes (Roadmap Corrections)

The previous roadmap mixed historical and aspirational states. This version is corrected to:
- reflect verified implementation status,
- separate confirmed complete work from partial claims,
- isolate true production blockers,
- and provide an execution order that reduces launch risk first.

---

## 8) Production Standardization Framework

Use this as the baseline standard for backend and frontend product work.

Note: DevOps and deployment standardization are intentionally deferred for now.

### 8.1 Code and Architecture Standards
- [ ] Keep business logic in service layer only (no heavy logic in views/components)
- [ ] Enforce strict TypeScript and lint rules in team quality checks (no ignored errors)
- [ ] Enforce Python formatting + linting + import sorting (black/isort/ruff or equivalent)
- [ ] Add and maintain ADRs for major architecture changes
- [ ] Ensure all API responses follow a consistent schema (success/error/meta)

### 8.2 Security Standards
- [ ] Secret management only through environment/secret manager (never in git)
- [ ] Rotation policy for Firebase, JWT secrets, DB credentials, and third-party API keys
- [ ] OWASP baseline: input validation, output encoding, authz checks, and audit logs
- [ ] Dependency vulnerability scanning (frontend and backend)
- [ ] Mandatory incident response runbook (credential leak, auth abuse, outage)

### 8.3 API and Data Standards
- [ ] API versioning policy (`/api/v1`) with deprecation strategy
- [ ] OpenAPI spec updated on every API contract change
- [ ] Request/response DTO validation for every endpoint
- [ ] Database migration policy: backward-compatible, reversible where possible
- [ ] Data retention and cleanup policy for logs, notifications, and analytics events

### 8.4 Testing Standards
- [ ] Backend coverage target >= 75% on services and critical APIs
- [ ] Frontend coverage target >= 60% on critical flows/components
- [ ] E2E coverage for auth, property publish, leads, chat, and notifications
- [ ] Contract tests between frontend and backend on key endpoints
- [ ] PR review requires evidence of passing tests and type checks

### 8.5 Observability Standards
- [ ] Centralized logging with correlation/request IDs across frontend/backend
- [ ] Error monitoring with alert routing (critical/high severity)
- [ ] SLO dashboard: API latency, error rate, auth failure rate, websocket health
- [ ] Business KPIs: lead conversion, owner response time, chat engagement
- [ ] Postmortem template for production incidents

---

## 9) Standard Definition Of Done (DoD)

A feature is considered complete only if all items below are true.

- [ ] Functional behavior is implemented and manually verified
- [ ] Unit/integration tests added and passing
- [ ] Security and permission checks validated
- [ ] Logging and error states implemented
- [ ] API docs and technical docs updated
- [ ] Performance impact checked (query count, payload size, render behavior)
- [ ] Feature flag or safe fallback path defined for risky changes
- [ ] QA checklist passed on desktop and mobile critical breakpoints

---

## 10) In-Scope Quality Gate (Non-DevOps)

Mark current release candidate as ready only when all in-scope gates pass:

- [ ] No open P0 issues
- [ ] No unreviewed high-risk security findings
- [ ] Local lint/typecheck/tests pass for changed modules
- [ ] Critical path smoke tests pass (auth, property, lead/contact, chat)
- [ ] Monitoring and alerts for application errors are active

---

## 11) Standardization Sprint Plan (Without DevOps/Deployment)

### Sprint A (1 week): Baseline Product Standards
- [ ] Finalize lint/format/type rules across frontend and backend
- [ ] Define and document local quality gate commands
- [ ] Create security and incident checklist for application-level issues

### Sprint B (1 week): Security and Reliability Closure
- [ ] Complete all P0 credential + environment tasks
- [ ] Implement chat rate limiting and session warning UX
- [ ] Add monitoring and alert routing

### Sprint C (1-2 weeks): Test and Feature Hardening
- [ ] Raise automated test coverage to targets for critical modules
- [ ] Add E2E tests for end-to-end critical user journeys
- [ ] Validate in-scope quality gate before each release candidate

---

## 12) Suggested Next Implementation Steps

Prioritized next coding steps from the active roadmap queue:

1. Chat typing indicators (frontend + websocket event handling)
- [x] Add typing event emit/debounce on message input
- [x] Add typing event consume/render in active conversation header (auto-clear timeout polish)

2. Chat reconnect and replay hardening
- [x] Add robust websocket reconnect with bounded retry/backoff
- [x] Re-sync latest messages and conversation unread counts on reconnect
- [x] Queue outbound messages while disconnected and replay on reconnect

3. Targeted regression tests for recent chat/profile guard changes
- [x] Add backend tests for websocket message rate limiting behavior
- [x] Add frontend tests for owner profile-completion guard on property create flows
