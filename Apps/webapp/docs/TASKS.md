# WebApp Enterprise Tasks

This board tracks frontend work as production-grade milestones.

## Phase 0: Governance
- [x] Establish module-based folder structure (`modules`, `services`, `types`, `store`).
- [x] Add strict lint/build gates in CI-equivalent local commands.
- [x] Add pull-request checklist for security, accessibility, and API contract updates.
- [x] Add architecture decision records (ADR) for auth, caching, and state strategy.

## Phase 1: Foundation
- [x] Central API base URL configuration.
- [x] Query client setup with sane retry/staleness defaults.
- [x] Global auth session store with persistence.
- [x] Runtime environment validation for required `NEXT_PUBLIC_*` keys.
- [x] Structured frontend logger and request correlation IDs.
- [x] App-level error boundaries (`error.tsx`, `not-found.tsx`, `loading.tsx`).
- [x] Centralized route guard utilities (auth + role-aware).

## Phase 2: Core Product UX
- [x] Landing page.
- [x] Auth page with email OTP request + verify.
- [x] Dashboard page.
- [x] Properties list + filtering + trending.
- [x] Property detail page.
- [x] Favorite add/remove integration.
- [x] Contact owner CTA from property detail.
- [x] Notifications page (`list`, `unread count`, `mark-read`, `mark-all-read`).
- [x] Owner leads page (`/contacts/leads/`) with filters.
- [x] Profile page (`/users/me` read + patch).

## Phase 3: Enterprise API Coverage
- [x] Communication module UI: conversation list.
- [x] Communication module UI: real-time message thread.
- [x] Communication module UI: unread counters and delivery states.
- [x] Owner analytics dashboard (`/analytics/dashboard`).
- [x] Heatmap and demand trend views (role-restricted).
- [x] Property create/edit wizard with Cloudinary upload pipeline.

## Phase 4: Security & Reliability
- [x] Token refresh strategy and session expiry UX.
- [x] Idempotent mutation guards on high-impact actions.
- [x] Offline/retry queue for transient network failures.
- [ ] API schema contract tests (OpenAPI / typed client generation).
- [ ] End-to-end test coverage for auth + property + leads critical path.

## Phase 5: Performance & Observability
- [ ] Code-splitting per module boundary.
- [ ] Prefetch strategy for frequent navigation paths.
- [ ] Web vitals instrumentation and reporting pipeline.
- [ ] Client error monitoring integration (Sentry or equivalent).
- [ ] Request/response telemetry dashboard with endpoint latency.

## Definition Of Done (per page/module)
- [ ] API calls isolated in module `api.ts`.
- [ ] Hook abstraction in module `hooks.ts`.
- [ ] Typed request/response in `src/types`.
- [ ] Loading, error, empty, and success states implemented.
- [ ] Role/permission UI guards implemented.
- [ ] Lint and build pass without warnings.
